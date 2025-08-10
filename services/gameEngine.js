const ProvablyFair = require('../utils/provablyFair');
const cryptoService = require('./cryptoService');
const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.provablyFair = new ProvablyFair();
    this.currentGame = null;
    this.gameInterval = null;
    this.multiplierInterval = null;
    this.activePlayers = new Map(); // userId -> playerData
    this.gameRoundDuration = parseInt(process.env.GAME_ROUND_DURATION) || 10000;
    this.multiplierUpdateInterval = parseInt(process.env.MULTIPLIER_UPDATE_INTERVAL) || 100;
    this.currentMultiplier = 1.0;
    this.gameStartTime = null;
    this.crashPoint = null;
  }

  // Start a new game round
  async startNewGame() {
    try {
      // Reset provably fair
      this.provablyFair.reset();
      
      // Generate crash point
      this.crashPoint = this.provablyFair.generateCrashPoint();
      
      // Create new game in database
      const gameState = this.provablyFair.getGameState();
      this.currentGame = new Game({
        gameId: `game_${Date.now()}`,
        status: 'waiting',
        startTime: new Date(),
        crashPoint: this.crashPoint,
        serverSeed: gameState.serverSeed,
        clientSeed: gameState.clientSeed,
        nonce: gameState.nonce,
        hash: gameState.hash
      });
      
      await this.currentGame.save();
      
      // Reset game state
      this.activePlayers.clear();
      this.currentMultiplier = 1.0;
      this.gameStartTime = Date.now();
      
      // Emit new game event
      this.io.emit('newGame', {
        gameId: this.currentGame.gameId,
        startTime: this.currentGame.startTime,
        hash: gameState.hash
      });
      
      // Start game after 5 seconds
      setTimeout(() => {
        this.startGameRound();
      }, 5000);
      
    } catch (error) {
      console.error('Error starting new game:', error);
    }
  }

  // Start the actual game round
  startGameRound() {
    if (!this.currentGame) return;
    
    this.currentGame.status = 'active';
    this.currentGame.save();
    
    this.io.emit('gameStarted', {
      gameId: this.currentGame.gameId,
      startTime: Date.now()
    });
    
    // Start multiplier updates
    this.multiplierInterval = setInterval(() => {
      this.updateMultiplier();
    }, this.multiplierUpdateInterval);
    
    // Set game end timer
    this.gameInterval = setTimeout(() => {
      this.endGame();
    }, this.gameRoundDuration);
  }

  // Update multiplier during game
  updateMultiplier() {
    if (!this.currentGame || this.currentGame.status !== 'active') return;
    
    const elapsed = Date.now() - this.gameStartTime;
    const timeInSeconds = elapsed / 1000;
    
    // Exponential growth formula
    this.currentMultiplier = Math.pow(Math.E, 0.0001 * timeInSeconds);
    
    // Add to game history
    this.currentGame.gameHistory.push({
      timestamp: new Date(),
      multiplier: this.currentMultiplier,
      activePlayers: this.activePlayers.size
    });
    
    // Emit multiplier update
    this.io.emit('multiplierUpdate', {
      gameId: this.currentGame.gameId,
      multiplier: this.currentMultiplier,
      activePlayers: this.activePlayers.size
    });
    
    // Check if game should crash
    if (this.currentMultiplier >= this.crashPoint) {
      this.crashGame();
    }
  }

  // Handle game crash
  crashGame() {
    if (!this.currentGame || this.currentGame.status !== 'active') return;
    
    clearInterval(this.multiplierInterval);
    clearTimeout(this.gameInterval);
    
    this.currentGame.status = 'crashed';
    this.currentGame.endTime = new Date();
    this.currentGame.save();
    
    // Process all remaining players as losers
    this.activePlayers.forEach((playerData, userId) => {
      this.processLoss(userId, playerData);
    });
    
    this.activePlayers.clear();
    
    // Emit crash event
    this.io.emit('gameCrashed', {
      gameId: this.currentGame.gameId,
      crashPoint: this.crashPoint,
      finalMultiplier: this.currentMultiplier
    });
    
    // Start new game after 3 seconds
    setTimeout(() => {
      this.startNewGame();
    }, 3000);
  }

  // End game normally
  endGame() {
    if (!this.currentGame || this.currentGame.status !== 'active') return;
    
    clearInterval(this.multiplierInterval);
    
    this.currentGame.status = 'completed';
    this.currentGame.endTime = new Date();
    this.currentGame.save();
    
    // Process all remaining players as losers
    this.activePlayers.forEach((playerData, userId) => {
      this.processLoss(userId, playerData);
    });
    
    this.activePlayers.clear();
    
    // Start new game
    this.startNewGame();
  }

  // Handle player bet
  async handleBet(userId, betData) {
    try {
      const { amount, currency, cryptoType } = betData;
      
      // Validate bet
      if (amount <= 0) {
        throw new Error('Invalid bet amount');
      }
      
      if (!this.currentGame || this.currentGame.status !== 'waiting') {
        throw new Error('No active game accepting bets');
      }
      
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user already bet
      if (this.activePlayers.has(userId)) {
        throw new Error('Already placed a bet in this round');
      }
      
      // Convert USD to crypto if needed
      let cryptoAmount = 0;
      let exchangeRate = 0;
      
      if (currency === 'USD') {
        cryptoAmount = await cryptoService.usdToCrypto(amount, cryptoType);
        exchangeRate = await cryptoService.getExchangeRate(cryptoType);
      } else {
        cryptoAmount = amount;
        exchangeRate = await cryptoService.getExchangeRate(cryptoType);
      }
      
      // Check user balance
      const walletKey = cryptoType.toLowerCase();
      if (user.wallets[walletKey].balance < cryptoAmount) {
        throw new Error('Insufficient balance');
      }
      
      // Deduct from user balance
      user.wallets[walletKey].balance -= cryptoAmount;
      user.totalWagered += amount;
      await user.save();
      
      // Add player to active players
      this.activePlayers.set(userId, {
        userId,
        username: user.username,
        betAmount: amount,
        betCurrency: currency,
        cryptoAmount,
        cryptoType,
        exchangeRate,
        betTime: Date.now()
      });
      
      // Add to game
      this.currentGame.players.push({
        userId,
        username: user.username,
        betAmount: amount,
        betCurrency: currency
      });
      this.currentGame.totalBets++;
      this.currentGame.totalAmount += amount;
      await this.currentGame.save();
      
      // Create transaction record
      await Transaction.create({
        userId,
        gameId: this.currentGame.gameId,
        type: 'bet',
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency: cryptoType.toUpperCase(),
        exchangeRate,
        multiplier: 1
      });
      
      // Emit bet confirmation
      this.io.emit('playerBet', {
        gameId: this.currentGame.gameId,
        userId,
        username: user.username,
        amount,
        currency,
        totalBets: this.currentGame.totalBets
      });
      
      return { success: true, message: 'Bet placed successfully' };
      
    } catch (error) {
      console.error('Error handling bet:', error);
      return { success: false, message: error.message };
    }
  }

  // Handle player cashout
  async handleCashout(userId) {
    try {
      if (!this.currentGame || this.currentGame.status !== 'active') {
        throw new Error('No active game');
      }
      
      const playerData = this.activePlayers.get(userId);
      if (!playerData) {
        throw new Error('No active bet found');
      }
      
      // Calculate winnings
      const winAmount = playerData.betAmount * this.currentMultiplier;
      const winCryptoAmount = playerData.cryptoAmount * this.currentMultiplier;
      
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Add winnings to user balance
      const walletKey = playerData.cryptoType.toLowerCase();
      user.wallets[walletKey].balance += winCryptoAmount;
      user.totalWon += winAmount;
      user.gamesPlayed++;
      await user.save();
      
      // Remove from active players
      this.activePlayers.delete(userId);
      
      // Update game record
      const playerIndex = this.currentGame.players.findIndex(p => p.userId.toString() === userId);
      if (playerIndex !== -1) {
        this.currentGame.players[playerIndex].cashoutMultiplier = this.currentMultiplier;
        this.currentGame.players[playerIndex].cashoutAmount = winAmount;
        this.currentGame.players[playerIndex].profit = winAmount - playerData.betAmount;
        this.currentGame.players[playerIndex].cashoutTime = new Date();
        this.currentGame.players[playerIndex].isWinner = true;
        await this.currentGame.save();
      }
      
      // Create transaction record
      await Transaction.create({
        userId,
        gameId: this.currentGame.gameId,
        type: 'cashout',
        amount: winAmount,
        currency: playerData.betCurrency,
        cryptoAmount: winCryptoAmount,
        cryptoCurrency: playerData.cryptoType.toUpperCase(),
        exchangeRate: playerData.exchangeRate,
        multiplier: this.currentMultiplier
      });
      
      // Emit cashout event
      this.io.emit('playerCashout', {
        gameId: this.currentGame.gameId,
        userId,
        username: user.username,
        multiplier: this.currentMultiplier,
        winAmount,
        profit: winAmount - playerData.betAmount
      });
      
      return { success: true, message: 'Cashout successful' };
      
    } catch (error) {
      console.error('Error handling cashout:', error);
      return { success: false, message: error.message };
    }
  }

  // Process loss for remaining players
  async processLoss(userId, playerData) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      user.totalLost += playerData.betAmount;
      user.gamesPlayed++;
      await user.save();
      
      // Create transaction record
      await Transaction.create({
        userId,
        gameId: this.currentGame.gameId,
        type: 'loss',
        amount: playerData.betAmount,
        currency: playerData.betCurrency,
        cryptoAmount: playerData.cryptoAmount,
        cryptoCurrency: playerData.cryptoType.toUpperCase(),
        exchangeRate: playerData.exchangeRate,
        multiplier: this.currentMultiplier
      });
      
      // Update game record
      const playerIndex = this.currentGame.players.findIndex(p => p.userId.toString() === userId);
      if (playerIndex !== -1) {
        this.currentGame.players[playerIndex].isWinner = false;
        await this.currentGame.save();
      }
      
    } catch (error) {
      console.error('Error processing loss:', error);
    }
  }

  // Get current game state
  getCurrentGameState() {
    if (!this.currentGame) return null;
    
    return {
      gameId: this.currentGame.gameId,
      status: this.currentGame.status,
      startTime: this.currentGame.startTime,
      currentMultiplier: this.currentMultiplier,
      activePlayers: this.activePlayers.size,
      totalBets: this.currentGame.totalBets,
      totalAmount: this.currentGame.totalAmount,
      hash: this.currentGame.hash
    };
  }

  // Initialize game engine
  init() {
    this.startNewGame();
  }
}

module.exports = GameEngine;
