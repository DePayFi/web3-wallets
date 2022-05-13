import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallet, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('WalletLink events', () => {

  ['ethereum', 'bsc', 'polygon'].forEach((blockchain)=>{

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

        it('registers a callback and informs about wallet accounts changes', async () => {
          let walletsChangedTo;

          mock(blockchain)

          getWallet().on('accounts', (newAccounts)=>{
            walletsChangedTo = newAccounts;
          })

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletsChangedTo).toEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])
        })

        it('allows to deregister accounts changed event', async () => {
          let walletsChangedTo;

          mock(blockchain)

          let callback = getWallet().on('accounts', (newAccounts)=>{
            walletsChangedTo = newAccounts;
          })

          getWallet().off('accounts', callback)

          trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

          expect(walletsChangedTo).toEqual(undefined)
        })

        it('registers a callback and informs about wallet changes network', async () => {
          let networkChangedTo;

          mock(blockchain)

          getWallet().on('network', (newNetwork)=>{
            networkChangedTo = newNetwork;
          })

          trigger('chainChanged', '0x38')
          expect(networkChangedTo).toEqual('bsc')

          trigger('chainChanged', '0x89')
          expect(networkChangedTo).toEqual('polygon')

          trigger('chainChanged', '0x1')
          expect(networkChangedTo).toEqual('ethereum')
        })

        it('allows to deregisters network change event', async () => {
          let networkChangedTo;

          mock(blockchain)

          let callback = getWallet().on('network', (newNetwork)=>{
            networkChangedTo = newNetwork;
          })

          getWallet().off('network', callback)

          trigger('chainChanged', '0x38')
          expect(networkChangedTo).toEqual(undefined)
        })

        it('registers a callback and informs about wallet having been disconnected', async () => {

          mock(blockchain)

          let disconnectCalled

          getWallet().on('disconnect', ()=>{
            disconnectCalled = true
          })

          await trigger('disconnect')

          expect(disconnectCalled).toEqual(true)
        })

        it('allows to deregisters a a disconnect callback', async () => {

          mock(blockchain)

          let disconnectCalled

          let callback = getWallet().on('disconnect', ()=>{
            disconnectCalled = true
          })

          getWallet().off('disconnect', callback)

          await trigger('disconnect')

          expect(disconnectCalled).toEqual(undefined)
        })
      })
    })
  })
})
