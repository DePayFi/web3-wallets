import logos from '../logos'
import { supported } from '../blockchains'
import WindowEthereum from './WindowEthereum'

export default class BraveEVM extends WindowEthereum {

  static info = {
    name: 'Brave',
    logo: logos.brave,
    blockchains: supported.evm,
    platform: 'evm',
  }

  static isAvailable = async()=>{ return window?.ethereum?.isBraveWallet }

  getProvider() { 
    return window.ethereum
  }
}
