import { getWallet, wallets, supported } from 'src'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc', 'polygon'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
        beforeEach(async ()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
          await new wallets.WalletConnect().connect()
          expect(getWallet().name).toEqual('WalletConnect')
        })

        it('register an event to be called back if walletConnect disconnects', async()=> {
          let disconnectCalled
          getWallet().on('disconnect', ()=>{
            disconnectCalled = true
          })
          trigger('disconnect')
          expect(disconnectCalled).toEqual(true)
        })

        it('allows to deregister an event to be called back if walletConnect disconnects', async()=> {
          let disconnectCalled
          let callback = getWallet().on('disconnect', ()=>{
            disconnectCalled = true
          })
          getWallet().off('disconnect', callback)
          trigger('disconnect')
          expect(disconnectCalled).toEqual(undefined)
        })

        it('register an event to be called back if network changes', async()=> {
          let newNetworkName
          getWallet().on('network', (networkName)=>{
            newNetworkName = networkName
          })
          trigger('session_update', [null, { params: [{ chainId: 1 }] }])
          expect(newNetworkName).toEqual('ethereum')
          trigger('session_update', [null, { params: [{ chainId: 56 }] }])
          expect(newNetworkName).toEqual('bsc')
        })

        it('allows to deregister an event to be called back if network changes', async()=> {
          let newNetworkName
          let callback = getWallet().on('network', (networkName)=>{
            newNetworkName = networkName
          })
          getWallet().off('network', callback)
          trigger('session_update', [null, { params: [{ chainId: 1 }] }])
          expect(newNetworkName).toEqual(undefined)
        })

        it('register an event to be called back if accounts change', async()=> {
          let newAccounts
          getWallet().on('accounts', (accounts)=>{
            newAccounts = accounts
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccounts).toEqual(accounts)
        })

        it('allows to deregister an event to be called back if accounts change', async()=> {
          let newAccounts
          let callback = getWallet().on('accounts', (accounts)=>{
            newAccounts = accounts
          })
          getWallet().off('accounts', callback)
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccounts).toEqual(undefined)
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          getWallet().on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(accounts[0])
        })

        it('allows to deregister an event to be called back if account change', async()=> {
          let newAccount
          let callback = getWallet().on('account', (account)=>{
            newAccount = account
          })
          getWallet().off('account', callback)
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(undefined)
        })
      })
    })
  })
});
