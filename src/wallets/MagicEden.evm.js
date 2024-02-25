import logos from '../logos'
import WindowEthereum from './WindowEthereum'
import { supported } from '../blockchains'

export default class MagicEdenEVM extends WindowEthereum {

  static info = {
    name: 'Magic Eden',
    logo: logos.magicEden,
    blockchains: ['ethereum', 'polygon'],
    platform: 'evm',
  }

  static isAvailable = async()=>{
    return (
      window?.ethereum?.isMagicEden
    )
  }
}
