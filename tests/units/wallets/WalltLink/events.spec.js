import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getWallets, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('WalletLink: events', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with supported wallet connected', ()=>{

        const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        beforeEach(()=>resetMocks())
        beforeEach(async ()=>{
          mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink, accounts: { return: [account] }})
          await new wallets.WalletLink().connect()
          wallet = (await getWallets())[0]
          expect(wallet.name).toEqual('Coinbase')
        })

        it('registers a callback and informs about wallet account change', async () => {
          let walletChangedTo

          mock(blockchain)

          wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount
          })

          trigger('accountsChanged', [account])

          expect(walletChangedTo).toEqual(ethers.utils.getAddress(account))
        })

        it('allows to deregisters account change event', async () => {
          let walletChangedTo

          mock(blockchain)

          let callback = wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount
          })

          wallet.off('account', callback)

          trigger('accountsChanged', [account])

          expect(walletChangedTo).toEqual(undefined)
        })

      })
    })
  })
})
