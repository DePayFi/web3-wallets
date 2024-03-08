import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class OKXSVM extends WindowSolana {

  static info = {
    name: 'OKX',
    logo: logos.okx,
    blockchains: ['solana'],
    platform: 'svm',
  }

  static isAvailable = async()=>{
    return (
      window?.solana?.isOkxWallet
    )
  }
}
