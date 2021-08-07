import { getWallet } from 'dist/cjs/index.js';

describe('no wallet found', () => {
  
  it('returns undefined for getWallet', () => {
    expect(getWallet()).toBe(undefined);
  });
});
