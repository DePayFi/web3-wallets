import { ethers } from 'ethers'
import { getWallets } from 'src'
import { mock, connect, resetMocks, confirm, increaseBlock, fail } from '@depay/web3-mock'
import { getProvider, resetCache } from '@depay/web3-client'
import { supported as supportedBlockchains } from 'src/blockchains'
import { SystemProgram, PublicKey, struct, u8, u32, u64 } from '@depay/solana-web3.js'
import { Token } from '@depay/web3-tokens'

describe('window.solana wallet sendTransaction', () => {

  supportedBlockchains.solana.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      const account = '2UgCJaHU5y8NC4uWQcZYeV9a5RyYLF7iKYCybCsdFFD1'
      let wallet, provider, transaction, mockedTransaction

      beforeEach(async()=>{
        resetCache()
        resetMocks()
        provider = await getProvider(blockchain)
        mock({ blockchain, accounts: { return: [account] } })
        wallet = getWallets()[0]
      })

      describe('complex contract transaction', ()=>{
        beforeEach(async ()=>{
          let instructions = [
            await Token.solana.createTransferInstruction({ 
              token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
              amount: '1000000',
              from: account,
              to: '5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa'
            })
          ]

          transaction = {
            blockchain,
            from: account,
            instructions
          }

          mockedTransaction = mock({
            blockchain,
            provider,
            transaction: {
              from: account,
              instructions:[{
                to: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                api: struct([ u8('instruction'), u64('amount') ]),
                params: { instruction: 3, amount: 1000000 }
              }]
            }
          })
        })

        it('allows to submit contract transaction', async ()=> {
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(mockedTransaction).toHaveBeenCalled()
          expect(submittedTransaction.blockchain).toEqual(blockchain)
          expect(submittedTransaction.from).toEqual(account)
          expect(submittedTransaction.id).toEqual(mockedTransaction.transaction._id)
          expect(submittedTransaction.url).toBeDefined()
          expect(submittedTransaction.instructions).toBeDefined()
        })

        it('rejects sendTransaction if submitting contract transaction fails', async ()=> {
          mock({
            blockchain,
            transaction: {
              from: account,
              instructions:[{
                to: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                api: struct([ u8('instruction'), u64('amount') ]),
                params: { instruction: 3, amount: 1000000 }
              }],
              return: Error('something failed')
            }
          })
          await expect(
            wallet.sendTransaction(transaction)
          ).rejects.toEqual(Error('something failed'))
        })

        it("calls the transaction's sent callback", async ()=> {
          let sentCallbackTransaction
          transaction.sent = function(transaction){ sentCallbackTransaction = transaction  }
          await wallet.sendTransaction(transaction)
          expect(sentCallbackTransaction.id).toBeDefined()
          expect(sentCallbackTransaction.url).toBeDefined()
          expect(sentCallbackTransaction.instructions).toBeDefined()
          expect(sentCallbackTransaction.blockchain).toEqual(blockchain)
          expect(sentCallbackTransaction.from).toEqual(account)
        })

        it("calls the transaction's succeeded callback", async ()=> {
          let succededCallbackTransaction
          transaction.succeeded = function(transaction){ succededCallbackTransaction = transaction }
          let submittedTransaction = await wallet.sendTransaction(transaction)
          confirm(mockedTransaction)
          await submittedTransaction.success()
          expect(succededCallbackTransaction.id).toBeDefined()
          expect(succededCallbackTransaction.url).toBeDefined()
          expect(succededCallbackTransaction.instructions).toBeDefined()
          expect(succededCallbackTransaction.blockchain).toEqual(blockchain)
          expect(succededCallbackTransaction.from).toEqual(account)
        })

        it("calls the transaction's failed callback", async ()=> {
          let failedCallbackTransaction
          let failedReason
          transaction.failed = function(transaction, reason){ 
            failedCallbackTransaction = transaction
            failedReason = reason
          }
          let submittedTransaction = await wallet.sendTransaction(transaction)
          fail(mockedTransaction, 'THIS IS THE REASON IT FAILED')
          await submittedTransaction.failure()
          expect(failedReason).toEqual('THIS IS THE REASON IT FAILED')
          expect(failedCallbackTransaction.id).toBeDefined()
          expect(failedCallbackTransaction.url).toBeDefined()
          expect(failedCallbackTransaction.blockchain).toEqual(blockchain)
          expect(failedCallbackTransaction.from).toEqual(account)
        })
      })

      describe('simple value transfer transaction', ()=>{
        beforeEach(()=>{

          let instructions = [SystemProgram.transfer({ 
            fromPubkey: new PublicKey(account),
            toPubkey: new PublicKey('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa'),
            lamports: 1000000000
          })]

          transaction = {
            blockchain,
            from: account,
            to: '5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa',
            value: '1000000000'
          }

          mockedTransaction = mock({
            blockchain,
            provider,
            transaction: {
              from: account,
              instructions:[{
                to: '11111111111111111111111111111111',
                api: struct([  u32('instruction'), u64('lamports') ]),
                params: { instruction: 2, lamports: 1000000000 }
              }]
            }
          })
        })
        
        it('allows to submit value transfer transaction', async ()=> {
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(submittedTransaction.id).toBeDefined()
          expect(submittedTransaction.url).toBeDefined()
          expect(submittedTransaction.blockchain).toEqual(blockchain)
          expect(submittedTransaction.from).toEqual(account)
          expect(submittedTransaction.to).toEqual('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa')
          expect(submittedTransaction.value.toString()).toEqual('1000000000')
          expect(mockedTransaction).toHaveBeenCalled()
        })

        it('sends transaction with value provided as number', async ()=> {
          transaction.value = 1
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(submittedTransaction.value.toString()).toEqual('1000000000')
          expect(mockedTransaction).toHaveBeenCalled()
        })

        it('sends transaction with value provided as float', async ()=> {
          let instructions = [SystemProgram.transfer({ 
            fromPubkey: new PublicKey(account),
            toPubkey: new PublicKey('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa'),
            lamports: 100000000
          })]

          transaction = {
            blockchain,
            from: account,
            to: '5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa',
            value: '100000000'
          }

          mockedTransaction = mock({
            blockchain,
            provider,
            transaction: {
              from: account,
              instructions:[{
                to: '11111111111111111111111111111111',
                api: struct([  u32('instruction'), u64('lamports') ]),
                params: { instruction: 2, lamports: 100000000 }
              }]
            }
          })

          transaction.value = 0.1
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(submittedTransaction.value.toString()).toEqual('100000000')
          expect(mockedTransaction).toHaveBeenCalled()
        })

        it('sends transaction with value provided as string', async ()=> {
          transaction.value = '1000000000'
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(mockedTransaction).toHaveBeenCalled()
        })

        it('rejects sendTransaction if submitting simple value transfer transaction fails', async ()=> {
          mockedTransaction = mock({
            blockchain,
            provider,
            transaction: {
              from: account,
              instructions:[{
                to: '11111111111111111111111111111111',
                api: struct([  u32('instruction'), u64('lamports') ]),
                params: { instruction: 2, lamports: 1000000000 }
              }],
              return: Error('something failed')
            },
          })

          await expect(
            wallet.sendTransaction(transaction)
          ).rejects.toEqual(Error('something failed'))
        })

        it('sets the from address if transaction has been sent', async ()=>{
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(submittedTransaction.from).toEqual(account)
        })

        it('populates basic information for the transaction after sent', async () => {
          let submittedTransaction = await wallet.sendTransaction(transaction)
          expect(submittedTransaction.id == undefined).toEqual(false)
          let blockexplorer = {
            'solana': 'https://solscan.io/tx/',
          }[blockchain]
          expect(submittedTransaction.url).toEqual(`${blockexplorer}${submittedTransaction.id}`)
        })

        it("calls the transaction's sent callback", async ()=> {
          let sentCallbackTransaction
          transaction.sent = function(transaction){ sentCallbackTransaction = transaction  }
          await wallet.sendTransaction(transaction)
          expect(sentCallbackTransaction.id).toBeDefined()
          expect(sentCallbackTransaction.url).toBeDefined()
          expect(sentCallbackTransaction.blockchain).toEqual(blockchain)
          expect(sentCallbackTransaction.from).toEqual(account)
          expect(sentCallbackTransaction.to).toEqual('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa')
          expect(sentCallbackTransaction.value).toEqual('1000000000')
        });

        it("calls the transaction's succeeded callback", async ()=> {
          let succededCallbackTransaction
          transaction.succeeded = function(transaction){ succededCallbackTransaction = transaction }
          let submittedTransaction = await wallet.sendTransaction(transaction)
          confirm(mockedTransaction)
          await submittedTransaction.success()
          expect(succededCallbackTransaction.id).toBeDefined()
          expect(succededCallbackTransaction.url).toBeDefined()
          expect(succededCallbackTransaction.blockchain).toEqual(blockchain)
          expect(succededCallbackTransaction.from).toEqual(account)
          expect(succededCallbackTransaction.to).toEqual('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa')
          expect(succededCallbackTransaction.value.toString()).toEqual('1000000000')
        })

        it("calls the transaction's failed callback", async ()=> {
          let failedCallbackTransaction
          transaction.failed = function(transaction){ failedCallbackTransaction = transaction }
          let submittedTransaction = await wallet.sendTransaction(transaction)
          fail(mockedTransaction)
          await submittedTransaction.failure()
          expect(failedCallbackTransaction.id).toBeDefined()
          expect(failedCallbackTransaction.url).toBeDefined()
          expect(failedCallbackTransaction.blockchain).toEqual(blockchain)
          expect(failedCallbackTransaction.from).toEqual(account)
          expect(failedCallbackTransaction.to).toEqual('5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxa')
          expect(failedCallbackTransaction.value.toString()).toEqual('1000000000')
        })
      })
    })
  })
})
