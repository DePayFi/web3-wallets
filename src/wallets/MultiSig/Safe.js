import { request, getProvider } from '@depay/web3-client'

const blockchainNames = {
  'ethereum': 'mainnet',
  'bsc': 'bsc',
  'polygon': 'polygon',
}

export default class Safe {

  constructor ({ address, blockchain }) {
    this.address = address
    this.blockchain = blockchain
  }

  async transactionCount() {
    return parseInt((await request({
      blockchain: this.blockchain,
      address: this.address,
      api: [{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
      method: 'nonce',
    })).toString(), 10)
  }

  async retrieveTransaction({ blockchain, tx }) {
    const provider = await getProvider(blockchain)
    let jsonResult = await fetch(`https://safe-transaction-${blockchainNames[blockchain]}.safe.global/api/v1/multisig-transactions/${tx}/`)
      .then((response) => response.json())
      .catch((error) => { console.error('Error:', error) })
    if(jsonResult && jsonResult.isExecuted && jsonResult.transactionHash) {
      return await provider.getTransaction(jsonResult.transactionHash)
    } else {
      return undefined
    }
  }
}
