/*#if _EVM
/*#elif _SOLANA

import { transact } from '@depay/solana-web3.js'

//#else */

import { transact } from '@depay/solana-web3.js'

//#endif

const KEY = '_DePayWeb3WalletsConnectedSolanaMobileWalletInstance'

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
        console.log("DONE?!", wallet)
      }
    )
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
  }
}

export default SolanaMobileWalletAdapter
