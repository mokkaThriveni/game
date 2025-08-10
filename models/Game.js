const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'crashed', 'completed'],
    default: 'waiting'
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  crashPoint: { type: Number },
  serverSeed: { type: String, required: true },
  clientSeed: { type: String, required: true },
  nonce: { type: Number, required: true },
  hash: { type: String, required: true },
  totalBets: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    betAmount: Number,
    betCurrency: String,
    cashoutMultiplier: Number,
    cashoutAmount: Number,
    profit: Number,
    cashoutTime: Date,
    isWinner: Boolean
  }],
  gameHistory: [{
    timestamp: Date,
    multiplier: Number,
    activePlayers: Number
  }]
});

module.exports = mongoose.model('Game', gameSchema);
