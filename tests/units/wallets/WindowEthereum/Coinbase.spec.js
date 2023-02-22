import { ethers } from 'ethers'
import { getWallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('Coinbase Wallet', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      beforeEach(async()=>{
        resetMocks()
        mock({ blockchain, wallet: 'coinbase', accounts: { return: [account] } })
        wallet = (await getWallets())[0]
      })

      it('should detect the wallet type', () => {
        expect(wallet.name).toBe('Coinbase');
      });

      it('provides a connect function', async () => {
        expect(await wallet.connect()).toStrictEqual(ethers.utils.getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'))
      });

      it('provides an account function', async () => {
        expect(await wallet.account()).toStrictEqual(ethers.utils.getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'))
      });

      it('provides an logo', async () => {
        expect(wallet.logo).toStrictEqual("data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB2aWV3Qm94PScwIDAgNDg4Ljk2IDQ4OC45Nic+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6IzQzNjFhZDt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9J2xpbmVhci1ncmFkaWVudCcgeDE9JzI1MCcgeTE9JzcuMzUnIHgyPScyNTAnIHkyPSc0OTYuMzInIGdyYWRpZW50VHJhbnNmb3JtPSdtYXRyaXgoMSwgMCwgMCwgLTEsIDAsIDUwMiknIGdyYWRpZW50VW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyMzZDViYTknLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyM0ODY4YjEnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNTAsNS42OEMxMTQuODcsNS42OCw1LjUyLDExNSw1LjUyLDI1MC4xN1MxMTQuODcsNDk0LjY1LDI1MCw0OTQuNjUsNDk0LjQ4LDM4NS4yOSw0OTQuNDgsMjUwLjE3LDM4NS4xMyw1LjY4LDI1MCw1LjY4Wm0wLDM4Ny41NEExNDMuMDYsMTQzLjA2LDAsMSwxLDM5My4wNSwyNTAuMTcsMTQzLjExLDE0My4xMSwwLDAsMSwyNTAsMzkzLjIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUuNTIgLTUuNjgpJy8+PHBhdGggY2xhc3M9J2Nscy0yJyBkPSdNMjg0LjY5LDI5Ni4wOUgyMTUuMzFhMTEsMTEsMCwwLDEtMTAuOS0xMC45VjIxNS40OGExMSwxMSwwLDAsMSwxMC45LTEwLjkxSDI4NWExMSwxMSwwLDAsMSwxMC45LDEwLjkxdjY5LjcxQTExLjA3LDExLjA3LDAsMCwxLDI4NC42OSwyOTYuMDlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNS41MiAtNS42OCknLz48L3N2Zz4=")
      });

      it('registers a callback and informs about active connected account changes', async () => {
        let accountChangedTo;

        wallet.on('account', (newAccount)=>{
          accountChangedTo = newAccount;
        })

        trigger('accountsChanged', [account])

        expect(accountChangedTo).toEqual(ethers.utils.getAddress(account))
      })

      it('provides the blockchains that are supported by the wallet', () => {
        expect(wallet.blockchains).toEqual(supportedBlockchains.evm)
      })      
    })
  })
})
