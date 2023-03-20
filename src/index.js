import getWallets from './getWallets'
import wallets from './wallets'

/*#if _EVM

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
  wallets.WalletLink,
  wallets.WindowEthereum,
]

/*#elif _SOLANA

const supported = [
  wallets.Phantom,
  wallets.WalletConnectV1,
  wallets.WalletLink,
]

//#else */

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
  wallets.WalletLink,
  wallets.WindowEthereum,
]

//#endif

export { 
  getWallets,
  supported,
  wallets,
}
