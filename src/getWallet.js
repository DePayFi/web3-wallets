import wallets from './wallets'

const instances = {}

const getWalletClass = function(){
  if(wallets.WalletConnect.getConnectedInstance()) {
    return wallets.WalletConnect
  } else if(wallets.WalletLink.getConnectedInstance()) {
    return wallets.WalletLink
  } else if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
    return wallets.MetaMask
  } else if (typeof window.ethereum === 'object' && (window.ethereum.isCoinbaseWallet || window.ethereum.isWalletLink)) {
    return wallets.Coinbase
  } else if (typeof window.ethereum !== 'undefined') {
    return wallets.WindowEthereum
  }
}

const getWallet = function () {
  const walletClass = getWalletClass()
  const existingInstance = instances[walletClass]

  if(wallets.WalletConnect.getConnectedInstance()) {
    return wallets.WalletConnect.getConnectedInstance()
  } else if(wallets.WalletLink.getConnectedInstance()) {
    return wallets.WalletLink.getConnectedInstance()
  } else if(existingInstance) {
    return existingInstance
  } else if(walletClass) {
    instances[walletClass] = new walletClass()
    return instances[walletClass]
  }
}

export default getWallet
