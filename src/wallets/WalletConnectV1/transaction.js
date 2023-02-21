import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getSmartContractWallet } from '../MultiSig'
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
  const smartContractWallet = await getSmartContractWallet(transaction.blockchain, transaction.from)
  const transactionCount = smartContractWallet ? await smartContractWallet.transactionCount() : await request({ blockchain: transaction.blockchain, method: 'transactionCount', address: transaction.from })
  transaction.nonce = transactionCount
  await submit({ transaction, wallet }).then(async (tx)=>{
    if (tx) {
      let blockchain = Blockchain.findByName(transaction.blockchain)
      transaction.id = tx
      transaction.url = smartContractWallet && smartContractWallet.explorerUrlFor ? smartContractWallet.explorerUrlFor({ transaction }) : blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      let sentTransaction = await retrieveTransaction({ blockchain: transaction.blockchain, tx, smartContractWallet })
      transaction.id = sentTransaction.hash || transaction.id
      transaction.url = blockchain.explorerUrlFor({ transaction })
      transaction.nonce = sentTransaction.nonce || transactionCount
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
    } else {
      throw('Submitting transaction failed!')
    }
  })
  return transaction
}

const retrieveTransaction = async ({ blockchain, tx, smartContractWallet })=>{
  const provider = await getProvider(blockchain)
  let retrieve = async()=>{
    try {
      if(smartContractWallet && smartContractWallet.retrieveTransaction) {
        return await smartContractWallet.retrieveTransaction({ blockchain, tx })
      } else {
        return await provider.getTransaction(tx)
      }
    } catch {}
  }
  
  let sentTransaction
  sentTransaction = await retrieve()
  while (!sentTransaction) {
    await (new Promise((resolve)=>setTimeout(resolve, 3000)))
    sentTransaction = await retrieve()
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
