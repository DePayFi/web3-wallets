import logos from '../logos'
import { supported } from '../blockchains'
import WindowSolana from './WindowSolana'

export default class BraveSVM extends WindowSolana {

  static info = {
    name: 'Brave',
    logo: logos.brave,
    blockchains: supported.svm,
    platform: 'svm',
  }

  static isAvailable = async()=>{ return window?.solana?.isBraveWallet }

  getProvider() { 
    return window.braveSolana
  }
}
