/*#if _EVM

import { request, estimate, getProvider } from '@depay/web3-client-evm'

/*#elif _SOLANA

import { request, estimate, getProvider } from '@depay/web3-client-solana'

//#else */

import { request, estimate, getProvider } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { Transaction } from '../../Transaction'
import { ethers } from 'ethers'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await transaction.prepare({ wallet })
  let transactionCount = await request({ blockchain: transaction.blockchain, method: 'transactionCount', address: transaction.from })
  transaction.nonce = transactionCount
  await submit({ transaction, wallet }).then(async (response)=>{
    if(typeof response == 'string') {
      let blockchain = Blockchains[transaction.blockchain]
      transaction.id = response
      transaction.url = blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      console.log('before retrieveTransaction')
      let sentTransaction = await retrieveTransaction(transaction.id, transaction.blockchain)
      console.log('after retrieveTransaction', sentTransaction)
      transaction.nonce = sentTransaction.nonce || transactionCount
      if(!sentTransaction) {
        console.log('no sentTransaction')
        transaction._failed = true
        if(transaction.failed) transaction.failed(transaction, 'Error retrieving transaction')
      } else {
        retrieveConfirmedTransaction(sentTransaction).then(() => {
          transaction._succeeded = true
          if (transaction.succeeded) transaction.succeeded(transaction)
        }).catch((error)=>{
          console.log('OUTER ERROR', error)
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
      throw('Submitting transaction failed!', response)
    }
  })
  return transaction
}

const retrieveConfirmedTransaction = (sentTransaction)=>{
  console.log('attempt retrieveConfirmedTransaction', sentTransaction)
  return new Promise((resolve, reject)=>{
    sentTransaction.wait(1).then(resolve).catch((error)=>{
      console.log('error', error)
      if(error?.toString() === "TypeError: Cannot read properties of undefined (reading 'message')") {
        setTimeout(()=>{
          retrieveConfirmedTransaction(sentTransaction)
            .then(resolve)
            .catch(reject)
        }, 500)
      } else {
        reject(error)
      }
    })
  })
}

const retrieveTransaction = (tx, blockchain)=>{
  console.log('attempt retrieveTransaction', tx)
  return new Promise(async(resolve, reject)=>{
    try {
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
      resolve(sentTransaction)
    } catch (error) {
      console.log('ERROR', error)
      if(error?.toString() === "TypeError: Cannot read properties of undefined (reading 'message')"){
        retrieveTransaction(tx, blockchain)
          .then(resolve)
          .catch(reject)
      } else {
        reject(error)
      }
    }
  })
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
  const blockchain = Blockchains[transaction.blockchain]
  const gas = await estimate(transaction)
  const gasPrice = await provider.getGasPrice()
  return wallet.signClient.request({
    topic: wallet.session.topic,
    chainId: `${blockchain.namespace}:${blockchain.networkId}`,
    request: {
      method: 'eth_sendTransaction',
      params: [{
        from: transaction.from,
        to: transaction.to,
        value: transaction.value ? ethers.BigNumber.from(transaction.value.toString()).toHexString() : undefined,
        data: await transaction.getData(),
        gas: gas.toHexString(),
        gasPrice: gasPrice.toHexString(),
        nonce: transaction.nonce,
      }]
    }
  }).catch((e)=>{console.log('ERROR', e)})
}

const submitSimpleTransfer = async ({ transaction, wallet })=>{
  const provider = await getProvider(transaction.blockchain)
  let blockchain = Blockchains[transaction.blockchain]
  const gas = await estimate(transaction)
  const gasPrice = await provider.getGasPrice()
  return wallet.signClient.request({
    topic: wallet.session.topic,
    chainId: `${blockchain.namespace}:${blockchain.networkId}`,
    request: {
      method: 'eth_sendTransaction',
      params: [{
        from: transaction.from,
        to: transaction.to,
        value: transaction.value ? ethers.BigNumber.from(transaction.value.toString()).toHexString() : undefined,
        gas: gas.toHexString(),
        gasPrice: gasPrice.toHexString(),
        nonce: transaction.nonce
      }]
    }
  }).catch((e)=>{console.log('ERROR', e)})
}

export {
  sendTransaction
}
