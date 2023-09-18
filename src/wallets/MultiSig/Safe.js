/*#if _EVM

import { request, getProvider } from '@depay/web3-client-evm'

/*#elif _SOLANA

import { request, getProvider } from '@depay/web3-client-solana'

//#else */

import { request, getProvider } from '@depay/web3-client'

//#endif

const transactionApiBlockchainNames = {
  'ethereum': 'mainnet',
  'bsc': 'bsc',
  'polygon': 'polygon',
  'arbitrum': 'arbitrum',
  'base': 'base',
  'avalanche': 'avalanche',
  'gnosis': 'gnosis-chain',
  'optimism': 'optimism',
}

const explorerBlockchainNames = {
  'ethereum': 'eth',
  'bsc': 'bnb',
  'polygon': 'matic',
  'arbitrum': 'arb1',
  'base': 'base',
  'avalanche': 'avax',
  'gnosis': 'gno',
  'optimism': 'oeth',
}

export default class Safe {

  constructor ({ address, blockchain }) {
    this.address = address
    this.blockchain = blockchain
  }

  async transactionCount() {
    let transactionCount
    let jsonResult = await fetch(`https://safe-transaction-${transactionApiBlockchainNames[this.blockchain]}.safe.global/api/v1/safes/${this.address}/all-transactions/`)
      .then((response) => response.json())
      .catch((error) => { console.error('Error:', error) })
    if(jsonResult && jsonResult.results && jsonResult.results.length) {
      transactionCount = jsonResult.results[0].nonce + 1
    } else {
      transactionCount = parseInt((await request({
        blockchain: this.blockchain,
        address: this.address,
        api: [{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
        method: 'nonce',
      })).toString(), 10)
    }
    return transactionCount
  }

  async retrieveTransaction({ blockchain, tx }) {
    const provider = await getProvider(blockchain)
    let jsonResult = await fetch(`https://safe-transaction-${transactionApiBlockchainNames[blockchain]}.safe.global/api/v1/multisig-transactions/${tx}/`)
      .then((response) => response.json())
      .catch((error) => { console.error('Error:', error) })
    if(jsonResult && jsonResult.isExecuted && jsonResult.transactionHash) {
      return await provider.getTransaction(jsonResult.transactionHash)
    } else {
      return undefined
    }
  }

  explorerUrlFor({ transaction }) {
    if(transaction) {
      return `https://app.safe.global/${explorerBlockchainNames[transaction.blockchain]}:${transaction.from}/transactions/tx?id=multisig_${transaction.from}_${transaction.id}`
    }
  }
}
