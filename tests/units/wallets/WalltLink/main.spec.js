import { getWallet, wallets, supported } from 'src'
import { Blockchain } from '@depay/web3-blockchains'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletLink'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('Coinbase WalletLink', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

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
          expect(getWallet().name).toEqual('Coinbase WalletLink')
        })

        it('provides a wallet logo', async()=> {
          expect(getWallet().logo).toEqual("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1Mi44IDYwLjUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUyLjggNjAuNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMxQjUzRTQ7fQoJLnN0MXtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOiNGRkZGRkY7fQo8L3N0eWxlPgo8Zz4KCTxyZWN0IHg9IjM0LjMiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iMCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIwIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjQ3LjUiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI1MC4xIiB5PSIwIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iMi43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iMi43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzkuNiIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDIuMiIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzkuNiIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDIuMiIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iMTAuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjEwLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIxMC41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMTAuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjUwLjEiIHk9IjEwLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNC4zIiB5PSIxMy4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iMTMuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM0LjMiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iMTUuOCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIxNS44IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMTUuOCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjQ3LjUiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI1MC4xIiB5PSIxNS44IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8L2c+CjxyZWN0IHg9IjguMSIgeT0iMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTAuOCIgeT0iMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjI2LjYiIHk9IjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjguMSIgeT0iNC42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIxMC44IiB5PSI0LjYiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjEzLjQiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTguNyIgeT0iNC42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyMS4zIiB5PSI0LjYiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjI2LjYiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iNS41IiB5PSI3LjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjEzLjQiIHk9IjcuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjcuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMjEuMyIgeT0iNy4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyMy45IiB5PSI3LjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjUuNSIgeT0iOS45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIxMC44IiB5PSI5LjkiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjE2IiB5PSI5LjkiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjIxLjMiIHk9IjkuOSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMjkuMiIgeT0iOS45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyLjkiIHk9IjEyLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjUuNSIgeT0iMTIuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iOC4xIiB5PSIxMi41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0NSIgeT0iMjEiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjQ1IiB5PSIyMy42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIyMy42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIyNi4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzMS41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzNC4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzOS40IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI0NC43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI0Ny4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIzOS43IiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Mi4zIiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8Zz4KCTxjaXJjbGUgY2xhc3M9InN0MCIgY3g9IjIyLjQiIGN5PSIzOC4xIiByPSIyMi4zIi8+Cgk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNi44LDM4LjFjMCw4LjYsNywxNS42LDE1LjYsMTUuNlMzOCw0Ni43LDM4LDM4LjFzLTctMTUuNi0xNS42LTE1LjZDMTMuNywyMi41LDYuOCwyOS40LDYuOCwzOC4xeiBNMTkuNCwzMwoJCWMtMS4xLDAtMiwwLjktMiwydjZjMCwxLjEsMC45LDIsMiwyaDZjMS4xLDAsMi0wLjksMi0ydi02YzAtMS4xLTAuOS0yLTItMkgxOS40eiIvPgo8L2c+CjxyZWN0IHg9IjUuNSIgeT0iMTUuMSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPC9zdmc+Cg==")
        })

        it('provides currently connected main account', async()=> {
          expect(await getWallet().account()).toEqual(accounts[0])
        })

        it('provides currently connected accounts', async()=> {
          expect(await getWallet().accounts()).toEqual(accounts)
        })

        it('provides the walletLink wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(getWallet().name).toEqual('Coinbase WalletLink')
        })

        it('receives supported blockchains', async()=> {
          expect(getWallet().blockchains).toEqual(['ethereum', 'bsc'])
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
