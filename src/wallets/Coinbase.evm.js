import logos from '../logos'
import { supported } from '../blockchains'
import WindowEthereum from './WindowEthereum'

export default class CoinbaseEVM extends WindowEthereum {

  static info = {
    name: 'Coinbase',
    logo: logos.coinbase,
    blockchains: supported.evm,
    platform: 'evm',
  }

  getProvider() { 
    if(window?.ethereum?.providerMap?.has('CoinbaseWallet')) {
      return window?.ethereum?.providerMap?.get('CoinbaseWallet')
    } else {
      return window.ethereum
    }
  }

  static isAvailable = async()=>{ 
    return(
      (
        window?.ethereum?.isCoinbaseWallet || window?.ethereum?.isWalletLink
      ) || (
        window?.ethereum?.providerMap?.has('CoinbaseWallet')
      )
    )
  }
}
