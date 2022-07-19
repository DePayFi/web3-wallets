import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallet, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletLink events', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {


      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(()=>mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink }))

        it('registers a callback and informs about wallet account change', async () => {
          let walletChangedTo;

          mock(blockchain)

          getWallet().on('account', (newAccount)=>{
            walletChangedTo = newAccount;
          })

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletChangedTo).toEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
        })

        it('allows to deregisters account change event', async () => {
          let walletChangedTo;

          mock(blockchain)

          let callback = getWallet().on('account', (newAccount)=>{
            walletChangedTo = newAccount;
          })

          getWallet().off('account', callback)

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletChangedTo).toEqual(undefined)
        })

      })
    })
  })
})
