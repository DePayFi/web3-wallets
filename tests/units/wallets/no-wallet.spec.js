import { getWallet } from 'src'

describe('no wallet found', () => {
  
  it('returns undefined for getWallet', () => {
    expect(getWallet()).toBe(undefined);
  });
});
