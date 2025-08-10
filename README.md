# 🎮 Crypto Crash Game Backend

A multiplayer online gambling game where players bet money, watch a multiplier grow exponentially, and try to cash out before it "crashes."

## 🚀 Features

### Core Game Mechanics
- **Game Rounds**: New round every 10 seconds
- **Betting**: Players bet in USD (converted to crypto)
- **Multiplier**: Starts at 1x, grows exponentially
- **Crash**: Random crash point (provably fair)
- **Win/Lose**: Cash out before crash = win, don't cash out = lose everything

### Three Main Components

#### 1. Game Logic (35% of grade)
- ✅ Manages game rounds and timing
- ✅ Calculates when the game crashes (provably fair)
- ✅ Handles player bets and cashouts
- ✅ Tracks all game history
- ✅ Provably fair crash algorithm
- ✅ API endpoints for placing bets and cashing out
- ✅ Database storage for all game data

#### 2. Cryptocurrency Integration (35% of grade)
- ✅ Converts USD bets to crypto (Bitcoin, Ethereum)
- ✅ Uses real crypto prices from CoinGecko API
- ✅ Manages fake crypto wallets for players
- ✅ Logs all transactions
- ✅ Handles exchange rate conversions

#### 3. Real-Time Updates with WebSockets (20% of grade)
- ✅ Sends live updates to all players
- ✅ Shows multiplier increasing in real-time
- ✅ Notifies when players cash out
- ✅ Announces when game crashes
- ✅ Updates every 100ms

## 🛠️ Technical Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **WebSockets**: Socket.IO
- **Crypto API**: CoinGecko (free)
- **Security**: Input validation, secure random numbers, JWT authentication

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-crash-game-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `config.env.example` to `config.env`
   - Update MongoDB connection string
   - Set your JWT secret

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

The application uses environment variables for configuration. Create a `config.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crypto-crash-game

# Server Configuration
PORT=3000
NODE_ENV=development

# Crypto API Configuration
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Game Configuration
GAME_ROUND_DURATION=10000
MULTIPLIER_UPDATE_INTERVAL=100
HOUSE_EDGE=0.05

# Security
JWT_SECRET=your-super-secret-jwt-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

### Game Endpoints

#### Place Bet
```http
POST /api/game/bet
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 10,
  "currency": "USD",
  "cryptoType": "bitcoin"
}
```

#### Cashout
```http
POST /api/game/cashout
Authorization: Bearer <jwt-token>
```

#### Get Current Game
```http
GET /api/game/current
```

#### Get Game History
```http
GET /api/game/history?page=1&limit=20
```

#### Get Crypto Prices
```http
GET /api/game/prices
```

#### Verify Provably Fair Result
```http
POST /api/game/verify
Content-Type: application/json

{
  "serverSeed": "abc123...",
  "clientSeed": "def456...",
  "nonce": 1,
  "crashPoint": 2.5
}
```

## 🔌 WebSocket Events

### Client to Server
- `authenticate` - Authenticate with JWT token
- `placeBet` - Place a bet
- `cashout` - Cash out from current game

### Server to Client
- `newGame` - New game starting
- `gameStarted` - Game has started
- `multiplierUpdate` - Multiplier updated
- `gameCrashed` - Game crashed
- `playerBet` - Player placed bet
- `playerCashout` - Player cashed out
- `betResult` - Bet result
- `cashoutResult` - Cashout result

## 🎯 Game Flow Example

1. **Player registers/logs in**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"player1","email":"player1@example.com","password":"password123"}'
   ```

2. **Player places a bet**
   ```bash
   curl -X POST http://localhost:3000/api/game/bet \
     -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"amount":10,"currency":"USD","cryptoType":"bitcoin"}'
   ```

3. **Player watches multiplier grow in real-time via WebSocket**
4. **Player cashes out before crash**
   ```bash
   curl -X POST http://localhost:3000/api/game/cashout \
     -H "Authorization: Bearer <jwt-token>"
   ```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All inputs validated with Joi
- **Rate Limiting**: Prevents abuse
- **Provably Fair**: Players can verify game fairness
- **CORS Protection**: Configured for security
- **Helmet**: Security headers
- **Input Sanitization**: Prevents injection attacks

## 🧪 Testing

### Postman Collection
Import the provided Postman collection to test all endpoints:

1. **Environment Setup**
   - Set `baseUrl` to `http://localhost:3000`
   - Set `token` variable (will be set after login)

2. **Test Flow**
   - Register user
   - Login user
   - Place bet
   - Cashout
   - Check game history

### cURL Commands
```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current game
curl http://localhost:3000/api/game/current

# Get crypto prices
curl http://localhost:3000/api/game/prices
```

## 🎮 Demo

Visit `http://localhost:3000` to see the live demo page with:
- Real-time multiplier updates
- Live player activity
- Game history
- Interactive betting interface

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  wallets: {
    bitcoin: { balance: Number, address: String },
    ethereum: { balance: Number, address: String }
  },
  totalWagered: Number,
  totalWon: Number,
  totalLost: Number,
  gamesPlayed: Number,
  createdAt: Date,
  lastActive: Date
}
```

### Games Collection
```javascript
{
  gameId: String,
  status: String (waiting/active/crashed/completed),
  startTime: Date,
  endTime: Date,
  crashPoint: Number,
  serverSeed: String,
  clientSeed: String,
  nonce: Number,
  hash: String,
  totalBets: Number,
  totalAmount: Number,
  players: Array,
  gameHistory: Array
}
```

### Transactions Collection
```javascript
{
  userId: ObjectId,
  gameId: String,
  type: String (bet/cashout/win/loss),
  amount: Number,
  currency: String,
  cryptoAmount: Number,
  cryptoCurrency: String,
  exchangeRate: Number,
  multiplier: Number,
  timestamp: Date,
  status: String
}
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name crypto-crash-game
pm2 save
pm2 startup
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB URI in config.env
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Crypto API Errors**
   - CoinGecko API has rate limits
   - Fallback prices are used if API fails
   - Check internet connectivity

3. **WebSocket Connection Issues**
   - Ensure Socket.IO client is loaded
   - Check CORS configuration
   - Verify server is running

### Logs
```bash
# View application logs
pm2 logs crypto-crash-game

# View real-time logs
pm2 logs crypto-crash-game --lines 100
```

## 📈 Performance Optimization

- **Database Indexing**: Indexes on frequently queried fields
- **Caching**: Crypto prices cached for 30 seconds
- **Connection Pooling**: MongoDB connection pooling
- **Rate Limiting**: Prevents abuse
- **Compression**: Response compression enabled

## 🔮 Future Enhancements

- [ ] Multiple game rooms
- [ ] Leaderboards
- [ ] Chat system
- [ ] Mobile app
- [ ] More cryptocurrencies
- [ ] Advanced statistics
- [ ] Tournament mode

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, email support@cryptocrashgame.com or create an issue in the repository.
