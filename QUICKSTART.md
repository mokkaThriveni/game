# 🚀 Quick Start Guide

Get the Crypto Crash Game Backend running in 5 minutes!

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (free tier works)

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Environment
The `config.env` file is already configured with your MongoDB connection string. If you need to change it, edit the `MONGODB_URI` in `config.env`.

## Step 3: Seed Sample Data (Optional)
```bash
npm run seed
```
This creates 5 test users with crypto balances:
- player1@example.com / password123
- player2@example.com / password123
- player3@example.com / password123
- highroller@example.com / password123
- newbie@example.com / password123

## Step 4: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Step 5: Test the Application

### 🌐 Web Demo
Visit: http://localhost:3000
- Real-time multiplier updates
- Live player activity
- Interactive betting interface

### 📡 API Testing
Use the provided Postman collection:
1. Import `postman/Crypto_Crash_Game_API.postman_collection.json`
2. Set environment variable `baseUrl` to `http://localhost:3000`
3. Run the collection

### 🔧 Quick API Tests
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Get crypto prices
curl http://localhost:3000/api/game/prices
```

## 🎮 How to Play

1. **Register/Login** with one of the test accounts
2. **Place a bet** in USD (converted to crypto)
3. **Watch the multiplier** grow in real-time
4. **Cash out** before it crashes to win
5. **If you don't cash out** before crash, you lose everything

## 🔍 What's Running

- **Server**: Express.js on port 3000
- **Database**: MongoDB Atlas (cloud)
- **WebSockets**: Socket.IO for real-time updates
- **Crypto API**: CoinGecko for live prices
- **Demo**: HTML page at http://localhost:3000

## 🛠️ Troubleshooting

### MongoDB Connection Issues
- Check your internet connection
- Verify the MongoDB URI in `config.env`
- Ensure MongoDB Atlas IP whitelist includes your IP

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📊 Monitoring

Check the console output for:
- ✅ MongoDB connection status
- ✅ Game engine initialization
- ✅ WebSocket connections
- ✅ Game rounds and crashes

## 🎯 Success Indicators

You'll know it's working when you see:
```
🚀 Crypto Crash Game Backend running on port 3000
📊 Environment: development
🎮 Game rounds: 10000ms
⚡ Multiplier updates: 100ms
Connected to MongoDB
Game engine initialized
```

## 🔗 Next Steps

- Import the Postman collection for API testing
- Visit the web demo at http://localhost:3000
- Check the full documentation in README.md
- Explore the code structure in the project files

Happy gaming! 🎮
