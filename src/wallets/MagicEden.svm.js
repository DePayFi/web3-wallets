import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class MagicEdenSVM extends WindowSolana {

  static info = {
    name: 'Magic Eden',
    logo: logos.magicEden,
    blockchains: ['solana'],
    platform: 'svm',
  }

  static isAvailable = async()=>{
    return (
      window?.solana?.isMagicEden
    )
  }
}
