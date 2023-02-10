import getConnectedWallets from './getConnectedWallets.evm'
import getWallets from './getWallets.evm'
import wallets from './wallets.evm'

const supported = [
  wallets.MetaMask,
  wallets.Coinbase,
  wallets.Binance,
  wallets.Trust,
  wallets.Brave,
  wallets.Opera,
  wallets.Coin98,
  wallets.CryptoCom,
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
