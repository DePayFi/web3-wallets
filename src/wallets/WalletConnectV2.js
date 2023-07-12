import Blockchains from '@depay/web3-blockchains'
import { Core, SignClient } from "@depay/walletconnect-v2"
import { ethers } from 'ethers'
import { sendTransaction } from './WalletConnectV2/transaction'
import { supported } from '../blockchains'

const KEY = 'depay:wallets:wc2'

const getLastSession = async()=>{
  if(!localStorage[KEY+":projectId"]) { return }
  let signClient = await getSignClient()
  const existingSessions = signClient.find(getWalletConnectV2Config())
  const lastSession = existingSessions ? existingSessions[existingSessions.length-1] : undefined
  if(lastSession && lastSession.expiry > Math.ceil(Date.now()/1000)) {
    try {
      if(await getConnectedChainId(signClient, lastSession)) {
        return lastSession
      }
    } catch {}
  }
}

const getConnectedChainId = async(signClient, session)=>{
  let results = (await Promise.all(session.namespaces.eip155.chains.map((identifier)=>{
    return Promise.race([
      new Promise((resolve)=>{setTimeout(resolve, 1500)}),
      signClient.request({
        topic: session.topic,
        chainId: identifier,
        request: {
          method: 'eth_chainId'
        }
      })
    ])
  })))
  return results.filter(Boolean)[0]
}

const getConnectedInstance = async()=>{
  if(localStorage[KEY+":projectId"]) {
    const lastSession = await getLastSession()
    if(lastSession) {
      return new WalletConnectV2()
    }
  }
}

const setConnectedInstance = (value)=>{
}

const getWalletConnectV2Config = ()=>{
  const methods = [
    "eth_sendTransaction",
    "personal_sign",
    "eth_signTypedData_v4",
    "eth_chainId",
    "eth_accounts",
    "wallet_switchEthereumChain",
  ]

  const events = ['accountsChanged']

  let requiredNamespaces = {}
  requiredNamespaces['eip155'] = {
    methods,
    events,
    chains: [`eip155:1`],
  }

  let optionalNamespaces = {}
  optionalNamespaces['eip155'] = {
    methods,
    events,
    chains: supported.evm.map((blockchain)=>`${Blockchains[blockchain].namespace}:${Blockchains[blockchain].networkId}`),
  }

  return { requiredNamespaces, optionalNamespaces }
}

const getSignClient = ()=>{
  if(window.getSignClientPromise) { return window.getSignClientPromise }
  window.getSignClientPromise = new Promise(async(resolve)=>{
    const signClient = await SignClient.init({
      core: new Core({ projectId: localStorage[KEY+":projectId"] }),
      metadata: {
        name: document.title || 'dApp',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || document.title || 'dApp',
        url: location.href,
        icons: [document.querySelector("link[rel~='icon'], link[rel~='shortcut icon']")?.href || `${location.origin}/favicon.ico`]
      }
    })
    resolve(signClient)
  })

  return window.getSignClientPromise  
}

class WalletConnectV2 {

  static info = {
    name: 'WalletConnect V2',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
    blockchains: supported.evm
  }

  static isAvailable = ()=>{ 
    return getConnectedInstance() != undefined 
  }

