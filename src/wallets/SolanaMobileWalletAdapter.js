/*#if _EVM
/*#elif _SOLANA

import { transact } from '@depay/solana-web3.js'

//#else */

import { transact } from '@depay/solana-web3.js'

//#endif

const KEY = '_DePayWeb3WalletsConnectedSolanaMobileWalletInstance'

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
      async (wallet) => {
        const authResult = wallet.authorize({
          cluster: 'mainnet-beta',
          identity: {
            name: document.title,
            uri:  window.location.origin.toString(),
            icon: getFavicon()
          },
        })
        return authResult
      }
    )
    if(!result || !result.auth_token || !result.accounts || result.accounts.length === 0) { return }
    console.log('result', result)
    this.auth_token = result.auth_token
    this.account = atob(result.accounts[0].address.toString())
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
    const auth_token = this.auth_token
    const signedMessage = await transact(async (wallet) => {
      console.log('auth_token', auth_token)
      const signedMessage = await wallet.signMessages({
          auth_token: auth_token,
          payloads: encodedMessage,
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
