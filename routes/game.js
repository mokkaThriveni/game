const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const cryptoService = require('../services/cryptoService');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Validation schemas
const betSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('USD', 'BTC', 'ETH').required(),
  cryptoType: Joi.string().valid('bitcoin', 'ethereum').required()
});

// Place a bet
router.post('/bet', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = betSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { amount, currency, cryptoType } = value;
    const userId = req.user.userId;

    // Get current game state from global game engine
    const gameState = global.gameEngine.getCurrentGameState();
    if (!gameState || gameState.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'No active game accepting bets' });
    }

    // Handle bet through game engine
    const result = await global.gameEngine.handleBet(userId, { amount, currency, cryptoType });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Cashout from current game
router.post('/cashout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Handle cashout through game engine
    const result = await global.gameEngine.handleCashout(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Cashout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current game state
router.get('/current', async (req, res) => {
  try {
    const gameState = global.gameEngine.getCurrentGameState();
    
    if (!gameState) {
      return res.status(404).json({ success: false, message: 'No active game' });
    }

    res.json({
      success: true,
      game: gameState
    });

  } catch (error) {
    console.error('Get current game error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get game history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const games = await Game.find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .select('gameId status startTime endTime crashPoint totalBets totalAmount players');

    const total = await Game.countDocuments();

    res.json({
      success: true,
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get specific game details
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findOne({ gameId })
      .populate('players.userId', 'username');

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({
      success: true,
      game
    });

  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user's transaction history
router.get('/transactions/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId });

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get crypto prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await cryptoService.getCryptoPrices();
    
    res.json({
      success: true,
      prices
    });

  } catch (error) {
    console.error('Get crypto prices error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify provably fair result
router.post('/verify', async (req, res) => {
  try {
    const { serverSeed, clientSeed, nonce, crashPoint } = req.body;

    if (!serverSeed || !clientSeed || nonce === undefined || !crashPoint) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const ProvablyFair = require('../utils/provablyFair');
    const provablyFair = new ProvablyFair();
    
    const isValid = provablyFair.verifyCrashPoint(serverSeed, clientSeed, nonce, crashPoint);

    res.json({
      success: true,
      isValid,
      message: isValid ? 'Result is provably fair' : 'Result verification failed'
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
