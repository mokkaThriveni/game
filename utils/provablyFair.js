const crypto = require('crypto');

class ProvablyFair {
  constructor() {
    this.serverSeed = this.generateServerSeed();
    this.clientSeed = crypto.randomBytes(16).toString('hex');
    this.nonce = 0;
  }

  // Generate a random server seed
  generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Set client seed (can be provided by player)
  setClientSeed(clientSeed) {
    this.clientSeed = clientSeed || crypto.randomBytes(16).toString('hex');
  }

  // Increment nonce for each game
  incrementNonce() {
    this.nonce++;
  }

  // Generate hash from seeds and nonce
  generateHash() {
    const data = `${this.serverSeed}-${this.clientSeed}-${this.nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate crash point using provably fair algorithm
  generateCrashPoint() {
    const hash = this.generateHash();
    
    // Use first 8 characters of hash as hex number
    const hex = hash.substring(0, 8);
    const decimal = parseInt(hex, 16);
    
    // Convert to float between 0 and 1
    const float = decimal / 0xffffffff;
    
    // Apply house edge and calculate crash point
    const houseEdge = 0.05; // 5% house edge
    const crashPoint = 1 / (1 - houseEdge - float * (1 - houseEdge));
    
    // Ensure minimum crash point of 1.0
    return Math.max(1.0, crashPoint);
  }

  // Verify crash point (for players to verify fairness)
  verifyCrashPoint(serverSeed, clientSeed, nonce, expectedCrashPoint) {
    const data = `${serverSeed}-${clientSeed}-${nonce}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    const hex = hash.substring(0, 8);
    const decimal = parseInt(hex, 16);
    const float = decimal / 0xffffffff;
    
    const houseEdge = 0.05;
    const calculatedCrashPoint = 1 / (1 - houseEdge - float * (1 - houseEdge));
    
    return Math.abs(calculatedCrashPoint - expectedCrashPoint) < 0.0001;
  }

  // Get current game state
  getGameState() {
    return {
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
      hash: this.generateHash()
    };
  }

  // Reset for new game
  reset() {
    this.serverSeed = this.generateServerSeed();
    this.clientSeed = crypto.randomBytes(16).toString('hex');
    this.incrementNonce();
  }
}

module.exports = ProvablyFair;
