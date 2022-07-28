import fetchMock from 'fetch-mock'
import WalletLink from 'src/wallets/WalletLink'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallets, wallets, supported } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletLink: sign', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      beforeEach(resetMocks)
      beforeEach(async ()=>{
        WalletLink.setConnectedInstance(undefined)
        mock({ accounts: { return: [account] }, blockchain, wallet: 'walletlink', connector: wallets.WalletLink })
        await new wallets.WalletLink().connect()
        wallet = getWallets()[0]
        expect(wallet.name).toEqual('Coinbase')
      })

      it('allows to sign a personal message', async()=> {
        mock({
          blockchain: blockchain,
          signature: {
            params:[
              account,
              "0x546869732069732061206d65737361676520746f206265207369676e65640a0a416e642061206e6577206c696e65"
            ],
            return: "0x123456"
          }
        })

        let signature = await wallet.sign("This is a message to be signed\n\nAnd a new line")

        expect(signature).toEqual("0x123456")
      })
    })
  })
})
