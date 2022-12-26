import { CoinbaseWalletSDK } from '@depay/coinbase-wallet-sdk'
import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { sendTransaction } from './WalletLink/transaction'
import Coinbase from './Coinbase'

const getConnectedInstance = ()=>{
  return window._connectedWalletLinkInstance
}

const setConnectedInstance = (value)=>{
  window._connectedWalletLinkInstance = value
}

class WalletLink {

  static info = {
    name: 'Coinbase',
    logo: Coinbase.info.logo,
    blockchains: ['ethereum', 'bsc', 'polygon', 'velas'],
  }

  static isAvailable = ()=>{ return getConnectedInstance() != undefined }

  constructor() {
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.connector = WalletLink.instance || this.newWalletLinkInstance()
    this.sendTransaction = (transaction)=>{
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  newWalletLinkInstance() {
    let instance = new CoinbaseWalletSDK({}).makeWeb3Provider()
    return instance
  }

  async account() {
    if(this.connectedAccounts == undefined) { return }
    return ethers.utils.getAddress(this.connectedAccounts[0])
  }

  async connect(options) {
    let relay = await this.connector._relayProvider()
    relay.setConnectDisabled(false)
    let accounts = await this.connector.enable()
    if(accounts instanceof Array && accounts.length) {
      setConnectedInstance(this)
    }
    accounts = accounts.map((account)=>ethers.utils.getAddress(account))
    this.connectedAccounts = accounts
    this.connectedChainId = await this.connector.getChainId()
    return accounts[0]
  }

  async connectedTo(input) {
    let chainId = await this.connector.getChainId()
    const blockchain = Blockchain.findByNetworkId(chainId)
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName)
      this.connector.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: blockchain.id }],
      }).then(resolve).catch((error)=> {
        if(error.code === 4902){ // chain not yet added
          this.addNetwork(blockchainName)
            .then(()=>this.switchTo(blockchainName).then(resolve))
            .catch(reject)
        } else {
          reject(error)
        }
      })
    })
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName)
      this.connector.request({
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

  on(event, callback) {
    let internalCallback
    switch (event) {
      case 'account':
        internalCallback = (accounts) => callback(ethers.utils.getAddress(accounts[0]))
        this.connector.on('accountsChanged', internalCallback)
        break
    }
    return internalCallback
  }

  off(event, internalCallback) {
    switch (event) {
      case 'account':
        this.connector.removeListener('accountsChanged', internalCallback)
        break
    }
    return internalCallback
  }

  async sign(message) {
    let address = await this.account()
    let provider = new ethers.providers.Web3Provider(this.connector, 'any')
    let signer = provider.getSigner(0)
    let signature = await signer.signMessage(message)
    return signature
  }
}

WalletLink.getConnectedInstance = getConnectedInstance
WalletLink.setConnectedInstance = setConnectedInstance

export default WalletLink
