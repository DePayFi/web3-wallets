/*#if _EVM

import { request } from '@depay/web3-client-evm'

/*#elif _SVM

import { request } from '@depay/web3-client-svm'

//#else */

import { request } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getSmartContractWallet } from './MultiSig'
import { sendTransaction } from './WalletConnectV2/transaction'
import { SignClient } from "@depay/walletconnect-v2"
import { supported } from '../blockchains'

const KEY = 'depay:wallets:wc2'

const DEFAULT_CONFIGURATION = {
  events: ['accountsChanged'],
  methods: [
    "eth_sendTransaction",
    "personal_sign",
    "eth_signTypedData",
    "eth_signTypedData_v4",
  ]
}

const getConnectedInstance = async()=>{
  if(await WalletConnectV2.isAvailable()) { return new WalletConnectV2() }
}

const getLastSession = async(walletName)=>{
  if(!localStorage[KEY+":projectId"]) { return }
  if(walletName !== localStorage[KEY+":lastSessionWalletName"]) { return }
  let signClient = await getSignClient()
  let existingSessions
  try { existingSessions = signClient.find(getWalletConnectV2Config(walletName)) } catch {}
  const lastSession = existingSessions ? existingSessions[existingSessions.length-1] : undefined
  if(lastSession && localStorage[KEY+":lastExpiredSessionTopic"] !== lastSession.topic && lastSession.expiry > Math.ceil(Date.now()/1000)) {
    const result = await Promise.race([signClient.ping({ topic: lastSession.topic }), new Promise((resolve)=>setTimeout(resolve, 1500))])
    if(result) {
      return lastSession
    } else {
      localStorage[KEY+":lastExpiredSessionTopic"] = lastSession.topic
      return
    }
  }
}

const getWalletConnectV2Config = (walletName)=>{
  const methods = DEFAULT_CONFIGURATION.methods
  const events = DEFAULT_CONFIGURATION.events

  let requiredNamespaces = {}
  requiredNamespaces['eip155'] = {
    chains: [`eip155:1`],
  }
  if(requiredNamespaces['eip155']) {
    requiredNamespaces['eip155'].methods = methods
    requiredNamespaces['eip155'].events = events
  }

  let optionalNamespaces = {}
  optionalNamespaces['eip155'] = {
    chains: supported.evm.map((blockchain)=>`${Blockchains[blockchain].namespace}:${Blockchains[blockchain].networkId}`),
  }
  if(optionalNamespaces?.eip155 && optionalNamespaces?.eip155?.chains?.length) {
    optionalNamespaces['eip155'].methods = methods
    optionalNamespaces['eip155'].events = events
  }

  return { requiredNamespaces, optionalNamespaces }
}

const getSignClient = ()=>{
  if(window.getSignClientPromise) { return window.getSignClientPromise }
  window.getSignClientPromise = new Promise(async(resolve)=>{
    const signClient = await SignClient.init({
      projectId: localStorage[KEY+":projectId"],
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

  static isAvailable = async(options)=>{ 
    return !! await getLastSession(options?.walletName)
  }

  constructor() {
    this.name = (localStorage[KEY+':name'] && localStorage[KEY+':name'] != undefined) ? localStorage[KEY+':name'] : this.constructor.info.name
    this.logo = (localStorage[KEY+':logo'] && localStorage[KEY+':logo'] != undefined) ? localStorage[KEY+':logo'] : this.constructor.info.logo
    this.sendTransaction = (transaction)=>{
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  async account() {
    if(this.session?.namespaces?.eip155?.accounts?.length) {
      return this.session.namespaces.eip155.accounts[0].split(':')[2]
    }
  }

  async setSessionBlockchains() {
    if(!this.session || (!this.session?.namespaces?.eip155 && !this.session?.optionalNamespaces?.eip155)) { return }
    if(this.session.namespaces.eip155.chains) {
      this.blockchains = this.session.namespaces.eip155.chains.map((chainIdentifier)=>Blockchains.findByNetworkId(chainIdentifier.split(':')[1])?.name).filter(Boolean)
    } else if(this.session.namespaces.eip155.accounts) {
      this.blockchains = this.session.namespaces.eip155.accounts.map((accountIdentifier)=>Blockchains.findByNetworkId(accountIdentifier.split(':')[1])?.name).filter(Boolean)
    }
  }

  async connect(options) {
    
    let connect = (options && options.connect) ? options.connect : ({uri})=>{}
    
    try {

      this.walletName = options?.name

      // delete localStorage[`wc@2:client:0.3//session`] // DELETE WC SESSIONS
      this.signClient = await getSignClient()

      this.signClient.on("session_delete", (session)=> {
        if(session?.topic === this.session?.topic) {
          localStorage[KEY+':name'] = undefined
          localStorage[KEY+':logo'] = undefined
          this.signClient = undefined
          this.session = undefined
        }
      })

      this.signClient.on("session_update", async(session)=> {
        if(session?.topic === this.session?.topic) {
          this.session = this.signClient.session.get(session.topic)
          await this.setSessionBlockchains()
        }
      })

      this.signClient.on("session_event", (event)=> {
        if(event?.topic === this.session?.topic) {}
      })

      const connectWallet = async()=>{
        const { uri, approval } = await this.signClient.connect(getWalletConnectV2Config(this.walletName))
        await connect({ uri })
        this.session = await approval()
        localStorage[KEY+":lastSessionWalletName"] = this.walletName
        await new Promise(resolve=>setTimeout(resolve, 500)) // to prevent race condition within WalletConnect
      }

      const lastSession = this?.walletName?.length ? await getLastSession(this.walletName) : undefined
      if(lastSession) {
        this.session = lastSession
      } else {
        await connectWallet()
      }

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

      await this.setSessionBlockchains()

      return await this.account()

    } catch (error) {
      console.log('WALLETCONNECT ERROR', error)
    }
  }

  async connectedTo(input) {
    if(input) {
      return this.blockchains.indexOf(input) > -1
    } else {
      return this.blockchains
    }
  }

  getValidChainId() {
    return `eip155:${Blockchains[this.blockchains[0]].networkId}`
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

  async transactionCount({ blockchain, address }) {
    const smartContractWallet = await getSmartContractWallet(blockchain, address)
    if(smartContractWallet) {
      return await smartContractWallet.transactionCount()
    } else {
      return await request({ blockchain, method: 'transactionCount', address })
    }
  }

  async sign(message) {
    if(typeof message === 'object') {
      let account = await this.account()
      let signature = await this.signClient.request({
        topic: this.session.topic,
        chainId: `eip155:${message.domain.chainId}`,
        request:{
          method: 'eth_signTypedData_v4',
          params: [account, JSON.stringify(message)],
        }
      })
      return signature
    } else if (typeof message === 'string') {
      const address = await this.account()
      const params = [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), address]
      let signature = await this.signClient.request({
        topic: this.session.topic,
        chainId: this.getValidChainId(),
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

export default WalletConnectV2
