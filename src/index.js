import Coinbase from './wallets/Coinbase'
import MetaMask from './wallets/MetaMask'
import { WalletConnectWallet as WalletConnect, connectedInstance as connectedWalletConnectInstance } from './wallets/WalletConnect'
import Web3Wallet from './wallets/Web3Wallet'

const wallets = {
  MetaMask: new MetaMask(),
  Coinbase: new Coinbase(),
  Web3Wallet: new Web3Wallet(),
  WalletConnect: new WalletConnect()
}

let getWallet = function () {
  if(connectedWalletConnectInstance) {
    return connectedWalletConnectInstance
  } else if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
    return wallets.MetaMask
  } else if (typeof window.ethereum === 'object' && (window.ethereum.isCoinbaseWallet || window.ethereum.isWalletLink)) {
    return wallets.Coinbase
  } else if (typeof window.ethereum !== 'undefined') {
    return wallets.Web3Wallet
  }
}

const supported = [
  wallets.WalletConnect,
  wallets.MetaMask,
  wallets.Coinbase
]

export { 
  getWallet,
  supported,
  wallets
}
