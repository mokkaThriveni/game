const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bet', 'cashout', 'win', 'loss'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['USD', 'BTC', 'ETH'],
    required: true
  },
  cryptoAmount: {
    type: Number,
    default: 0
  },
  cryptoCurrency: {
    type: String,
    enum: ['BTC', 'ETH'],
    default: null
  },
  exchangeRate: {
    type: Number,
    default: 0
  },
  multiplier: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
