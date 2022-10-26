import { getWallets, wallets, supported } from 'src'
import WalletConnect from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletConnect: events', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(async ()=>{
          WalletConnect.setConnectedInstance(undefined)
          mock({
            blockchain, 
            accounts: { return: accounts }, 
            wallet: 'walletconnect',
            connector: wallets.WalletConnect
          })
          let account = await new wallets.WalletConnect().connect()
          wallet = getWallets()[0]
          expect(wallet.name).toEqual('WalletConnect')
          expect(account).toEqual(accounts[0])
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          wallet.on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts: accounts }] }])
          expect(newAccount).toEqual(accounts[0])
        })

        it('allows to deregister an event to be called back if account change', async()=> {
          let newAccount
          let callback = wallet.on('account', (account)=>{
            newAccount = account
          })
          wallet.off('account', callback)
          trigger('session_update', [null, { params: [{ accounts: accounts }] }])
          expect(newAccount).toEqual(undefined)
        })
      })
    })
  })
});
