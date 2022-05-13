import { getWallet, wallets, supported } from 'src'
import { Blockchain } from '@depay/web3-blockchains'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletLink'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('Coinbase WalletLink', () => {

  ['ethereum', 'bsc', 'polygon'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(async()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink })
        })

        it('provides an accounts function that returns empty list of accounts', async () => {
          expect(await new wallets.WalletLink().accounts()).toStrictEqual([])
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WalletLink().account()).toStrictEqual(undefined)
        })
      })

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(async()=>{
          mock({ blockchain, accounts: { return: accounts } })
          mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink })
          await new wallets.WalletLink().connect()
        })

        it('requires to be connected first', async()=> {
          let accounts = getWallet().connect()
          expect(accounts).toEqual(accounts)
        });

        it('provides a wallet name', async()=> {
          expect(getWallet().name).toEqual('Coinbase')
        })

        it('provides a wallet logo', async()=> {
          expect(getWallet().logo).toEqual("data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 488.96 488.96'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:url(%23linear-gradient);%7D.cls-2%7Bfill:%234361ad;%7D%3C/style%3E%3ClinearGradient id='linear-gradient' x1='250' y1='7.35' x2='250' y2='496.32' gradientTransform='matrix(1, 0, 0, -1, 0, 502)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%233d5ba9'/%3E%3Cstop offset='1' stop-color='%234868b1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath class='cls-1' d='M250,5.68C114.87,5.68,5.52,115,5.52,250.17S114.87,494.65,250,494.65,494.48,385.29,494.48,250.17,385.13,5.68,250,5.68Zm0,387.54A143.06,143.06,0,1,1,393.05,250.17,143.11,143.11,0,0,1,250,393.22Z' transform='translate(-5.52 -5.68)'/%3E%3Cpath class='cls-2' d='M284.69,296.09H215.31a11,11,0,0,1-10.9-10.9V215.48a11,11,0,0,1,10.9-10.91H285a11,11,0,0,1,10.9,10.91v69.71A11.07,11.07,0,0,1,284.69,296.09Z' transform='translate(-5.52 -5.68)'/%3E%3C/svg%3E")
        })

        it('provides currently connected main account', async()=> {
          expect(await getWallet().account()).toEqual(accounts[0])
        })

        it('provides currently connected accounts', async()=> {
          expect(await getWallet().accounts()).toEqual(accounts)
        })

        it('provides the walletLink wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(getWallet().name).toEqual('Coinbase')
        })

        it('receives supported blockchains', async()=> {
          expect(getWallet().blockchains).toEqual(['ethereum', 'bsc', 'polygon'])
        })

        it('receives connected blockchain', async()=> {
          expect(await getWallet().connectedTo(blockchain)).toEqual(true)
          expect(await getWallet().connectedTo()).toEqual(blockchain)
        })

        it('allows to switch network', async ()=>{
          let switchMock = mock({
            blockchain: 'ethereum',
            network: { switchTo: 'bsc' }
          })
          let wallet = getWallet()
          await getWallet().switchTo('bsc')
          expect(switchMock).toHaveBeenCalled()
        })

        it('adds the network if the network you request to switch to does not exist and switches to it afterwards', async ()=>{
          let switchMock
          let blockchain = Blockchain.findByName('bsc')

          mock({
            blockchain: 'ethereum',
            network: { 
              switchTo: 'bsc',
              error: ()=>{
                switchMock = mock({
                  blockchain: 'ethereum',
                  network: { switchTo: 'bsc' }
                })
                return { code: 4902 }
              }
            }
          })

          let addMock = mock({
            blockchain: 'ethereum',
            network: {
              add: {
                chainId: blockchain.id,
                chainName: blockchain.fullName,
                nativeCurrency: {
                  name: blockchain.currency.name,
                  symbol: blockchain.currency.symbol,
                  decimals: blockchain.currency.decimals
                },
                rpcUrls: [blockchain.rpc],
                blockExplorerUrls: [blockchain.explorer],
                iconUrls: [blockchain.logo]
              }
            }
          })
          
          let wallet = getWallet()
          await wallet.switchTo('bsc')

          expect(switchMock).toHaveBeenCalled()
          expect(addMock).toHaveBeenCalled()
          expect(await wallet.connectedTo('bsc')).toEqual(true)
        })
      })
    })
  })
});
