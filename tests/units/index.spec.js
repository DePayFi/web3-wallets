import { getWallet } from 'dist/cjs/index.js';

describe('depay-crypto-wallets', () => {
  
  it('should export getWallet function', () => {
    expect(typeof(getWallet)).toBe('function');
  });
  
});
