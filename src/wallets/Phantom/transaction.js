import { Blockchain } from '@depay/web3-blockchains'
import { Transaction as SolanaTransaction, SystemProgram, PublicKey } from '@depay/solana-web3.js'
import { provider } from '@depay/web3-client'
import { Transaction } from '../../Transaction'

const POLL_SPEED = 500 // 0.5 seconds
const MAX_POLLS = 240 // 120 seconds

const sendTransaction = async ({ transaction, wallet })=> {
  await submit({ transaction, wallet }).then(({ signature })=>{
    if(signature) {
      transaction.id = signature
      transaction.url = Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction })
      console.log('transaction.url', transaction.url)
      if (transaction.sent) transaction.sent(transaction)

      let count = 0
      const interval = setInterval(async ()=> {
        count++
        if(count >= MAX_POLLS) { 
          return clearInterval(interval) 
        }

        const { value } = await provider(transaction.blockchain).getSignatureStatus(signature)
        const confirmationStatus = value?.confirmationStatus
        if(confirmationStatus) {
          const hasReachedSufficientCommitment = confirmationStatus === 'confirmed' || confirmationStatus === 'finalized';
          if (hasReachedSufficientCommitment) {
            transaction._confirmed = true
            if (transaction.confirmed) transaction.confirmed(transaction)
            return clearInterval(interval)
          }
        }

        const confirmedTransaction = await provider(transaction.blockchain).getConfirmedTransaction(signature)
        if(confirmedTransaction?.meta?.err) {
          transaction._failed = true
          if(transaction.failed) transaction.failed(transaction, confirmedTransaction?.meta?.logMessages?.findLast(()=>true))
          return clearInterval(interval)
        }
      }, POLL_SPEED)
    } else {
      throw('Submitting transaction failed!')
    }
  })
  return transaction
}

const submit = ({ transaction, wallet })=> {
  if(transaction.method) {

  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitSimpleTransfer = async ({ transaction, wallet })=> {
  let fromPubkey = new PublicKey(transaction.from)
  let toPubkey = new PublicKey(transaction.to)
  let recentBlockhash = (await provider(transaction.blockchain).getLatestBlockhash()).blockhash
  let transferTransaction = new SolanaTransaction({
    recentBlockhash,
    feePayer: fromPubkey
  })
  transferTransaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: parseInt(Transaction.bigNumberify(transaction.value, transaction.blockchain), 10)
    })
  )
  return window.solana.signAndSendTransaction(transferTransaction)
}

export {
  sendTransaction
}