import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class TrustSVM extends WindowSolana {

  static info = {
    name: 'Trust Wallet',
    logo: logos.trust,
    blockchains: supported.solana,
    platform: 'svm',
  }

  static isAvailable = async()=>{
    return window.solana?.isTrustWallet
  }
}
