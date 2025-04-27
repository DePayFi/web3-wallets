/*#if _EVM

import { getProvider } from '@depay/web3-client-evm'

/*#elif _SVM

import { getProvider } from '@depay/web3-client-svm'

//#else */

import { getProvider } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { VersionedTransaction, TransactionMessage, SystemProgram, PublicKey } from '@depay/solana-web3.js'
import { Transaction } from '../../Transaction'

const POLL_SPEED = 500 // 0.5 seconds
const MAX_POLLS = 240 // 120 seconds

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  await submit({ transaction, wallet }).then((signature)=>{
    if(signature) {
      transaction.id = signature
      transaction.url = Blockchains.findByName(transaction.blockchain).explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)

      let count = 0
      const interval = setInterval(async ()=> {
        count++
        if(count >= MAX_POLLS) { return clearInterval(interval) }

        const provider = await getProvider(transaction.blockchain)
        const { value } = await provider.getSignatureStatus(signature)
        const confirmationStatus = value?.confirmationStatus
        if(confirmationStatus) {
          const hasReachedSufficientCommitment = confirmationStatus === 'confirmed' || confirmationStatus === 'finalized'
          if (hasReachedSufficientCommitment) {
            if(value.err) {
              transaction._failed = true
              const confirmedTransaction = await provider.getConfirmedTransaction(signature)
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

const submit = async({ transaction, wallet })=> {

  let result = await submitThroughWallet({ transaction, wallet })

  let signature

  if(typeof result === 'object' && result.signatures && result.message) {
    signature = await submitDirectly(result, await wallet.account())
  } else if (typeof result === 'object' && result.signature && result.signature.length) {
    signature = result.signature
  } else if (typeof result === 'string' && result.length) {
    signature = result
  }
  
  return signature
}

const submitDirectly = async(tx, from) =>{
  let provider = await getProvider('solana')
  return await provider.sendRawTransaction(tx.serialize())
}

const submitThroughWallet = async({ transaction, wallet })=> {
  if(transaction.instructions) {
    return submitInstructions({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitSimpleTransfer = async ({ transaction, wallet })=> {
  let fromPubkey = new PublicKey(await wallet.account())
  let toPubkey = new PublicKey(transaction.to)
  const provider = await getProvider(transaction.blockchain)
  let { blockhash, lastValidBlockHeight } = await provider.getLatestBlockhash()
  const instructions = [
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: parseInt(Transaction.bigNumberify(transaction.value, transaction.blockchain), 10)
    })
  ]
  const messageV0 = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()
  const transactionV0 = new VersionedTransaction(messageV0)
  transaction._lastValidBlockHeight = lastValidBlockHeight
  return wallet._sendTransaction(transactionV0)
}

const submitInstructions = async ({ transaction, wallet })=> {
  let fromPubkey = new PublicKey(await wallet.account())
  const provider = await getProvider(transaction.blockchain)
  let { blockhash, lastValidBlockHeight } = await provider.getLatestBlockhash()
  const messageV0 = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: blockhash,
    instructions: transaction.instructions,
  }).compileToV0Message(
    transaction.alts ? await Promise.all(transaction.alts.map(async(alt)=>{
      return (await getProvider('solana')).getAddressLookupTable(new PublicKey(alt)).then((res) => res.value)
    })) : undefined)
  const transactionV0 = new VersionedTransaction(messageV0)
  if(transaction.signers && transaction.signers.length) {
    transactionV0.sign(Array.from(new Set(transaction.signers)))
  }
  transaction._lastValidBlockHeight = lastValidBlockHeight
  return wallet._sendTransaction(transactionV0)
}

export {
  sendTransaction
}
