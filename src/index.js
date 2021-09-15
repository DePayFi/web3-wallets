import EVMWallet from './wallets/EVMWallet'
import MetaMask from './wallets/MetaMask'
import Wallet from './wallets/Wallet'

let getWallet = function () {
  if (typeof window.ethereum !== 'undefined') {
    if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
      return new MetaMask()
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
