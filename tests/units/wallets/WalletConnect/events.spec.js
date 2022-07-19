import { getWallet, wallets, supported } from 'src'
import WalletConnect from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletConnect', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
        beforeEach(async ()=>{
          WalletConnect.setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletconnect', connector: wallets.WalletConnect })
          await new wallets.WalletConnect().connect()
          expect(getWallet().name).toEqual('WalletConnect')
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          getWallet().on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(accounts[0])
        })

        it('allows to deregister an event to be called back if account change', async()=> {
          let newAccount
          let callback = getWallet().on('account', (account)=>{
            newAccount = account
          })
          getWallet().off('account', callback)
          trigger('session_update', [null, { params: [{ accounts }] }])
          expect(newAccount).toEqual(undefined)
        })
      })
    })
  })
});
