import logos from '../logos'
import WindowEthereum from './WindowEthereum'
import { supported } from '../blockchains'

export default class TrustEVM extends WindowEthereum {

  static info = {
    name: 'Trust',
    logo: logos.trust,
    blockchains: supported.evm,
    platform: 'evm',
  }

  static isAvailable = async()=>{
    return (
      (window?.ethereum?.isTrust || window?.ethereum?.isTrustWallet) &&
      Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!Debug)(?!TrustWallet)(?!MetaMask)(?!PocketUniverse)(?!RevokeCash)/)).length == 1
    )
  }
}
