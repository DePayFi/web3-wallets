import { WalletConnect, QRCodeModal } from '@depay/walletconnect'
import { Blockchain } from 'depay-web3-blockchains'
import { estimate } from './WalletConnect/estimate'
import { sendTransaction } from './WalletConnect/transaction'

let connectedInstance

const setConnectedInstance = (value)=>{
  connectedInstance = value
}

class WalletConnectWallet {
  name = 'WalletConnect'
  logo =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%233B99FC;%7D%0A%3C/style%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cpath id='WalletConnect' class='st0' d='M169.2,184.5c47.9-46.9,125.6-46.9,173.6,0l5.8,5.6c2.4,2.3,2.4,6.2,0,8.5L328.8,218 c-1.2,1.2-3.1,1.2-4.3,0l-7.9-7.8c-33.4-32.7-87.7-32.7-121.1,0l-8.5,8.3c-1.2,1.2-3.1,1.2-4.3,0l-19.7-19.3c-2.4-2.3-2.4-6.2,0-8.5 L169.2,184.5z M383.6,224.5l17.6,17.2c2.4,2.3,2.4,6.2,0,8.5L322,327.7c-2.4,2.3-6.3,2.3-8.7,0c0,0,0,0,0,0l-56.2-55 c-0.6-0.6-1.6-0.6-2.2,0c0,0,0,0,0,0l-56.2,55c-2.4,2.3-6.3,2.3-8.7,0c0,0,0,0,0,0l-79.2-77.5c-2.4-2.3-2.4-6.2,0-8.5l17.6-17.2 c2.4-2.3,6.3-2.3,8.7,0l56.2,55c0.6,0.6,1.6,0.6,2.2,0c0,0,0,0,0,0l56.2-55c2.4-2.3,6.3-2.3,8.7,0c0,0,0,0,0,0l56.2,55 c0.6,0.6,1.6,0.6,2.2,0l56.2-55C377.3,222.1,381.2,222.1,383.6,224.5z'/%3E%3C/svg%3E%0A"
  blockchains = ['ethereum', 'bsc']

  constructor() {
    this.connector = this.newWalletConnectInstance()
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
    let instance = new WalletConnect({
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
      this.connector = this.newWalletConnectInstance()
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
    switch (event) {
      case 'account':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0]
          if(accounts instanceof Array) { callback(accounts[0]) }
        })
        break
      case 'accounts':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0]
          callback(accounts)
        })
        break
      case 'network':
        this.connector.on("session_update", (error, payload) => {
          const { chainId } = payload.params[0]
          if(chainId) { callback(Blockchain.findByNetworkId(chainId).name) }
        })
        break
      case 'disconnect':
        this.connector.on('disconnect', callback)
        break
    }
  }
}

export {
  WalletConnectWallet,
  connectedInstance,
  setConnectedInstance
}
