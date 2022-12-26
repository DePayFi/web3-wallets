import { Blockchain } from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { sendTransaction } from './WalletConnect/transaction.evm'
import { WalletConnectClient, QRCodeModal } from '@depay/walletconnect-v1'

const getConnectedInstance = ()=>{
  return window._connectedWalletConnectInstance
}

const setConnectedInstance = (value)=>{
  window._connectedWalletConnectInstance = value
}

class WalletConnect {

  static info = {
    name: 'WalletConnect',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
    blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
  }

  static isAvailable = ()=>{ 
    return getConnectedInstance() != undefined 
  }

  constructor() {
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.connector = WalletConnect.instance || this.newWalletConnectInstance()
    this.sendTransaction = (transaction)=>{ 
      return sendTransaction({
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
      this.connectedAccounts = accounts.map((account)=>ethers.utils.getAddress(account))
      this.connectedChainId = chainId
    })

    instance.on("session_update", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0]
      this.connectedAccounts = accounts.map((account)=>ethers.utils.getAddress(account))
      this.connectedChainId = chainId
    })

    instance.on("disconnect", (error, payload) => {
      setConnectedInstance(undefined)
      if (error) { throw error }
    })

    instance.on("modal_closed", ()=>{
      setConnectedInstance(undefined)
      this.connector = undefined
    })

    return instance
  }

  async account() {
    if(this.connectedAccounts == undefined) { return }
    return this.connectedAccounts[0]
  }

  async connect(options) {
    try {
      window.localStorage.removeItem('walletconnect') // https://github.com/WalletConnect/walletconnect-monorepo/issues/315

      if(this.connector == undefined){
        this.connector = this.newWalletConnectInstance()
      }

      if(this.connector.connected) {
        await this.connector.killSession()
        setConnectedInstance(undefined)
        this.connector = this.newWalletConnectInstance()
      }

      let { accounts, chainId } = await this.connector.connect({ chainId: options?.chainId })

      if(accounts instanceof Array && accounts.length) {
        setConnectedInstance(this)
      }

      accounts = accounts.map((account)=>ethers.utils.getAddress(account))
      this.connectedAccounts = accounts
      this.connectedChainId = chainId

      return accounts[0]
    } catch (error) {
      console.log('WALLETCONNECT ERROR', error)
      return undefined
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
      let resolved, rejected
      const blockchain = Blockchain.findByName(blockchainName)
      setTimeout(async()=>{
        if(!(await this.connectedTo(blockchainName)) && !resolved && !rejected){
          reject({ code: 'NOT_SUPPORTED' })
        } else {
          resolve()
        }
      }, 3000)
      this.connector.sendCustomRequest({ 
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: blockchain.id }],
      }).then(()=>{
        resolved = true
        resolve()
      }).catch((error)=> {
        if(error && typeof error.message == 'string' && error.message.match('addEthereumChain')){ // chain not yet added
          this.addNetwork(blockchainName)
            .then(()=>this.switchTo(blockchainName).then(()=>{
              resolved = true
              resolve()
            }))
            .catch(()=>{
              rejected = true
              reject({ code: 'NOT_SUPPORTED' })
            })
        } else {
          rejected = true
          reject({ code: 'NOT_SUPPORTED' })
        }
      })
    })
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName)
      this.connector.sendCustomRequest({ 
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
        internalCallback = (error, payload) => {
          if(payload && payload.params && payload.params[0].accounts && payload.params[0].accounts instanceof Array) {
            const accounts = payload.params[0].accounts.map((account)=>ethers.utils.getAddress(account))
            callback(accounts[0])
          }
        }
        this.connector.on("session_update", internalCallback)
        break
    }
    return internalCallback
  }

  off(event, callback) {
    switch (event) {
      case 'account':
        this.connector.off("session_update")
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

WalletConnect.getConnectedInstance = getConnectedInstance
WalletConnect.setConnectedInstance = setConnectedInstance

export default WalletConnect
