import WalletConnectV1 from 'src/wallets/WalletConnectV1'
import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getWallets, wallets, supported } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletConnect', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(async()=>{
          WalletConnectV1.setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnectV1 })
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WalletConnectV1().account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns undefined', async () => {
          expect(await new wallets.WalletConnectV1().connect()).toStrictEqual(undefined)
        })
      })

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(async()=>{
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnectV1, accounts: { return: [account] } })
          await new wallets.WalletConnectV1().connect()
          wallet = (await getWallets())[0]
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('requires to be connected first', async()=> {
          let account = await wallet.connect()
          expect(account).toEqual(ethers.utils.getAddress(account))
        });

        it('provides a wallet name', async()=> {
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('provides a wallet logo', async()=> {
          expect(wallet.logo).toEqual("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==")
        })

        it('provides currently connected main account', async()=> {
          expect(await wallet.account()).toEqual(ethers.utils.getAddress(account))
        })

        it('provides the walletConnect wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('receives supported blockchains', async()=> {
          expect(wallet.blockchains).toEqual(supportedBlockchains.evm)
        })

        it('receives connected blockchain', async()=> {
          expect(await wallet.connectedTo(blockchain)).toEqual(true)
          expect(await wallet.connectedTo()).toEqual(blockchain)
        })

        it('switches network', async()=> {
          let switchMock = mock({
            blockchain: 'ethereum',
            network: { switchTo: 'bsc' }
          })
          await wallet.switchTo('bsc')
          expect(switchMock).toHaveBeenCalled()
        })

        it('adds network', async()=> {
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
                return { message: '... wallet_addEthereumChain ...' }
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
});
