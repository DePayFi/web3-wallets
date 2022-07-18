import getWallet from './getWallet'
import wallets from './wallets'

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
