import { getWallets, wallets, supported } from 'src'
import WalletConnect from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletConnect: events', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(resetMocks)
        beforeEach(async ()=>{
          WalletConnect.setConnectedInstance(undefined)
          mock({
            blockchain, 
            accounts: { return: [account] }, 
            wallet: 'walletconnect',
            connector: wallets.WalletConnect
          })
          await new wallets.WalletConnect().connect()
          wallet = getWallets()[0]
          expect(wallet.name).toEqual('WalletConnect')
        })

        it('register an event to be called back if account change', async()=> {
          let newAccount
          wallet.on('account', (account)=>{
            newAccount = account
          })
          trigger('session_update', [null, { params: [{ accounts: [account] }] }])
          expect(newAccount).toEqual(account)
        })

        it('allows to deregister an event to be called back if account change', async()=> {
          let newAccount
          let callback = wallet.on('account', (account)=>{
            newAccount = account
          })
          wallet.off('account', callback)
          trigger('session_update', [null, { params: [{ accounts: [account] }] }])
          expect(newAccount).toEqual(undefined)
        })
      })
    })
  })
});
