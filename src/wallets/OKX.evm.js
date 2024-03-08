import logos from '../logos'
import WindowEthereum from './WindowEthereum'
import { supported } from '../blockchains'

export default class OKXEVM extends WindowEthereum {

  static info = {
    name: 'OKX',
    logo: logos.okx,
    blockchains: supported.evm,
    platform: 'evm',
  }

  static isAvailable = async()=>{
    return (
      window?.okxwallet
    )
  }
}
