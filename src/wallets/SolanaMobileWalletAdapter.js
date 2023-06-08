/*#if _EVM
/*#elif _SOLANA

import { transact, PublicKey } from '@depay/solana-web3.js'

//#else */

import { transact, PublicKey } from '@depay/solana-web3.js'

//#endif

const KEY = '_DePayWeb3WalletsConnectedSolanaMobileWalletInstance'

const base64StringToPublicKey = (base64String)=> {
  const binaryString = window.atob(base64String)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  return new PublicKey(bytes)
}

const authorize = (wallet)=>{
  return wallet.authorize({
    cluster: 'mainnet-beta',
    identity: {
      name: document.title,
      uri:  window.location.origin.toString(),
      icon: getFavicon()
    },
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

class SolanaMobileWalletAdapter {

  static info = {
    name: 'Solana Mobile Wallet',
    logo: "",
    blockchains: ['solana']
  }

  static isAvailable = async()=>{
  }

  constructor() {
    this.name = (localStorage[KEY+'_name'] && localStorage[KEY+'_name'] != 'undefined') ? localStorage[KEY+'_name'] : this.constructor.info.name
    this.logo = (localStorage[KEY+'_logo'] && localStorage[KEY+'_logo'] != 'undefined') ? localStorage[KEY+'_logo'] : this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.sendTransaction = (transaction)=>{ 
    }
  }

  disconnect() {
  }

  async account() {
  }

  async connect(options) {
    const result = await transact(
      async (wallet) => authorize(wallet)
    )
    if(!result || !result.auth_token || !result.accounts || result.accounts.length === 0) { return }
    console.log('result', result)
    this.authToken = result.auth_token
    this.account = base64StringToPublicKey(result.accounts[0].address).toString()
    return this.account
  }

  static isAvailable = async()=>{
  }

  async connectedTo(input) {
  }

  switchTo(blockchainName) {
  }

  addNetwork(blockchainName) {
  }

  on(event, callback) {
  }

  off(event, callback) {
  }

  async sign(message) {
    const encodedMessage = new TextEncoder().encode(message)
    const signedMessage = await transact(async (wallet) => {
      const authResult = authorize(wallet)
      console.log('authResult', authResult)
      const signedMessage = await wallet.signMessages({
        addresses: [authResult.accounts[0].address],
        payloads: [encodedMessage],
      })
      console.log('signedMessage', signedMessage)
      return signedMessage
    })
    console.log('signedMessage', signedMessage)
    // if(signedMessage && signedMessage.signature) {
    //   return Array.from(signedMessage.signature)
    // }
  }
}

export default SolanaMobileWalletAdapter
