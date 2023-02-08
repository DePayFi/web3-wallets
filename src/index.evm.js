import getConnectedWallets from './getConnectedWallets.evm'
import getWallets from './getWallets.evm'
import wallets from './wallets.evm'

const supported = [
  wallets.MetaMask,
  wallets.Coinbase,
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.WalletLink
]

export {
  getWallets,
  getConnectedWallets,
  supported,
  wallets
}
