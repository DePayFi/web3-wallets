import { getWallets } from 'src'

describe('no wallet found', () => {
  
  it('returns [] for getWallets if no wallets have been found', () => {
    expect(getWallets()).toEqual([])
  });
});
