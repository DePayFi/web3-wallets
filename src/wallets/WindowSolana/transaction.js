import { Blockchain } from '@depay/web3-blockchains'
import { Transaction as SolanaTransaction, SystemProgram, PublicKey } from '@depay/solana-web3.js'
import { provider } from '@depay/web3-client'
import { Transaction } from '../../Transaction'

const POLL_SPEED = 500 // 0.5 seconds
const MAX_POLLS = 240 // 120 seconds

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  await submit({ transaction, wallet }).then(({ signature })=>{
    if(signature) {
      transaction.id = signature
      transaction.url = Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)

      let count = 0
      const interval = setInterval(async ()=> {
        count++
        if(count >= MAX_POLLS) { return clearInterval(interval) }

        const { value } = await provider(transaction.blockchain).getSignatureStatus(signature)
        const confirmationStatus = value?.confirmationStatus
        if(confirmationStatus) {
          const hasReachedSufficientCommitment = confirmationStatus === 'confirmed' || confirmationStatus === 'finalized'
          if (hasReachedSufficientCommitment) {
            if(value.err) {
              transaction._failed = true
              const confirmedTransaction = await provider(transaction.blockchain).getConfirmedTransaction(signature)
              const failedReason = confirmedTransaction?.meta?.logMessages ? confirmedTransaction.meta.logMessages[confirmedTransaction.meta.logMessages.length - 1] : null
              if(transaction.failed) transaction.failed(transaction, failedReason)
            } else {
              transaction._succeeded = true
              if (transaction.succeeded) transaction.succeeded(transaction)
            }
            return clearInterval(interval)
          }
        }
      }, POLL_SPEED)
    } else {
      throw('Submitting transaction failed!')
    }
  })
  return transaction
}

const submit = ({ transaction, wallet })=> {
  if(transaction.instructions) {
    return submitInstructions({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitSimpleTransfer = async ({ transaction, wallet })=> {
  let fromPubkey = new PublicKey(await wallet.account())
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

const submitInstructions = async ({ transaction, wallet })=> {
  let fromPubkey = new PublicKey(await wallet.account())
  let recentBlockhash = (await provider(transaction.blockchain).getLatestBlockhash()).blockhash
  let transferTransaction = new SolanaTransaction({
    recentBlockhash,
    feePayer: fromPubkey
  })
  transaction.instructions.forEach((instruction)=>{
    transferTransaction.add(instruction)
  })

  return window.solana.signAndSendTransaction(transferTransaction)
}

export {
  sendTransaction
}
