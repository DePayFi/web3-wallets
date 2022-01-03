import Coinbase from './wallets/Coinbase'
import MetaMask from './wallets/MetaMask'
import { WalletConnectWallet as WalletConnect, connectedInstance as connectedWalletConnectInstance } from './wallets/WalletConnect'
import Web3Wallet from './wallets/Web3Wallet'

const wallets = {
  MetaMask,
  Coinbase,
  Web3Wallet,
  WalletConnect
}

const instances = {}

const getWalletClass = function(){
  if(connectedWalletConnectInstance) {
    return wallets.WalletConnect
  } else if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
    return wallets.MetaMask
  } else if (typeof window.ethereum === 'object' && (window.ethereum.isCoinbaseWallet || window.ethereum.isWalletLink)) {
    return wallets.Coinbase
  } else if (typeof window.ethereum !== 'undefined') {
    return wallets.Web3Wallet
  }
}

const getWallet = function () {
  const walletClass = getWalletClass()
  const existingInstance = instances[walletClass]

  if(connectedWalletConnectInstance) {
    return connectedWalletConnectInstance
  } else if(existingInstance) {
    return existingInstance
  } else if(walletClass) {
    instances[walletClass] = new walletClass()
    return instances[walletClass]
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
