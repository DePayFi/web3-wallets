import getWallets from './getWallets'
import wallets from './wallets'

const supported = [
  wallets.MetaMask,
  wallets.Phantom,
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
