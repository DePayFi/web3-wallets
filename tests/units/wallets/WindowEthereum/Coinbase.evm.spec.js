import { ethers } from 'ethers'
import { getWallets } from 'dist/esm/index.evm'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('Coinbase Wallet (evm)', () => {

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
        expect(wallet.logo).toStrictEqual("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiBmaWxsPSIjMDA1MkZGIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUyIDUxMkMxNTIgNzEwLjgyMyAzMTMuMTc3IDg3MiA1MTIgODcyQzcxMC44MjMgODcyIDg3MiA3MTAuODIzIDg3MiA1MTJDODcyIDMxMy4xNzcgNzEwLjgyMyAxNTIgNTEyIDE1MkMzMTMuMTc3IDE1MiAxNTIgMzEzLjE3NyAxNTIgNTEyWk00MjAgMzk2QzQwNi43NDUgMzk2IDM5NiA0MDYuNzQ1IDM5NiA0MjBWNjA0QzM5NiA2MTcuMjU1IDQwNi43NDUgNjI4IDQyMCA2MjhINjA0QzYxNy4yNTUgNjI4IDYyOCA2MTcuMjU1IDYyOCA2MDRWNDIwQzYyOCA0MDYuNzQ1IDYxNy4yNTUgMzk2IDYwNCAzOTZINDIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==")
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
