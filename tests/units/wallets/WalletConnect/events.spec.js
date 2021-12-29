import { getWallet, wallets, supported } from 'src'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    const wallet = supported[0]

    describe(blockchain, ()=> {

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
        beforeEach(()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallet.connector })
        })

        it('register an event to be called back if walletConnect disconnects', async()=> {
          let disconnectCalled
          wallet.on('disconnect', ()=>{
            disconnectCalled = true
          })
          trigger('disconnect')
          expect(disconnectCalled).toEqual(true)
        })

        it('allows to deregister an event to be called back if walletConnect disconnects', async()=> {
          let disconnectCalled
          let callback = wallet.on('disconnect', ()=>{
            disconnectCalled = true
          })
          wallet.off('disconnect', callback)
          trigger('disconnect')
          expect(disconnectCalled).toEqual(undefined)
        })

        it('register an event to be called back if network changes', async()=> {
          let newNetworkName
          wallet.on('network', (networkName)=>{
            newNetworkName = networkName
          })
          trigger('session_update', [null, { params: [{ chainId: 1 }] }])
          expect(newNetworkName).toEqual('ethereum')
          trigger('session_update', [null, { params: [{ chainId: 56 }] }])
          expect(newNetworkName).toEqual('bsc')
        })

        it('allows to deregister an event to be called back if network changes', async()=> {
          let newNetworkName
          let callback = wallet.on('network', (networkName)=>{
            newNetworkName = networkName
          })
          wallet.off('network', callback)
          trigger('session_update', [null, { params: [{ chainId: 1 }] }])
          expect(newNetworkName).toEqual(undefined)
        })

        it('register an event to be called back if accounts change', async()=> {
          let newAccounts
          wallet.on('accounts', (accounts)=>{
            newAccounts = accounts
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccounts).toEqual(accounts)
        })

        it('allows to deregister an event to be called back if accounts change', async()=> {
          let newAccounts
          let callback = wallet.on('accounts', (accounts)=>{
            newAccounts = accounts
          })
          wallet.off('accounts', callback)
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccounts).toEqual(undefined)
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          wallet.on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(accounts[0])
        })

        it('allows to deregister an event to be called back if account change', async()=> {
          let newAccount
          let callback = wallet.on('account', (account)=>{
            newAccount = account
          })
          wallet.off('account', callback)
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(undefined)
        })
      })
    })
  })
});
