import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { request, estimate, getProvider } from '@depay/web3-client'
import { Transaction } from '../../Transaction'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    await wallet.switchTo(transaction.blockchain)
  }
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await transaction.prepare({ wallet })
  let transactionCount = await request({ blockchain: transaction.blockchain, method: 'transactionCount', address: transaction.from })
  transaction.nonce = transactionCount
  await submit({ transaction, wallet }).then(async (tx)=>{
    if (tx) {
      let blockchain = Blockchain.findByName(transaction.blockchain)
      transaction.id = tx
      transaction.url = blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      let sentTransaction = await retrieveTransaction(tx, transaction.blockchain)
      transaction.nonce = sentTransaction.nonce || transactionCount
      if(!sentTransaction) {
        transaction._failed = true
        console.log('Error retrieving transaction')
        if(transaction.failed) transaction.failed(transaction, 'Error retrieving transaction')
      } else {
        sentTransaction.wait(1).then(() => {
          transaction._succeeded = true
          if (transaction.succeeded) transaction.succeeded(transaction)
        }).catch((error)=>{
          if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
            if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 1) {
              transaction.id = error.replacement.hash
              transaction._succeeded = true
              if (transaction.succeeded) transaction.succeeded(transaction)
            } else if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 0) {
              transaction.id = error.replacement.hash
              transaction._failed = true
              if(transaction.failed) transaction.failed(transaction, error)  
            }
          } else {
            transaction._failed = true
            if(transaction.failed) transaction.failed(transaction, error)
          }
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
  const provider = await getProvider(blockchain)
  sentTransaction = await provider.getTransaction(tx)
  const maxRetries = 120
  let attempt = 1
  while (attempt <= maxRetries && !sentTransaction) {
    sentTransaction = await provider.getTransaction(tx)
    await (new Promise((resolve)=>setTimeout(resolve, 5000)))
    attempt++;
  }
  return sentTransaction
}

const submit = ({ transaction, wallet }) => {
  if(transaction.method) {
    return submitContractInteraction({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitContractInteraction = async ({ transaction, wallet })=>{
  const provider = await getProvider(transaction.blockchain)
  const gasPrice = await provider.getGasPrice()
  const gas = await estimate(transaction)
  const data = await transaction.getData()
  const value = transaction.value ? ethers.utils.hexlify(ethers.BigNumber.from(transaction.value)) : undefined
  const nonce = ethers.utils.hexlify(transaction.nonce)
  console.log({
    from: transaction.from,
    to: transaction.to,
    value,
    data,
    gas: gas.toHexString(),
    gasPrice: gasPrice.toHexString(),
    nonce,
  })
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value,
    data,
    gas: gas.toHexString(),
    gasPrice: gasPrice.toHexString(),
    nonce,
  })
}

const submitSimpleTransfer = async ({ transaction, wallet })=>{
  const provider = await getProvider(transaction.blockchain)
  const gasPrice = await provider.getGasPrice()
  const gas = await estimate(transaction)
  const value = ethers.utils.hexlify(ethers.BigNumber.from(transaction.value))
  const nonce = ethers.utils.hexlify(transaction.nonce)
  console.log({
    from: transaction.from,
    to: transaction.to,
    value,
    data: '0x',
    gas: gas.toHexString(),
    gasPrice: gasPrice.toHexString(),
    nonce,
  })
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value,
    data: '0x',
    gas: gas.toHexString(),
    gasPrice: gasPrice.toHexString(),
    nonce,
  })
}

export {
  sendTransaction
}
