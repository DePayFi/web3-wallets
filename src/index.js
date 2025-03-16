import getWallets from './getWallets'
import wallets from './wallets'

/*#if _EVM

const supported = [
  wallets.MetaMask,
  wallets.CoinbaseEVM,
  wallets.Binance,
  wallets.TrustEVM,
  wallets.Rabby,
  wallets.Uniswap,
  wallets.Rainbow,
  wallets.PhantomEVM,
  wallets.BraveEVM,
  wallets.OKXEvm,
  wallets.MagicEdenEVM,
  wallets.Opera,
  wallets.Coin98EVM,
  wallets.Coin98SVM,
  wallets.CryptoCom,
  wallets.HyperPay,
  wallets.TokenPocket,
  wallets.ExodusEVM,
  wallets.WorldApp,

  // standards
  wallets.WalletConnectV2,
  wallets.WalletLink,
  wallets.WindowEthereum,
]

/*#elif _SVM

const supported = [
  wallets.PhantomSVM,
  wallets.Backpack,
  wallets.MagicEdenSVM,
  wallets.Glow,
  wallets.Solflare,
  wallets.CoinbaseSVM,
  wallets.TrustSVM,
  wallets.BraveSVM,
  wallets.OKXSVM,
  wallets.ExodusSVM,
  wallets.Coin98SVM,

  // standards
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
  wallets.Uniswap,
  wallets.Rainbow,
  wallets.BraveEVM,
  wallets.BraveSVM,
  wallets.Opera,
  wallets.Coin98EVM,
  wallets.Coin98SVM,
  wallets.CryptoCom,
  wallets.HyperPay,
  wallets.TokenPocket,
  wallets.MagicEdenEVM,
  wallets.MagicEdenSVM,
  wallets.OKXEVM,
  wallets.OKXSVM,
  wallets.ExodusEVM,
  wallets.ExodusSVM,
  wallets.WorldApp,

  // standards
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