  constructor() {
    this.name = (localStorage[KEY+':name'] && localStorage[KEY+':name'] != undefined) ? localStorage[KEY+':name'] : this.constructor.info.name
    this.logo = (localStorage[KEY+':logo'] && localStorage[KEY+':logo'] != undefined) ? localStorage[KEY+':logo'] : this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.sendTransaction = (transaction)=>{
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  async account() {
    const connectedChainId = await getConnectedChainId(this.signClient, this.session)
    const connectedBlockchain = Blockchains.findById(connectedChainId)
    const accounts = await this.signClient.request({
      topic: this.session.topic,
      chainId: `${connectedBlockchain.namespace}:${connectedBlockchain.networkId}`,
      request:{
        method: 'eth_accounts',
        params: [{ chainId: connectedBlockchain.id }],
      }
    })
    return accounts ? accounts[0] : undefined
  }

  async connect(options) {
    
    let connect = (options && options.connect) ? options.connect : ({uri})=>{}
    
    try {

      // delete localStorage[`wc@2:client:0.3//session`] // DO NOT RECOVER AN OTHER SUBSCRIPTION!!!
      this.signClient = await getSignClient()

      this.signClient.on("session_delete", (session)=> {
        if(session?.topic === this.session?.topic) {
          localStorage[KEY+':name'] = undefined
          localStorage[KEY+':logo'] = undefined
          WalletConnect.instance = undefined
          this.signClient = undefined
          this.session = undefined
        }
      })

      this.signClient.on("session_update", async(session)=> {
        if(session?.topic === this.session?.topic) {
          this.session = this.signClient.session.get(session.topic)
        }
      })

      this.signClient.on("session_event", (event)=> {
        if(event?.topic === this.session?.topic) {
        }
      })

      const lastSession = await getLastSession()
      if(lastSession) {
        this.session = lastSession
      }
      
      const connectWallet = async()=>{
        const { uri, approval } = await this.signClient.connect(getWalletConnectV2Config())
        await connect({ uri })
        this.session = await approval()
      }

      if(!this.session){ await connectWallet() }

      let meta = this.session?.peer?.metadata
      if(meta && meta.name) {
        this.name = meta.name
        localStorage[KEY+':name'] = meta.name
        if(meta?.icons && meta.icons.length) {
          this.logo = meta.icons[0]
          localStorage[KEY+':logo'] = this.logo
        }
      }
      if(options?.name) { localStorage[KEY+':name'] = this.name = options.name }
      if(options?.logo) { localStorage[KEY+':logo'] = this.logo = options.logo }

      let connectedChainId
      for(var i = 0; i<3; i++) {
        await new Promise((resolve)=>{setTimeout(resolve, 500)})
        connectedChainId = await getConnectedChainId(this.signClient, this.session)
        if(connectedChainId){ break }
      }

      if(!connectedChainId) { await connectWallet() }

      let connectedBlockchain = Blockchains.findById(connectedChainId)

      return await this.account()

    } catch (error) {
      console.log('WALLETCONNECT ERROR', error)
    }
  }

  async connectedTo(input) {
    let chainId = await getConnectedChainId(this.signClient, this.session)
    if(!chainId) { return false }
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
          this.connectedChainId = `${blockchain.namespace}:${blockchain.networkId}`
          resolve()
        }
      }, 4000)
      this.session.namespaces.eip155.chains.map((identifier)=>{
        return Promise.race([
          new Promise((resolve)=>{setTimeout(resolve, 1500)}),
          this.signClient.request({
            topic: this.session.topic,
            chainId: identifier,
            request:{
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: blockchain.id }],
            }
          })
        ])
      })
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
        internalCallback = async(event)=> {
          if(event?.topic === this.session?.topic && event.params.event.name === 'accountsChanged') {
            callback(await this.account())
          }
        }
        this.signClient.on("session_event", internalCallback)
        break
    }
    return internalCallback
  }

  off(event, callback) {
    switch (event) {
      case 'account':
        this.signClient.off("session_event", callback)
        break
    }
  }

  async sign(message) {
    if(typeof message === 'object') {
      let account = await this.account()
      const blockchain = Blockchains.findByNetworkId(message.domain.chainId)
      if((await this.connectedTo(blockchain.name)) === false) {
        throw({ code: 'WRONG_NETWORK' })
      }
      let signature = await this.signClient.request({
        topic: this.session.topic,
        chainId: `${blockchain.namespace}:${blockchain.networkId}`,
        request:{
          method: 'eth_signTypedData_v4',
          params: [account, JSON.stringify(message)],
        }
      })
      return signature
    } else if (typeof message === 'string') {
      const address = await this.account()
      const params = [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), address]
      const connectedChainId = await getConnectedChainId(this.signClient, this.session)
      const blockchain = Blockchains.findById(connectedChainId)
      let signature = await this.signClient.request({
        topic: this.session.topic,
        chainId: `${blockchain.namespace}:${blockchain.networkId}`,
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
}

WalletConnectV2.getConnectedInstance = getConnectedInstance
WalletConnectV2.setConnectedInstance = setConnectedInstance

export default WalletConnectV2
