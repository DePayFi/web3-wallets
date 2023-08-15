import getWallets from './getWallets'
import wallets from './wallets'

/*#if _EVM

const supported = [
  wallets.MetaMask,
  wallets.Coinbase,
  wallets.Binance,
  wallets.Trust,
  wallets.Rabby,
  wallets.Brave,
  wallets.Opera,
  wallets.Coin98,
  wallets.CryptoCom,
  wallets.HyperPay,
  wallets.TokenPocket,
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.WalletLink,
  wallets.WindowEthereum,
]

/*#elif _SOLANA

const supported = [
  wallets.Phantom,
  wallets.Backpack,
  wallets.Glow,
  wallets.Solflare,
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.SolanaMobileWalletAdapter,
  wallets.WalletLink,
]

//#else */

const supported = [
  wallets.MetaMask,
  wallets.Phantom,
  wallets.Coinbase,
  wallets.Binance,
  wallets.Trust,
  wallets.Backpack,
  wallets.Glow,
  wallets.Solflare,
  wallets.Rabby,
  wallets.Brave,
  wallets.Opera,
  wallets.Coin98,
  wallets.CryptoCom,
  wallets.HyperPay,
  wallets.TokenPocket,
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.SolanaMobileWalletAdapter,
  wallets.WalletLink,
  wallets.WindowEthereum,
]

//#endif

export { 
  getWallets,
  supported,
  wallets,
}
