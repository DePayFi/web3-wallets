import getConnectedWallets from './getConnectedWallets'
import getWallets from './getWallets'
import wallets from './wallets'

const supported = [
  wallets.MetaMask,
  wallets.Phantom,
  wallets.Coinbase,
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.WalletLink
]

export { 
  getWallets,
  getConnectedWallets,
  supported,
  wallets,
}
