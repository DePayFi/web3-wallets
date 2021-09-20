import EVMWallet from './wallets/EVMWallet'
import MetaMask from './wallets/MetaMask'
import Coinbase from './wallets/Coinbase'
import Wallet from './wallets/Wallet'

let getWallet = function () {
  if (typeof window.ethereum !== 'undefined') {
    if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
      return new MetaMask()
    } else if (typeof window.ethereum === 'object' && window.ethereum.isCoinbaseWallet) {
      return new Coinbase()
    } else {
      return new EVMWallet()
    }
  }
}

const supported = [
  new MetaMask()
]

export { 
  getWallet,
  supported
}
