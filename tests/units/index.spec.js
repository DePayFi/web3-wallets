import { wallet } from 'dist/cjs/index.js';

describe('depay-multichain-crypto-wallets', () => {
  it('should export wallet', () => {
    expect(typeof(wallet)).toBe('object');
  });
});
