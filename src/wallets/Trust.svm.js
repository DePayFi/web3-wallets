import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class TrustSVM extends WindowSolana {

  static info = {
    name: 'Trust',
    logo: logos.trust,
    blockchains: supported.svm,
    platform: 'svm',
  }

  static isAvailable = async()=>{
    return window.solana?.isTrustWallet
  }
}
