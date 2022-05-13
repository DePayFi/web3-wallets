import { getWallet, wallets, supported } from 'src'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc', 'polygon'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(async()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
        })

        it('provides an accounts function that returns empty list of accounts', async () => {
          expect(await new wallets.WalletConnect().accounts()).toStrictEqual([])
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WalletConnect().account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns empty list of accounts', async () => {
          expect(await new wallets.WalletConnect().connect()).toStrictEqual([])
        })
      })

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(async()=>{
          mock({ blockchain, accounts: { return: accounts } })
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
          await new wallets.WalletConnect().connect()
        })

        it('requires to be connected first', async()=> {
          let accounts = getWallet().connect()
          expect(accounts).toEqual(accounts)
        });

        it('provides a wallet name', async()=> {
          expect(getWallet().name).toEqual('WalletConnect')
        })

        it('provides a wallet logo', async()=> {
          expect(getWallet().logo).toEqual("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 500 500' style='enable-background:new 0 0 500 500;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%235991CD;%7D%0A%3C/style%3E%3Cg id='Page-1'%3E%3Cg id='walletconnect-logo-alt'%3E%3Cpath id='WalletConnect' class='st0' d='M102.7,162c81.5-79.8,213.6-79.8,295.1,0l9.8,9.6c4.1,4,4.1,10.5,0,14.4L374,218.9 c-2,2-5.3,2-7.4,0l-13.5-13.2c-56.8-55.7-149-55.7-205.8,0l-14.5,14.1c-2,2-5.3,2-7.4,0L91.9,187c-4.1-4-4.1-10.5,0-14.4 L102.7,162z M467.1,229.9l29.9,29.2c4.1,4,4.1,10.5,0,14.4L362.3,405.4c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L252,311.9 c-1-1-2.7-1-3.7,0h0l-95.5,93.5c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L3.4,273.6c-4.1-4-4.1-10.5,0-14.4l29.9-29.2 c4.1-4,10.7-4,14.8,0l95.5,93.5c1,1,2.7,1,3.7,0c0,0,0,0,0,0l95.5-93.5c4.1-4,10.7-4,14.8,0c0,0,0,0,0,0l95.5,93.5 c1,1,2.7,1,3.7,0l95.5-93.5C456.4,225.9,463,225.9,467.1,229.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A")
        })

        it('provides currently connected main account', async()=> {
          expect(await getWallet().account()).toEqual(accounts[0])
        })

        it('provides currently connected accounts', async()=> {
          expect(await getWallet().accounts()).toEqual(accounts)
        })

        it('provides the walletConnect wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(getWallet().name).toEqual('WalletConnect')
        })

        it('receives supported blockchains', async()=> {
          expect(getWallet().blockchains).toEqual(['ethereum', 'bsc', 'polygon'])
        })

        it('receives connected blockchain', async()=> {
          expect(await getWallet().connectedTo(blockchain)).toEqual(true)
          expect(await getWallet().connectedTo()).toEqual(blockchain)
        })

        it('rejects switchTo with NOT_SUPPORTED', async()=> {
          await expect(
            getWallet().switchTo('bsc')
          ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
        })

        it('rejects addNetwork with NOT_SUPPORTED', async()=> {
          await expect(
            getWallet().addNetwork('bsc')
          ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
        })
      })
    })
  })
});
