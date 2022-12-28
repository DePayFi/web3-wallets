import { getConnectedWallets } from 'src/index.evm'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains.evm'

describe('getConnectedWallets', () => {

  let wallet

  describe('with no supported wallet connected', ()=>{
    
    beforeEach(resetMocks)

    it('provides no connected wallets', async () => {
      expect(await getConnectedWallets()).toStrictEqual([])
    })
  })
  
  describe('with supported wallet connected', ()=>{

    const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    beforeEach(resetMocks)
    beforeEach(()=>{
      mock({ blockchain: 'ethereum', accounts: { return: [account] } })
    })

    it('provides list of connected wallets', async () => {
      expect((await getConnectedWallets()).map((wallet)=>wallet.name)).toStrictEqual(["Wallet (Ethereum)"])
    })
  })

  describe('with multiple supported wallets connected', ()=>{

    const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    beforeEach(resetMocks)
    beforeEach(()=>{
      mock({ blockchain: 'ethereum', accounts: { return: [account] } })
      mock({ blockchain: 'bsc', accounts: { return: [account] }, wallet: 'metamask' })
      mock({ blockchain: 'solana', accounts: { return: [account] }, wallet: 'phantom' })
    })

    it('provides list of connected wallets', async () => {
      expect((await getConnectedWallets()).map((wallet)=>wallet.name)).toStrictEqual(["MetaMask"])
    })
  })
})

