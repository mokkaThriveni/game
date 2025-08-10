const axios = require('axios');

class CryptoService {
  constructor() {
    this.baseUrl = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Get current crypto prices
  async getCryptoPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd'
        },
        timeout: 5000
      });

      return {
        bitcoin: response.data.bitcoin.usd,
        ethereum: response.data.ethereum.usd
      };
    } catch (error) {
      console.error('Error fetching crypto prices:', error.message);
      // Fallback prices if API fails
      return {
        bitcoin: 60000,
        ethereum: 3000
      };
    }
  }

  // Convert USD to crypto
  async usdToCrypto(usdAmount, cryptoType) {
    const prices = await this.getCryptoPrices();
    const price = prices[cryptoType.toLowerCase()];
    
    if (!price) {
      throw new Error(`Invalid cryptocurrency: ${cryptoType}`);
    }

    return usdAmount / price;
  }

  // Convert crypto to USD
  async cryptoToUsd(cryptoAmount, cryptoType) {
    const prices = await this.getCryptoPrices();
    const price = prices[cryptoType.toLowerCase()];
    
    if (!price) {
      throw new Error(`Invalid cryptocurrency: ${cryptoType}`);
    }

    return cryptoAmount * price;
  }

  // Get exchange rate for a specific crypto
  async getExchangeRate(cryptoType) {
    const prices = await this.getCryptoPrices();
    return prices[cryptoType.toLowerCase()];
  }

  // Generate fake wallet address
  generateWalletAddress(cryptoType) {
    const prefix = cryptoType.toLowerCase() === 'bitcoin' ? 'bc1' : '0x';
    const randomBytes = require('crypto').randomBytes(20).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  // Validate wallet address format
  validateWalletAddress(address, cryptoType) {
    if (cryptoType.toLowerCase() === 'bitcoin') {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    } else if (cryptoType.toLowerCase() === 'ethereum') {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    return false;
  }

  // Format crypto amount with proper decimals
  formatCryptoAmount(amount, cryptoType) {
    const decimals = cryptoType.toLowerCase() === 'bitcoin' ? 8 : 18;
    return parseFloat(amount.toFixed(decimals));
  }

  // Get cached price or fetch new one
  async getCachedPrice(cryptoType) {
    const cacheKey = `${cryptoType}_price`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.price;
    }

    const prices = await this.getCryptoPrices();
    const price = prices[cryptoType.toLowerCase()];
    
    this.cache.set(cacheKey, {
      price,
      timestamp: Date.now()
    });

    return price;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CryptoService();
