const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  wallets: {
    bitcoin: {
      balance: { type: Number, default: 0 },
      address: { type: String, default: '' }
    },
    ethereum: {
      balance: { type: Number, default: 0 },
      address: { type: String, default: '' }
    }
  },
  totalWagered: { type: Number, default: 0 },
  totalWon: { type: Number, default: 0 },
  totalLost: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
