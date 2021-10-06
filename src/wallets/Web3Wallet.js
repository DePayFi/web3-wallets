import { Blockchain } from 'depay-web3-blockchains'
import { estimate } from './Web3Wallet/estimate'
import { sendTransaction } from './Web3Wallet/transaction'

export default class Web3Wallet {
  name = 'Web3 Wallet'
  logo =
    'data:image/png;base64,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'
  blockchains = ['ethereum']

  constructor () {
    this.sendTransaction = (transaction)=>{ 
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
    this.estimate = (transaction)=> {
      return estimate({
        wallet: this,
        transaction
      })
    }
  }

  async account() {
    return (await this.accounts())[0]
  }

  async accounts() {
    if(!window?.ethereum) { return [] }
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts
  }

  async connect() {
    if(!window?.ethereum) { return [] }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts
  }

  on(event, callback) {
    switch (event) {
      case 'account':
        window.ethereum.on('accountsChanged', (accounts) => callback(accounts[0]))
        break
      case 'accounts':
        window.ethereum.on('accountsChanged', (accounts) => callback(accounts))
        break
      case 'network':
        window.ethereum.on('chainChanged', (chainId) => callback(Blockchain.findById(chainId).name))
        break
      case 'disconnect':
        window.ethereum.on('disconnect', callback)
        break
    }
  }

  async connectedTo(input) {
    const blockchain = Blockchain.findById(await window.ethereum.request({ method: 'eth_chainId' }))
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName)
      ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: blockchain.id,
          chainName: blockchain.fullName,
          nativeCurrency: {
            name: blockchain.currency.name,
            symbol: blockchain.currency.symbol,
            decimals: blockchain.currency.decimals
          },
          rpcUrls: [blockchain.rpc],
          blockExplorerUrls: [blockchain.explorer],
          iconUrls: [blockchain.logo]
        }],
      }).then(resolve).catch(reject)
    })
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName)
      ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: blockchain.id }],
      }).then(resolve).catch((error)=> {
        if(error.code === 4902){ // metamask chain not yet added {
          this.addNetwork(blockchainName)
            .then(()=>this.switchTo(blockchainName).then(resolve))
            .catch(reject)
        } else {
          reject(error)
        }
      })
    })
  }
}
