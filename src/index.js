import EthereumWallet from './wallets/ethereum/Wallet'
import MetaMask from './wallets/MetaMask'
import Wallet from './wallets/Wallet'
import { setApiKey } from './apiKey'

let getWallet = function () {
  if (typeof window.ethereum !== 'undefined') {
    if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
      return new MetaMask()
    } else {
      return new EthereumWallet()
    }
  }

  return new Wallet()
}

export { getWallet, setApiKey }
