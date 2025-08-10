require('dotenv').config({ path: '../config.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const cryptoService = require('../services/cryptoService');

// Sample users data
const sampleUsers = [
  {
    username: 'player1',
    email: 'player1@example.com',
    password: 'password123',
    wallets: {
      bitcoin: {
        balance: 0.001, // ~$60 at $60k BTC price
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      ethereum: {
        balance: 0.01, // ~$30 at $3k ETH price
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }
    },
    totalWagered: 150,
    totalWon: 200,
    totalLost: 50,
    gamesPlayed: 15
  },
  {
    username: 'player2',
    email: 'player2@example.com',
    password: 'password123',
    wallets: {
      bitcoin: {
        balance: 0.002,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      ethereum: {
        balance: 0.02,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }
    },
    totalWagered: 300,
    totalWon: 450,
    totalLost: 100,
    gamesPlayed: 25
  },
  {
    username: 'player3',
    email: 'player3@example.com',
    password: 'password123',
    wallets: {
      bitcoin: {
        balance: 0.0005,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      ethereum: {
        balance: 0.005,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }
    },
    totalWagered: 75,
    totalWon: 120,
    totalLost: 30,
    gamesPlayed: 10
  },
  {
    username: 'highroller',
    email: 'highroller@example.com',
    password: 'password123',
    wallets: {
      bitcoin: {
        balance: 0.01,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      ethereum: {
        balance: 0.1,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }
    },
    totalWagered: 1000,
    totalWon: 1500,
    totalLost: 200,
    gamesPlayed: 50
  },
  {
    username: 'newbie',
    email: 'newbie@example.com',
    password: 'password123',
    wallets: {
      bitcoin: {
        balance: 0.0001,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      ethereum: {
        balance: 0.001,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }
    },
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    gamesPlayed: 0
  }
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return {
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          lastActive: new Date()
        };
      })
    );

    // Insert users
    const users = await User.insertMany(hashedUsers);
    console.log(`Created ${users.length} sample users`);

    // Display created users
    console.log('\nSample users created:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email})`);
      console.log(`  BTC: ${user.wallets.bitcoin.balance} | ETH: ${user.wallets.ethereum.balance}`);
      console.log(`  Games: ${user.gamesPlayed} | Wagered: $${user.totalWagered}`);
      console.log('');
    });

    console.log('✅ Database seeded successfully!');
    console.log('\nYou can now test the application with these accounts:');
    console.log('- player1@example.com / password123');
    console.log('- player2@example.com / password123');
    console.log('- player3@example.com / password123');
    console.log('- highroller@example.com / password123');
    console.log('- newbie@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedData();
