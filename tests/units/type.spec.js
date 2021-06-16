import { wallet } from 'dist/cjs/index.js';

describe('type', () => {
  
  it('should return undefined if no wallet was found at all', () => {
    expect(wallet.type()).toBe(undefined);
  });
  
});
