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
  wallets.HyperPay,
  wallets.WalletConnectV1,
  wallets.WalletLink
]

export {
  getWallets,
  supported,
  wallets,
}
