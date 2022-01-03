import { Blockchain } from '@depay/web3-blockchains'
import { estimate } from './WalletConnect/estimate'
import { ethers } from 'ethers'
import { sendTransaction } from './WalletConnect/transaction'
import { WalletConnectClient, QRCodeModal } from '@depay/walletconnect-v1'

let connectedInstance

const setConnectedInstance = (value)=>{
  connectedInstance = value
}

class WalletConnectWallet {
  
  static name = 'WalletConnect'
  static logo = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 500 500' style='enable-background:new 0 0 500 500;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%235991CD;%7D%0A%3C/style%3E%3Cg id='Page-1'%3E%3Cg id='walletconnect-logo-alt'%3E%3Cpath id='WalletConnect' class='st0' d='M102.7,162c81.5-79.8,213.6-79.8,295.1,0l9.8,9.6c4.1,4,4.1,10.5,0,14.4L374,218.9 c-2,2-5.3,2-7.4,0l-13.5-13.2c-56.8-55.7-149-55.7-205.8,0l-14.5,14.1c-2,2-5.3,2-7.4,0L91.9,187c-4.1-4-4.1-10.5,0-14.4 L102.7,162z M467.1,229.9l29.9,29.2c4.1,4,4.1,10.5,0,14.4L362.3,405.4c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L252,311.9 c-1-1-2.7-1-3.7,0h0l-95.5,93.5c-4.1,4-10.7,4-14.8,0c0,0,0,0,0,0L3.4,273.6c-4.1-4-4.1-10.5,0-14.4l29.9-29.2 c4.1-4,10.7-4,14.8,0l95.5,93.5c1,1,2.7,1,3.7,0c0,0,0,0,0,0l95.5-93.5c4.1-4,10.7-4,14.8,0c0,0,0,0,0,0l95.5,93.5 c1,1,2.7,1,3.7,0l95.5-93.5C456.4,225.9,463,225.9,467.1,229.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A"
  static blockchains = ['ethereum', 'bsc']

  constructor() {
    this.name = this.constructor.name
    this.logo = this.constructor.logo
    this.blockchains = this.constructor.blockchains
    this.connector = WalletConnectWallet.instance || this.newWalletConnectInstance()
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

  newWalletConnectInstance() {
    let instance = new WalletConnectClient({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal
    })

    instance.on("connect", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0]
      this.connectedAccounts = accounts
      this.connectedChainId = chainId
    })

    instance.on("session_update", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0]
      this.connectedAccounts = accounts
      this.connectedChainId = chainId
    })

    instance.on("disconnect", (error, payload) => {
      connectedInstance = undefined
      if (error) { throw error }
    })

    instance.on("modal_closed", ()=>{
      connectedInstance = undefined
      this.connector = undefined
    })

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
    try {
      if(this.connector.connected) {
        await this.connector.killSession()
        connectedInstance = undefined
        this.connector = this.newWalletConnectInstance()
      }

      const { accounts, chainId } = await this.connector.connect({ chainId: options?.chainId })

      if(accounts instanceof Array && accounts.length) {
        connectedInstance = this
      }

      this.connectedAccounts = accounts
      this.connectedChainId = chainId
        
      return accounts
    } catch {
      return []
    }
  }

  async connectedTo(input) {
    let chainId = await this.connector.sendCustomRequest({ method: 'eth_chainId' })
    const blockchain = Blockchain.findById(chainId)
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  on(event, callback) {
    let internalCallback
    switch (event) {
      case 'account':
        internalCallback = (error, payload) => {
          const { accounts } = payload.params[0]
          if(accounts instanceof Array) { callback(accounts[0]) }
        }
        this.connector.on("session_update", internalCallback)
        break
      case 'accounts':
        internalCallback = (error, payload) => {
          const { accounts } = payload.params[0]
          callback(accounts)
        }
        this.connector.on("session_update", internalCallback)
        break
      case 'network':
        internalCallback = (error, payload) => {
          const { chainId } = payload.params[0]
          if(chainId) { callback(Blockchain.findByNetworkId(chainId).name) }
        }
        this.connector.on("session_update", internalCallback)
        break
      case 'disconnect':
        internalCallback = callback
        this.connector.on('disconnect', internalCallback)
        break
    }
    return internalCallback
  }

  off(event, callback) {
    switch (event) {
      case 'account':
        this.connector.off("session_update")
        break
      case 'accounts':
        this.connector.off("session_update")
        break
      case 'network':
        this.connector.off("session_update")
        break
      case 'disconnect':
        this.connector.off('disconnect')
        break
    }
  }

  async sign(message) {
    let address = await this.account()
    var params = [ethers.utils.toUtf8Bytes(message), address]
    let signature = await this.connector.signPersonalMessage(params)
    return signature
  }
}

export {
  WalletConnectWallet,
  connectedInstance,
  setConnectedInstance
}
