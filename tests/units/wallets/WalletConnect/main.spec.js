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
          expect(wallet.logo).toEqual("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 500 500' style='enable-background:new 0 0 500 500;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%235991CD;%7D%0A%3C/style%3E%3Cg id='Page-1'%3E%3Cg id='walletconnect-logo-alt'%3E%3Cpath id='WalletConnect' class='st0' d='M102.7,162c81.5-79.8,213.6-79.8,295.1,0l9.8,9.6c4.1,4,4.1,10.5,0,14.4L374,218.9 c-2,2-5.3,2-7.4,0l-13.5-13.2c-56.8-55.7-149-55.7-205.8,0l-14.5,14.1c-2,2-5.3,2-7.4,0L91.9,187c-4.1-4-4.1-10.5,0-14.4 L102.7,162z M467.1,229.9l29.9,29.2c4.1,4,4.1,10.5,0,14.4L362.3,405.4c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L252,311.9 c-1-1-2.7-1-3.7,0h0l-95.5,93.5c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L3.4,273.6c-4.1-4-4.1-10.5,0-14.4l29.9-29.2 c4.1-4,10.7-4,14.8,0l95.5,93.5c1,1,2.7,1,3.7,0c0,0,0,0,0,0l95.5-93.5c4.1-4,10.7-4,14.8,0c0,0,0,0,0,0l95.5,93.5 c1,1,2.7,1,3.7,0l95.5-93.5C456.4,225.9,463,225.9,467.1,229.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A")
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
