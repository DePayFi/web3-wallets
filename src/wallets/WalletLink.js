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
    name: 'Coinbase WalletLink',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1Mi44IDYwLjUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUyLjggNjAuNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMxQjUzRTQ7fQoJLnN0MXtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOiNGRkZGRkY7fQo8L3N0eWxlPgo8Zz4KCTxyZWN0IHg9IjM0LjMiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iMCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIwIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjQ3LjUiIHk9IjAiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI1MC4xIiB5PSIwIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iMi43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iMi43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzkuNiIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDIuMiIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzkuNiIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDIuMiIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iNy45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iMzQuMyIgeT0iMTAuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjEwLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIxMC41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMTAuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjUwLjEiIHk9IjEwLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNC4zIiB5PSIxMy4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNTAuMSIgeT0iMTMuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM0LjMiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iMTUuOCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjM5LjYiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI0Mi4yIiB5PSIxNS44IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgoJPHJlY3QgeD0iNDQuOSIgeT0iMTUuOCIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KCTxyZWN0IHg9IjQ3LjUiIHk9IjE1LjgiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+Cgk8cmVjdCB4PSI1MC4xIiB5PSIxNS44IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8L2c+CjxyZWN0IHg9IjguMSIgeT0iMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTAuOCIgeT0iMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjI2LjYiIHk9IjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjguMSIgeT0iNC42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIxMC44IiB5PSI0LjYiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjEzLjQiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTguNyIgeT0iNC42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyMS4zIiB5PSI0LjYiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjI2LjYiIHk9IjQuNiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iNS41IiB5PSI3LjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjEzLjQiIHk9IjcuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMTYiIHk9IjcuMiIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMjEuMyIgeT0iNy4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyMy45IiB5PSI3LjIiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjUuNSIgeT0iOS45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIxMC44IiB5PSI5LjkiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjE2IiB5PSI5LjkiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjIxLjMiIHk9IjkuOSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iMjkuMiIgeT0iOS45IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIyLjkiIHk9IjEyLjUiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjUuNSIgeT0iMTIuNSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPHJlY3QgeD0iOC4xIiB5PSIxMi41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0NSIgeT0iMjEiIHdpZHRoPSIyLjYiIGhlaWdodD0iMi42Ii8+CjxyZWN0IHg9IjQ1IiB5PSIyMy42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIyMy42IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIyNi4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzMS41IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzNC4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSIzOS40IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI0NC43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI0Ny4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSIzOS43IiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Mi4zIiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8cmVjdCB4PSI0Ny42IiB5PSI1NS4yIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIvPgo8Zz4KCTxjaXJjbGUgY2xhc3M9InN0MCIgY3g9IjIyLjQiIGN5PSIzOC4xIiByPSIyMi4zIi8+Cgk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNi44LDM4LjFjMCw4LjYsNywxNS42LDE1LjYsMTUuNlMzOCw0Ni43LDM4LDM4LjFzLTctMTUuNi0xNS42LTE1LjZDMTMuNywyMi41LDYuOCwyOS40LDYuOCwzOC4xeiBNMTkuNCwzMwoJCWMtMS4xLDAtMiwwLjktMiwydjZjMCwxLjEsMC45LDIsMiwyaDZjMS4xLDAsMi0wLjksMi0ydi02YzAtMS4xLTAuOS0yLTItMkgxOS40eiIvPgo8L2c+CjxyZWN0IHg9IjUuNSIgeT0iMTUuMSIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiLz4KPC9zdmc+Cg==",
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
