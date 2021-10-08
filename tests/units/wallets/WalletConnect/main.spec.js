import { getWallet, wallets, supported } from 'src'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from 'depay-web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
        })

        it('provides an accounts function that returns empty list of accounts', async () => {
          expect(await wallets.WalletConnect.accounts()).toStrictEqual([])
        })

        it('provides an account function that returns undefined', async () => {
          expect(await wallets.WalletConnect.account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns empty list of accounts', async () => {
          expect(await wallets.WalletConnect.connect()).toStrictEqual([])
        })
      })

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        const wallet = supported[0]
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
        beforeEach(()=>mock({ blockchain, wallet: 'walletconnect', connector: wallet.connector }))

        it('requires to be connected first', async()=> {
          let accounts = await wallet.connect()
          expect(accounts).toEqual(accounts)
        });

        it('provides a wallet name', async()=> {
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('provides a wallet logo', async()=> {
          expect(wallet.logo).toEqual("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%233B99FC;%7D%0A%3C/style%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cpath id='WalletConnect' class='st0' d='M169.2,184.5c47.9-46.9,125.6-46.9,173.6,0l5.8,5.6c2.4,2.3,2.4,6.2,0,8.5L328.8,218 c-1.2,1.2-3.1,1.2-4.3,0l-7.9-7.8c-33.4-32.7-87.7-32.7-121.1,0l-8.5,8.3c-1.2,1.2-3.1,1.2-4.3,0l-19.7-19.3c-2.4-2.3-2.4-6.2,0-8.5 L169.2,184.5z M383.6,224.5l17.6,17.2c2.4,2.3,2.4,6.2,0,8.5L322,327.7c-2.4,2.3-6.3,2.3-8.7,0c0,0,0,0,0,0l-56.2-55 c-0.6-0.6-1.6-0.6-2.2,0c0,0,0,0,0,0l-56.2,55c-2.4,2.3-6.3,2.3-8.7,0c0,0,0,0,0,0l-79.2-77.5c-2.4-2.3-2.4-6.2,0-8.5l17.6-17.2 c2.4-2.3,6.3-2.3,8.7,0l56.2,55c0.6,0.6,1.6,0.6,2.2,0c0,0,0,0,0,0l56.2-55c2.4-2.3,6.3-2.3,8.7,0c0,0,0,0,0,0l56.2,55 c0.6,0.6,1.6,0.6,2.2,0l56.2-55C377.3,222.1,381.2,222.1,383.6,224.5z'/%3E%3C/svg%3E%0A")
        })

        it('provides currently connected main account', async()=> {
          expect(await wallet.account()).toEqual(accounts[0])
        })

        it('provides currently connected accounts', async()=> {
          expect(await wallet.accounts()).toEqual(accounts)
        })

        it('provides the walletConnect wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(getWallet().name).toEqual('WalletConnect')
        })

        it('receives supported blockchains', async()=> {
          expect(wallet.blockchains).toEqual(['ethereum', 'bsc'])
        })

        it('receives connected blockchain', async()=> {
          expect(await wallet.connectedTo(blockchain)).toEqual(true)
          expect(await wallet.connectedTo()).toEqual(blockchain)
        })

        it('register an event to be called back if walletConnect disconnects', async()=> {
          let disconnectCalled
          wallet.on('disconnect', ()=>{
            disconnectCalled = true
          })
          trigger('disconnect')
          expect(disconnectCalled).toEqual(true)
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

        it('register an event to be called back if accounts change', async()=> {
          let newAccounts
          wallet.on('accounts', (accounts)=>{
            newAccounts = accounts
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccounts).toEqual(accounts)
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          wallet.on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(accounts[0])
        })

        it('rejects switchTo with NOT_SUPPORTED', async()=> {
          await expect(
            wallet.switchTo('bsc')
          ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
        })

        it('rejects addNetwork with NOT_SUPPORTED', async()=> {
          await expect(
            wallet.addNetwork('bsc')
          ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
        })
      })
    })
  })
});
