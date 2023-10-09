import logos from '../logos'
import WindowEthereum from './WindowEthereum'
import { supported } from '../blockchains'

export default class ExodusEVM extends WindowEthereum {

  static info = {
    name: 'Exodus',
    logo: logos.exodus,
    blockchains: supported.evm,
    platform: 'evm',
  }

  static isAvailable = async()=>{ return window?.ethereum?.isExodus }
}
