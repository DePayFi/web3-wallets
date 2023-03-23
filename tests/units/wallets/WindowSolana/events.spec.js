import fetchMock from 'fetch-mock'
import { getWallets, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { PublicKey } from '@depay/solana-web3.js'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('window.solana wallet events', () => {

  supportedBlockchains.solana.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with supported wallet connected', ()=>{

        const accounts = ['2UgCJaHU5y8NC4uWQcZYeV9a5RyYLF7iKYCybCsdFFD1']
        beforeEach(()=>resetMocks())
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
        beforeEach(async()=>wallet = (await getWallets())[0])

        it('registers a callback and informs about wallet account change', async () => {
          let walletChangedTo

          wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount
          })

          trigger('accountChanged', new PublicKey('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa'))

          expect(walletChangedTo).toEqual('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa')
        })

        it('allows to deregisters account change event', async () => {
          let walletChangedTo

          let callback = wallet.on('account', (newAccount)=>{
            walletChangedTo = newAccount
          })
          
          wallet.off('account', callback)

          trigger('accountChanged', new PublicKey('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa'))

          expect(walletChangedTo).toEqual(undefined)
        })
      })
    })
  })
})
