/*#if _EVM
/*#elif _SVM

import { sendTransaction } from './WindowSolana/transaction'
import { transact, PublicKey } from '@depay/solana-web3.js'

//#else */

import { sendTransaction } from './WindowSolana/transaction'
import { transact, PublicKey } from '@depay/solana-web3.js'

//#endif

const KEY = '_DePayWeb3WalletsConnectedSolanaMobileWalletInstance'

const base64StringToPublicKey = (base64String)=> {
  const binaryString = window.atob(base64String)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new PublicKey(bytes)
}

const getIdentity = ()=>{
  return({
    name: document.title,
    uri:  window.location.origin.toString(),
    icon: getFavicon()
  })
}

var getFavicon = function(){
  var favicon = 'favicon.ico'
  var nodeList = document.getElementsByTagName("link")
  for (var i = 0; i < nodeList.length; i++)
  {
    if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
    {
      favicon = nodeList[i].getAttribute("href");
    }
  }
  const explodedPath = favicon.split('/')
  return explodedPath[explodedPath.length-1]
}

let authToken

class SolanaMobileWalletAdapter {

  static info = {
    name: 'Solana Mobile Wallet',
    logo: "",
    blockchains: ['solana']
  }

  constructor() {
    this.name = (localStorage[KEY+'_name'] && localStorage[KEY+'_name'] != undefined) ? localStorage[KEY+'_name'] : this.constructor.info.name
    this.logo = (localStorage[KEY+'_logo'] && localStorage[KEY+'_logo'] != undefined) ? localStorage[KEY+'_logo'] : this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.sendTransaction = (transaction)=>{ 
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  async authorize(wallet) {
    let authorization = await wallet.authorize({
      cluster: 'mainnet-beta',
      identity: getIdentity(),
    })
    if(!authorization || !authorization.auth_token || !authorization.accounts || authorization.accounts.length === 0) { return }
    authToken = authorization.auth_token
    this._account = base64StringToPublicKey(authorization.accounts[0].address).toString()
    return authorization
  }

  async reauthorize(wallet, authToken) {
    let authorization = await wallet.reauthorize({
      auth_token: authToken,
      identity: getIdentity()
    })
    if(!authorization || !authorization.auth_token || !authorization.accounts || authorization.accounts.length === 0) { return }
    authToken = authorization.auth_token
    this._account = base64StringToPublicKey(authorization.accounts[0].address).toString()
    return authorization
  }

  disconnect() {}

  async account() {
    return this._account
  }

  async connect(options) {
    const result = await transact(
      async (wallet) => {
        await this.authorize(wallet)
        if(options?.name) { localStorage[KEY+'_name'] = this.name = options.name }
        if(options?.logo) { localStorage[KEY+'_logo'] = this.logo = options.logo }
      }
    )
    return this._account
  }

  static isAvailable = async()=>{
    return authToken
  }

  async connectedTo(input) {
    if(input) {
      return input == 'solana'
    } else {
      return 'solana'
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

  on(event, callback) {}

  off(event, callback) {}

  async sign(message) {
    const encodedMessage = new TextEncoder().encode(message)
    const signedMessage = await transact(async (wallet) => {
      const authorization = await this.reauthorize(wallet, authToken)
      const signedMessages = await wallet.signMessages({
        addresses: [authorization.accounts[0].address],
        payloads: [encodedMessage],
      })
      return signedMessages[0]
    })
    return signedMessage
  }

  async _sendTransaction(transaction) {
    const signature = await transact(async (wallet) => {
      const authorization = await this.reauthorize(wallet, authToken)
      const transactionSignatures = await wallet.signAndSendTransactions({
        transactions: [transaction]
      })
      return transactionSignatures[0]
    })
    return signature
  }
}

export default SolanaMobileWalletAdapter
