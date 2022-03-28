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
          expect(getWallet().logo).toEqual("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA2My44IDYzLjgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYzLjggNjMuODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMxQjUzRTQ7fQoJLnN0MXtmaWxsOm5vbmU7c3Ryb2tlOiNGRkZGRkY7c3Ryb2tlLXdpZHRoOjAuNTE7c3Ryb2tlLW1pdGVybGltaXQ6Mi4wNDt9Cgkuc3Qye2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxnPgoJPGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iMjYuMyIgY3k9IjM4LjEiIHI9IjIyLjMiLz4KCTxjaXJjbGUgY2xhc3M9InN0MSIgY3g9IjI2LjMiIGN5PSIzOC4xIiByPSIyMi4zIi8+Cgk8cGF0aCBjbGFzcz0ic3QyIiBkPSJNMTAuNywzOGMwLDguNiw3LDE1LjYsMTUuNiwxNS42YzguNiwwLDE1LjYtNywxNS42LTE1LjZjMC04LjYtNy0xNS42LTE1LjYtMTUuNkMxNy43LDIyLjQsMTAuNywyOS40LDEwLjcsMzh6CgkJIE0yMy4zLDMzYy0xLjEsMC0yLDAuOS0yLDJ2NmMwLDEuMSwwLjksMiwyLDJoNmMxLjEsMCwyLTAuOSwyLTJ2LTZjMC0xLjEtMC45LTItMi0ySDIzLjN6Ii8+CjwvZz4KPGc+Cgk8cmVjdCB4PSI0Ny43IiB5PSIxMC40IiB3aWR0aD0iNi42IiBoZWlnaHQ9IjYuNiIvPgoJPHBhdGggZD0iTTQzLjMsNS45djE1LjVoMTUuNVY1LjlINDMuM3ogTTU2LjUsMTkuMkg0NS41VjguMmgxMS4xVjE5LjJ6Ii8+CjwvZz4KPC9zdmc+Cg==")
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
