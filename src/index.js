import Coinbase from './wallets/Coinbase'
import MetaMask from './wallets/MetaMask'
import { WalletConnectWallet, connectedInstance as connectedWalletConnectInstance } from './wallets/WalletConnect'
import Web3Wallet from './wallets/Web3Wallet'

let getWallet = function () {
  if(connectedWalletConnectInstance) {
    return connectedWalletConnectInstance
  } else if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
    return new MetaMask()
  } else if (typeof window.ethereum === 'object' && window.ethereum.isCoinbaseWallet) {
    return new Coinbase()
  } else if (typeof window.ethereum !== 'undefined') {
    return new Web3Wallet()
  }
}

const supported = [
  new WalletConnectWallet(),
  new MetaMask(),
  new Coinbase()
]

export { 
  getWallet,
  supported
}
