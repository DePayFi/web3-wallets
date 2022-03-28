import Coinbase from './wallets/Coinbase'
import MetaMask from './wallets/MetaMask'
import Web3Wallet from './wallets/Web3Wallet'
import { WalletConnect, getConnectedInstance as getConnectedWalletConnectInstance } from './wallets/WalletConnect'
import { WalletLink, getConnectedInstance as getConnectedWalletLinkInstance } from './wallets/WalletLink'

const wallets = {
  MetaMask,
  Coinbase,
  Web3Wallet,
  WalletConnect,
  WalletLink
}

const instances = {}

const getWalletClass = function(){
  if(getConnectedWalletConnectInstance()) {
    return wallets.WalletConnect
  } else if(getConnectedWalletLinkInstance()) {
    return wallets.WalletLink
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

  if(getConnectedWalletConnectInstance()) {
    return getConnectedWalletConnectInstance()
  } else if(getConnectedWalletLinkInstance()) {
    return getConnectedWalletLinkInstance()
  } else if(existingInstance) {
    return existingInstance
  } else if(walletClass) {
    instances[walletClass] = new walletClass()
    return instances[walletClass]
  }
}

const supported = [
  wallets.MetaMask,
  wallets.Coinbase,
  wallets.WalletConnect,
  wallets.WalletLink
]

export { 
  getWallet,
  supported,
  wallets
}
