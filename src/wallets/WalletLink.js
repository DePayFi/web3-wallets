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
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA2My44IDYzLjgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYzLjggNjMuODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMxQjUzRTQ7fQoJLnN0MXtmaWxsOm5vbmU7c3Ryb2tlOiNGRkZGRkY7c3Ryb2tlLXdpZHRoOjAuNTE7c3Ryb2tlLW1pdGVybGltaXQ6Mi4wNDt9Cgkuc3Qye2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxnPgoJPGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iMjYuMyIgY3k9IjM4LjEiIHI9IjIyLjMiLz4KCTxjaXJjbGUgY2xhc3M9InN0MSIgY3g9IjI2LjMiIGN5PSIzOC4xIiByPSIyMi4zIi8+Cgk8cGF0aCBjbGFzcz0ic3QyIiBkPSJNMTAuNywzOGMwLDguNiw3LDE1LjYsMTUuNiwxNS42YzguNiwwLDE1LjYtNywxNS42LTE1LjZjMC04LjYtNy0xNS42LTE1LjYtMTUuNkMxNy43LDIyLjQsMTAuNywyOS40LDEwLjcsMzh6CgkJIE0yMy4zLDMzYy0xLjEsMC0yLDAuOS0yLDJ2NmMwLDEuMSwwLjksMiwyLDJoNmMxLjEsMCwyLTAuOSwyLTJ2LTZjMC0xLjEtMC45LTItMi0ySDIzLjN6Ii8+CjwvZz4KPGc+Cgk8cmVjdCB4PSI0Ny43IiB5PSIxMC40IiB3aWR0aD0iNi42IiBoZWlnaHQ9IjYuNiIvPgoJPHBhdGggZD0iTTQzLjMsNS45djE1LjVoMTUuNVY1LjlINDMuM3ogTTU2LjUsMTkuMkg0NS41VjguMmgxMS4xVjE5LjJ6Ii8+CjwvZz4KPC9zdmc+Cg==",
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
