import { getWallet } from 'dist/cjs/index.js';

describe('no wallet found', () => {
  
  it('returns undefined for name', () => {
    expect(getWallet().name).toBe(undefined);
  });

  it('returns undefined for logo', () => {
    expect(getWallet().logo).toBe(undefined);
  });
});
