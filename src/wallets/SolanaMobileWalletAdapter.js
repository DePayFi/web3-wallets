/*#if _EVM
/*#elif _SOLANA

import { transact } from '@depay/solana-web3.js'

//#else */

import { transact } from '@depay/solana-web3.js'

//#endif

const KEY = '_DePayWeb3WalletsConnectedSolanaMobileWalletInstance'

const decodeWithKey = (encodedString, key)=> {
  // Convert the encoded string to a Uint8Array
  const encodedBytes = Uint8Array.from(atob(encodedString), c => c.charCodeAt(0));

  // Convert the key to a Uint8Array
  const keyBytes = new TextEncoder().encode(key);

  // Perform XOR operation between the encoded bytes and key bytes
  const decodedBytes = encodedBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);

  // Convert the decoded bytes to a string
  const decodedString = new TextDecoder().decode(decodedBytes);

  return decodedString;
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
    this.authToken = result.auth_token
    this.account = decodeWithKey(result.accounts[0].address.toString(), this.authToken)
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
    const encodedMessage = btoa(message)
    const signedMessage = await transact(async (wallet) => {
      console.log('sign with this.account', this.account)
      console.log('encodedMessage', encodedMessage)
      const signedMessage = await wallet.signMessages({
        addresses: [btoa(this.account)],
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
