import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { provider } from '@depay/web3-client'
import { Transaction } from '../../Transaction'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await executeSubmit({ transaction, wallet }).then(async (tx)=>{
    if (tx) {
      let blockchain = Blockchain.findByName(transaction.blockchain)
      transaction.id = tx
      transaction.url = blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      let sentTransaction = await retrieveTransaction(tx, transaction.blockchain)
      transaction.nonce = sentTransaction.nonce
      if(!sentTransaction) {
        transaction._failed = true
        console.log('Error retrieving transaction')
        if(transaction.failed) transaction.failed(transaction, 'Error retrieving transaction')
      } else {
        sentTransaction.wait(1).then(() => {
          transaction._confirmed = true
          if (transaction.confirmed) transaction.confirmed(transaction)
        }).catch((error)=>{
          transaction._failed = true
          if(transaction.failed) transaction.failed(transaction, error)
        })
        sentTransaction.wait(12).then(() => {
          transaction._ensured = true
          if (transaction.ensured) transaction.ensured(transaction)
        }).catch((error)=>{
          transaction._failed = true
          if(transaction.failed) transaction.failed(transaction, error)
        })
      }
    } else {
      throw('Submitting transaction failed!')
    }
  })
  return transaction
}

const retrieveTransaction = async (tx, blockchain)=>{
  let sentTransaction
  const maxRetries = 120
  let attempt = 1
  sentTransaction = await provider(blockchain).getTransaction(tx)
  while (attempt <= maxRetries && !sentTransaction) {
    sentTransaction = await provider(blockchain).getTransaction(tx)
    await (new Promise((resolve)=>setTimeout(resolve, 5000)))
    attempt++;
  }
  return sentTransaction
}

const executeSubmit = ({ transaction, wallet }) => {
  if(transaction.method) {
    return submitContractInteraction({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitContractInteraction = async ({ transaction, wallet })=>{
  let contract = new ethers.Contract(transaction.to, transaction.api)

  let populatedTransaction = await contract.populateTransaction[transaction.method].apply(
    null, transaction.getContractArguments({ contract })
  )

  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value: transaction.value?.toString(),
    data: populatedTransaction.data
  })
}

const submitSimpleTransfer = ({ transaction, wallet })=>{
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value: transaction.value?.toString()
  })
}

export {
  sendTransaction
}
