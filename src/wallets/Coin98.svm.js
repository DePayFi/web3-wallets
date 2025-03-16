import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class Coin98SVM extends WindowSolana {

  static info = {
    name: 'Coin98',
    logo: logos.coin98,
    blockchains: supported.svm,
    platform: 'svm',
  }

  static isAvailable = async()=>{ return window?.coin98?.sol }

  getProvider() { return window.coin98.sol }

}
