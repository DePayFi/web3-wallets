import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { getWallet, wallets, supported } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('Generic Web3 Wallet', () => {

  ['ethereum', 'bsc', 'polygon'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
      beforeEach(resetMocks)
      beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
      beforeEach(async ()=>{
        if(connectedInstance) {
          connectedInstance.connectedAccounts = []
        }
        setConnectedInstance(undefined)
        mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
        await new wallets.WalletConnect().connect()
        expect(getWallet().name).toEqual('WalletConnect')
      })

      it('allows to sign a personal message', async()=> {
        mock({
          blockchain: blockchain,
          signature: {
            params:[
              accounts[0],
              "0x546869732069732061206d65737361676520746f206265207369676e65640a0a416e642061206e6577206c696e65"
            ],
            return: "0x123456"
          }
        })

        let signature = await getWallet().sign("This is a message to be signed\n\nAnd a new line")

        expect(signature).toEqual("0x123456")
      })
    })
  })
})
