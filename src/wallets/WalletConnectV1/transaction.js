/*#if _EVM

import { request, getProvider, estimate } from '@depay/web3-client-evm'

/*#elif _SOLANA

import { request, getProvider, estimate } from '@depay/web3-client-solana'

//#else */

import { request, getProvider, estimate } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getSmartContractWallet } from '../MultiSig'
import { Transaction } from '../../Transaction'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await transaction.prepare({ wallet })
  const smartContractWallet = await getSmartContractWallet(transaction.blockchain, transaction.from)
  let transactionCount = await wallet.transactionCount({ blockchain: transaction.blockchain, address: transaction.from })
  transaction.nonce = transactionCount
  await submit({ transaction, wallet }).then((tx)=>{
    if (tx) {
      let blockchain = Blockchains.findByName(transaction.blockchain)
      transaction.id = tx
      transaction.url = smartContractWallet && smartContractWallet.explorerUrlFor ? smartContractWallet.explorerUrlFor({ transaction }) : blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      retrieveTransaction({ blockchain: transaction.blockchain, tx, smartContractWallet }).then((sentTransaction)=>{
        transaction.id = sentTransaction.hash || transaction.id
        transaction.url = blockchain.explorerUrlFor({ transaction })
        transaction.nonce = sentTransaction.nonce || transactionCount
        retrieveConfirmedTransaction(sentTransaction).then(()=>{
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
      })
    } else {
      throw('Submitting transaction failed!')
    }
  })
  return transaction
}

const retrieveConfirmedTransaction = (sentTransaction)=>{
  return new Promise((resolve, reject)=>{
    try {

      sentTransaction.wait(1).then(resolve).catch((error)=>{
        if(
          (error && error?.stack?.match('JSON-RPC error')) ||
          (error && error.toString().match('undefined'))
        ) {
          setTimeout(()=>{
            retrieveConfirmedTransaction(sentTransaction)
              .then(resolve)
              .catch(reject)
          }, 500)
        } else {
          reject(error)
        }
      })
    } catch (error) {
      if(
        (error && error?.stack?.match('JSON-RPC error')) ||
        (error && error.toString().match('undefined'))
      ) {
        setTimeout(()=>{
          retrieveConfirmedTransaction(sentTransaction)
            .then(resolve)
            .catch(reject)
        }, 500)
      } else {
        reject(error)
      }
    }
  })
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
  let gasPrice = await provider.getGasPrice()
  if(wallet.session?.peerMeta?.name === 'Uniswap Wallet') {
    gasPrice = undefined
  } else {
    gasPrice = gasPrice.toHexString()
  }
  let gas
  try {
    gas = await estimate(transaction)
    gas = gas.add(gas.div(10))
  } catch {}
  const data = await transaction.getData()
  const value = transaction.value ? ethers.utils.hexlify(ethers.BigNumber.from(transaction.value)) : undefined
  const nonce = ethers.utils.hexlify(transaction.nonce)
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value,
    data,
    gas: gas?.toHexString(),
    gasPrice,
    nonce,
  })
}

const submitSimpleTransfer = async ({ transaction, wallet })=>{
  const provider = await getProvider(transaction.blockchain)
  let gasPrice = await provider.getGasPrice()
  if(wallet.session?.peerMeta?.name === 'Uniswap Wallet') {
    gasPrice = undefined
  } else {
    gasPrice = gasPrice.toHexString()
  }
  let gas
  try {
    gas = await estimate(transaction)
    gas = gas.add(gas.div(10))
  } catch {}
  const value = ethers.utils.hexlify(ethers.BigNumber.from(transaction.value))
  const nonce = ethers.utils.hexlify(transaction.nonce)
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value,
    data: '0x',
    gas: gas?.toHexString(),
    gasPrice,
    nonce,
  })
}

export {
  sendTransaction
}
