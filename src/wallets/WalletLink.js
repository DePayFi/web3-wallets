import { CoinbaseWalletSDK } from '@depay/coinbase-wallet-sdk'
import { Blockchain } from '@depay/web3-blockchains'
import { estimate } from './WalletLink/estimate'
import { ethers } from 'ethers'
import { sendTransaction } from './WalletLink/transaction'

const setConnectedInstance = (value)=>{
  window._connectedWalletLinkInstance = value
}

const getConnectedInstance = ()=>{
  return window._connectedWalletLinkInstance
}

class WalletLink {

  static info = {
    name: 'Coinbase',
    logo: "data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 488.96 488.96'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:url(%23linear-gradient);%7D.cls-2%7Bfill:%234361ad;%7D%3C/style%3E%3ClinearGradient id='linear-gradient' x1='250' y1='7.35' x2='250' y2='496.32' gradientTransform='matrix(1, 0, 0, -1, 0, 502)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%233d5ba9'/%3E%3Cstop offset='1' stop-color='%234868b1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath class='cls-1' d='M250,5.68C114.87,5.68,5.52,115,5.52,250.17S114.87,494.65,250,494.65,494.48,385.29,494.48,250.17,385.13,5.68,250,5.68Zm0,387.54A143.06,143.06,0,1,1,393.05,250.17,143.11,143.11,0,0,1,250,393.22Z' transform='translate(-5.52 -5.68)'/%3E%3Cpath class='cls-2' d='M284.69,296.09H215.31a11,11,0,0,1-10.9-10.9V215.48a11,11,0,0,1,10.9-10.91H285a11,11,0,0,1,10.9,10.91v69.71A11.07,11.07,0,0,1,284.69,296.09Z' transform='translate(-5.52 -5.68)'/%3E%3C/svg%3E",
    blockchains: ['ethereum', 'bsc'],
    install: 'https://www.coinbase.com/wallet'
  }
  
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
    this.estimate = (transaction)=> {
      return estimate({
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
    return this.connectedAccounts[0]
  }

  async accounts() {
    if(this.connectedAccounts == undefined) { return [] }
    return this.connectedAccounts
  }

  async connect(options) {
    let relay = await this.connector._relayProvider()
    relay.setConnectDisabled(false)
    let accounts = await this.connector.enable()
    if(accounts instanceof Array && accounts.length) {
      setConnectedInstance(this)
    }
    this.connectedAccounts = accounts
    this.connectedChainId = await this.connector.getChainId()
    return accounts
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
        internalCallback = (accounts) => callback(accounts[0])
        this.connector.on('accountsChanged', internalCallback)
        break
      case 'accounts':
        internalCallback = (accounts) => callback(accounts)
        this.connector.on('accountsChanged', internalCallback)
        break
      case 'network':
        internalCallback = (chainId) => callback(Blockchain.findById(chainId).name)
        this.connector.on('chainChanged', internalCallback)
        break
      case 'disconnect':
        internalCallback = callback
        this.connector.on('disconnect', internalCallback)
        break
    }
    return internalCallback
  }

  off(event, internalCallback) {
    switch (event) {
      case 'account':
        this.connector.removeListener('accountsChanged', internalCallback)
        break
      case 'accounts':
        this.connector.removeListener('accountsChanged', internalCallback)
        break
      case 'network':
        this.connector.removeListener('chainChanged', internalCallback)
        break
      case 'disconnect':
        this.connector.removeListener('disconnect', internalCallback)
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

export {
  WalletLink,
  getConnectedInstance,
  setConnectedInstance
}
