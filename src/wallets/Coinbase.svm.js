import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class CoinbaseSVM extends WindowSolana {

  static info = {
    name: 'Coinbase',
    logo: logos.coinbase,
    blockchains: supported.svm,
    platform: 'svm',
  }

  getProvider() { 
    return window.coinbaseSolana
  }

  static isAvailable = async()=>{ 
    return !!window.coinbaseSolana
  }
}
