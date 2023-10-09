import logos from '../logos'
import WindowEthereum from './WindowEthereum'
import { supported } from '../blockchains'

export default class Coin98EVM extends WindowEthereum {

  static info = {
    name: 'Coin98',
    logo: logos.coin98,
    blockchains: supported.evm,
    platform: 'evm',
  }

  static isAvailable = async()=>{ return window?.coin98 }

  getProvider() { return window.coin98.provider }
  
}
