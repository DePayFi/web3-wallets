import Blockchains from '@depay/web3-blockchains'
import { Core, SignClient } from "@depay/walletconnect-v2"
import { ethers } from 'ethers'
import { sendTransaction } from './WalletConnectV2/transaction'
import { supported } from '../blockchains'

const KEY = '_DePayWeb3WalletsConnectedWalletConnectV2Instance'

const getConnectedInstance = ()=>{
  return window[KEY]
}

const setConnectedInstance = (value)=>{
  window[KEY] = value
}

class WalletConnectV2 {

  static info = {
    name: 'WalletConnect',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
    blockchains: supported.evm
  }

  static isAvailable = ()=>{ 
    return getConnectedInstance() != undefined 
  }

  constructor() {
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.connector = WalletConnect.instance || this.newWalletConnectInstance()
    WalletConnect.instance = this.connector
    this.sendTransaction = (transaction)=>{
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  newWalletConnectInstance() { 
    return new Core({ projectId: window._walletConnectProjectId })
  }

  async account() {
    if(this.connectedAccount == undefined) { return }
    return this.connectedAccount
  }

  async connect({ connect, projectId }) {
    
    if(!connect || typeof connect != 'function') { throw('"connect" paremeters is not present or not a function!') }
    if(!projectId) { throw('WalletConnectV2 "projectId" is provided!') }
    
    try {

      delete localStorage[`wc@2:core:${this.connector.pairing.version}//subscription`] // DO NOT RECOVER AN OTHER SUBSCRIPTION!!!
      this.signClient = await SignClient.init({
        projectId,
        metadata: {
          name: document.title || 'dApp',
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || document.title || 'dApp',
          url: location.href,
          icons: [document.querySelector("link[rel~='icon'], link[rel~='shortcut icon']")?.href || `${location.origin}/favicon.ico`]
        }
      })

      this.signClient.on("session_delete", ()=> {
        console.log('WALLETCONNECT DISCONNECT')
        this.connector = undefined
        WalletConnect.instance = undefined
        this.connectedAccount = undefined
        this.signClient = undefined
        this.session = undefined
      })

      this.signClient.on("session_update", (session)=> {
        console.log('session', session)
        if(session.topic === this.session.topic) {
          console.log('CURRENT SESSION UPDATE', session)
        }
      })

      this.signClient.on("session_event", ()=> {
        console.log('SESSION EVENT')
      })

      let requiredNamespaces = {}

      requiredNamespaces['eip155'] = {
        methods: [
          "eth_sendTransaction",
          "personal_sign",
          "eth_chainId",
          "wallet_switchEthereumChain",
        ],
        chains: [`eip155:1`],
        events: [],
      }

      const { uri, approval } = await this.signClient.connect({ requiredNamespaces })

      await connect({ uri })
      this.session = await approval()
      
      let meta = this.session?.peer?.metadata
      if(meta && meta.name) {
        this.name = meta.name
        if(meta?.icons && meta.icons.length) { this.logo = meta.icons[0] }
      }

      let getConnectedChainId = async()=>{
        let results = (await Promise.all(this.session.namespaces.eip155.chains.map((identifier)=>{
          return Promise.race([
            new Promise((resolve)=>{setTimeout(resolve, 500)}),
            this.signClient.request({
              topic: this.session.topic,
              chainId: identifier,
              request: {
                method: 'eth_chainId'
              }
            })
          ])
        })))
        return results.filter(Boolean)[0]
      }

      let connectedChainId
      for(var i = 0; i<3; i++) {
        await new Promise((resolve)=>{setTimeout(resolve, 500)})
        connectedChainId = await getConnectedChainId()
        if(connectedChainId){ break }
      }
      
      let connectedBlockchain = Blockchains.findById(connectedChainId)
      this.connectedBlockchain = connectedBlockchain.name
      this.session.chainId = `${connectedBlockchain.namespace}:${connectedBlockchain.networkId}`

      const account = Object.values(this.session.namespaces)[0].accounts.find((account)=>account.match(`:${connectedBlockchain.networkId}:`)).split(":")[2]
      this.connectedAccount = account
      
      return account

    } catch (error) {
      console.log('WALLETCONNECT ERROR', error)
    }
  }

  async connectedTo(input) {
    let chainId = await this.signClient.request({
      topic: this.session.topic,
      chainId: this.session.chainId,
      request: {
        method: 'eth_chainId'
      }
    })
    const blockchain = Blockchains.findById(chainId)
    if(!blockchain) { return false }
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      let resolved, rejected
      const blockchain = Blockchains[blockchainName]
      setTimeout(async()=>{
        if(!(await this.connectedTo(blockchainName)) && !resolved && !rejected){
          reject({ code: 'NOT_SUPPORTED' })
        } else {
          resolve()
        }
      }, 4000)
      this.signClient.request({
        topic: this.session.topic,
        chainId: this.session.chainId,
        request:{
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: blockchain.id }],
        }
      }).then((result)=>{
        this.session.chainId = `${blockchain.namespace}:${blockchain.networkId}`
        resolved = true
        resolve()
      })
    })
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  on(event, callback) {
    // not yet supported
  }

  off(event, callback) {
    // not yet supported
  }

  async sign(message) {
    let address = await this.account()
    var params = [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), address]
    let signature = await this.signClient.request({
      topic: this.session.topic,
      chainId: this.session.chainId,
      request:{
        method: 'personal_sign',
        params
      }
    })
    if(typeof signature == 'object') {
      signature = ethers.utils.hexlify(signature)
    }
    return signature
  }
}

WalletConnectV2.getConnectedInstance = getConnectedInstance
WalletConnectV2.setConnectedInstance = setConnectedInstance

export default WalletConnectV2
