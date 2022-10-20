import WalletConnect from 'src/wallets/WalletConnect'
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
          WalletConnect.setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WalletConnect().account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns undefined', async () => {
          expect(await new wallets.WalletConnect().connect()).toStrictEqual(undefined)
        })
      })

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(()=>{
          resetMocks()
        })
        beforeEach(async()=>{
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect, accounts: { return: [account] } })
          await new wallets.WalletConnect().connect()
          wallet = getWallets()[0]
        })

        it('requires to be connected first', async()=> {
          let accounts = await wallet.connect()
          expect(accounts).toEqual([account])
        });

        it('provides a wallet name', async()=> {
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('provides a wallet logo', async()=> {
          expect(wallet.logo).toEqual("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==")
        })

        it('provides currently connected main account', async()=> {
          expect(await wallet.account()).toEqual(account)
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
