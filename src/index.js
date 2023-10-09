import getWallets from './getWallets'
import wallets from './wallets'

/*#if _EVM

const supported = [
  wallets.MetaMask,
  wallets.CoinbaseEVM,
  wallets.Binance,
  wallets.TrustEVM,
  wallets.Rabby,
  wallets.PhantomEVM,
  wallets.Brave,
  wallets.Opera,
  wallets.Coin98,
  wallets.CryptoCom,
  wallets.HyperPay,
  wallets.TokenPocket,
  wallets.ExodusEVM,

  // standards (not concrete wallets)
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.WalletLink,
  wallets.WindowEthereum,
]

/*#elif _SOLANA

const supported = [
  wallets.PhantomSVM,
  wallets.Backpack,
  wallets.Glow,
  wallets.Solflare,
  wallets.CoinbaseSVM,
  wallets.TrustSVM,
  wallets.ExodusSVM,

  // standards (not concrete wallets)
  wallets.WalletConnectV1,
  wallets.WalletConnectV2,
  wallets.SolanaMobileWalletAdapter,
  wallets.WalletLink,
]

//#else */

const supported = [
  wallets.MetaMask,
  wallets.PhantomEVM,
  wallets.PhantomSVM,
  wallets.CoinbaseEVM,
  wallets.CoinbaseSVM,
  wallets.Binance,
  wallets.TrustEVM,
  wallets.TrustSVM,
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
  wallets.ExodusEVM,
  wallets.ExodusSVM,

  // standards (not concrete wallets)
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
