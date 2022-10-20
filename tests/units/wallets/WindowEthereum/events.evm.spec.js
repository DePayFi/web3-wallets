import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallets, wallets } from 'src/index.evm'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains.evm'

describe('window.ethereum wallet events (evm)', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(()=>resetMocks())
        beforeEach(()=>{
          mock({ blockchain, accounts: { return: [account] } })
          wallet = getWallets()[0]
        })

        it('registers a callback and informs about wallet account change', async () => {
          let walletChangedTo;

          mock(blockchain)

          wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount;
          })

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletChangedTo).toEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
        })

        it('allows to deregisters account change event', async () => {
          let walletChangedTo;

          mock(blockchain)

          let callback = wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount;
          })

          wallet.off('account', callback)

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletChangedTo).toEqual(undefined)
        })
      })
    })
  })
})
