import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallets, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('window.ethereum wallet', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WindowEthereum().account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns empty list of accounts', async () => {
          expect(await new wallets.WindowEthereum().connect()).toStrictEqual(undefined)
        })
      })

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(resetMocks)
        beforeEach(()=>{
          mock({ blockchain, accounts: { return: [account] } })
          wallet = getWallets()[0]
        })

        it('should detect any generic wallet integration that integrates window.ethereum', () => {
          mock(blockchain)
          expect(wallet.name).toBe('Wallet (Ethereum)')
        });

        it('provides a connect function', async () => {
          mock(blockchain)
          expect(await wallet.connect()).toStrictEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
        });

        it('provides an account function', async () => {
          mock(blockchain)
          expect(await wallet.account()).toStrictEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
        });

        it('provides a logo', async () => {
          mock(blockchain)
          expect(wallet.logo).toStrictEqual("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA0NDYuNCAzNzYuOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ2LjQgMzc2Ljg7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojODI4NDg3O30KCS5zdDF7ZmlsbDojMzQzNDM0O30KCS5zdDJ7ZmlsbDojOEM4QzhDO30KCS5zdDN7ZmlsbDojM0MzQzNCO30KCS5zdDR7ZmlsbDojMTQxNDE0O30KCS5zdDV7ZmlsbDojMzkzOTM5O30KPC9zdHlsZT4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTM4MS43LDExMC4yaDY0LjdWNDYuNWMwLTI1LjctMjAuOC00Ni41LTQ2LjUtNDYuNUg0Ni41QzIwLjgsMCwwLDIwLjgsMCw0Ni41djY1LjFoMzUuN2wyNi45LTI2LjkKCWMxLjUtMS41LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDc4LjZjNS4zLTI1LjUsMzAuMi00Miw1NS43LTM2LjdjMjUuNSw1LjMsNDIsMzAuMiwzNi43LDU1LjdjLTEuNiw3LjUtNC45LDE0LjYtOS44LDIwLjUKCWMtMC45LDEuMS0xLjksMi4yLTMsMy4zYy0xLjEsMS4xLTIuMiwyLjEtMy4zLDNjLTIwLjEsMTYuNi00OS45LDEzLjgtNjYuNS02LjNjLTQuOS01LjktOC4zLTEzLTkuOC0yMC42SDczLjJsLTI2LjksMjYuOAoJYy0xLjUsMS41LTMuNiwyLjUtNS43LDIuN2wwLDBoLTAuNGgtMC4xaC0wLjVIMHY3NGgyOC44bDE4LjItMTguMmMxLjUtMS42LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDI5LjkKCWM1LjItMjUuNSwzMC4yLTQxLjksNTUuNy0zNi43czQxLjksMzAuMiwzNi43LDU1LjdzLTMwLjIsNDEuOS01NS43LDM2LjdjLTE4LjUtMy44LTMyLjktMTguMi0zNi43LTM2LjdINTcuN2wtMTguMiwxOC4zCgljLTEuNSwxLjUtMy42LDIuNS01LjcsMi43bDAsMGgtMC40SDB2MzQuMmg1Ni4zYzAuMiwwLDAuMywwLDAuNSwwaDAuMWgwLjRsMCwwYzIuMiwwLjIsNC4yLDEuMiw1LjgsMi44bDI4LDI4aDU3LjcKCWM1LjMtMjUuNSwzMC4yLTQyLDU1LjctMzYuN3M0MiwzMC4yLDM2LjcsNTUuN2MtMS43LDguMS01LjUsMTUuNy0xMSwyMS45Yy0wLjYsMC43LTEuMiwxLjMtMS45LDJzLTEuMywxLjMtMiwxLjkKCWMtMTkuNSwxNy4zLTQ5LjMsMTUuNi02Ni43LTMuOWMtNS41LTYuMi05LjMtMTMuNy0xMS0yMS45SDg3LjFjLTEuMSwwLTIuMS0wLjItMy4xLTAuNWgtMC4xbC0wLjMtMC4xbC0wLjItMC4xbC0wLjItMC4xbC0wLjMtMC4xCgloLTAuMWMtMC45LTAuNS0xLjgtMS4xLTIuNi0xLjhsLTI4LTI4SDB2NTMuNWMwLjEsMjUuNywyMC45LDQ2LjQsNDYuNSw0Ni40aDM1My4zYzI1LjcsMCw0Ni41LTIwLjgsNDYuNS00Ni41di02My42aC02NC43CgljLTQzLjIsMC03OC4yLTM1LTc4LjItNzguMmwwLDBDMzAzLjUsMTQ1LjIsMzM4LjUsMTEwLjIsMzgxLjcsMTEwLjJ6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMjAuOSwyOTguMWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIyMC45LDMxMi40LDIyMC45LDI5OC4xTDIyMC45LDI5OC4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjE5LjYsOTEuNWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIxOS42LDEwNS44LDIxOS42LDkxLjV6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zODIuMiwxMjguOGgtMC41Yy0zMi45LDAtNTkuNiwyNi43LTU5LjYsNTkuNmwwLDBsMCwwYzAsMzIuOSwyNi43LDU5LjYsNTkuNiw1OS42bDAsMGgwLjUKCWMzMi45LDAsNTkuNi0yNi43LDU5LjYtNTkuNmwwLDBDNDQxLjgsMTU1LjQsNDE1LjEsMTI4LjgsMzgyLjIsMTI4Ljh6IE0zOTYuNiwyMTkuNGgtMzFsOC45LTMyLjVjLTcuNy0zLjctMTEtMTIuOS03LjQtMjAuNgoJYzMuNy03LjcsMTIuOS0xMSwyMC42LTcuNGM3LjcsMy43LDExLDEyLjksNy40LDIwLjZjLTEuNSwzLjItNC4xLDUuOC03LjQsNy40TDM5Ni42LDIxOS40eiIvPgo8ZyBpZD0iTGF5ZXJfeDAwMjBfMSI+Cgk8ZyBpZD0iXzE0MjEzOTQzNDI0MDAiPgoJCTxnPgoJCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjEyOSwxNjYuMiAxMjguNywxNjcuMyAxMjguNywyMDEuNCAxMjksMjAxLjcgMTQ0LjgsMTkyLjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDE2Ni4yIDExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDMiIHBvaW50cz0iMTI5LDIwNC43IDEyOC44LDIwNC45IDEyOC44LDIxNyAxMjksMjE3LjYgMTQ0LjgsMTk1LjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDIxNy42IDEyOSwyMDQuNyAxMTMuMiwxOTUuNCAJCQkiLz4KCQkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMjksMjAxLjcgMTQ0LjgsMTkyLjQgMTI5LDE4NS4yIAkJCSIvPgoJCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJPC9nPgoJPC9nPgo8L2c+Cjwvc3ZnPgo=");
        });

        it('provides the blockchains that are supported by the wallet', () => {
          mock(blockchain)
          expect(wallet.blockchains).toEqual(['ethereum', 'bsc', 'polygon'])
        });

        it('allows to switch network', async ()=>{
          let switchMock = mock({
            blockchain: 'ethereum',
            network: { switchTo: 'bsc' }
          })
          await wallet.switchTo('bsc')
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
          
          await wallet.switchTo('bsc')

          expect(switchMock).toHaveBeenCalled()
          expect(addMock).toHaveBeenCalled()
          expect(await wallet.connectedTo('bsc')).toEqual(true)
        })
      })
    })
  })
})
