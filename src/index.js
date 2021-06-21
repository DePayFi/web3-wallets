import EthereumWallet from './wallets/ethereum/wallet'
import MetaMask from './wallets/MetaMask'
import Wallet from './wallets/Wallet'

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

export { getWallet }
