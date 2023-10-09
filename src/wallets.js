/*#if _EVM

import Binance from './wallets/Binance'
import Brave from './wallets/Brave'
import Coin98EVM from './wallets/Coin98.evm'
import CoinbaseEVM from './wallets/Coinbase.evm'
import CryptoCom from './wallets/CryptoCom'
import ExodusEVM from './wallets/Exodus.evm'
import HyperPay from './wallets/HyperPay'
import MetaMask from './wallets/MetaMask'
import Opera from './wallets/Opera'
import PhantomEVM from './wallets/Phantom.evm'
import Rabby from './wallets/Rabby'
import TokenPocket from './wallets/TokenPocket'
import TrustEVM from './wallets/Trust.evm'
import WalletConnectV1 from './wallets/WalletConnectV1'
import WalletConnectV2 from './wallets/WalletConnectV2'
import WalletLink from './wallets/WalletLink'
import WindowEthereum from './wallets/WindowEthereum'

export default {
  MetaMask,
  CoinbaseEVM,
  Binance,
  TrustEVM,
  Rabby,
  Brave,
  Opera,
  Coin98EVM,
  CryptoCom,
  HyperPay,
  TokenPocket,
  ExodusEVM,
  PhantomEVM,

  // standards (not concrete wallets)
  WindowEthereum,
  WalletConnectV1,
  WalletConnectV2,
  WalletLink
}

/*#elif _SOLANA

import Backpack from './wallets/Backpack'
import Coin98SVM from './wallets/Coin98.svm'
import CoinbaseSVM from './wallets/Coinbase.svm'
import ExodusSVM from './wallets/Exodus.svm'
import Glow from './wallets/Glow'
import PhantomSVM from './wallets/Phantom.svm'
import SolanaMobileWalletAdapter from './wallets/SolanaMobileWalletAdapter'
import Solflare from './wallets/Solflare'
import TrustSVM from './wallets/Trust.svm'
import WindowSolana from './wallets/WindowSolana'

export default {
  PhantomSVM,
  Backpack,
  Glow,
  Solflare,
  CoinbaseSVM,
  TrustSVM,
  ExodusSVM,
  Coin98SVM,

  // standards (not concrete wallets)
  WindowSolana,
  SolanaMobileWalletAdapter,
}

//#else */

import Backpack from './wallets/Backpack'
import Binance from './wallets/Binance'
import Brave from './wallets/Brave'
import Coin98EVM from './wallets/Coin98.evm'
import Coin98SVM from './wallets/Coin98.svm'
import CoinbaseEVM from './wallets/Coinbase.evm'
import CoinbaseSVM from './wallets/Coinbase.svm'
import CryptoCom from './wallets/CryptoCom'
import ExodusEVM from './wallets/Exodus.evm'
import ExodusSVM from './wallets/Exodus.svm'
import Glow from './wallets/Glow'
import HyperPay from './wallets/HyperPay'
import MetaMask from './wallets/MetaMask'
import Opera from './wallets/Opera'
import PhantomEVM from './wallets/Phantom.evm'
import PhantomSVM from './wallets/Phantom.svm'
import Rabby from './wallets/Rabby'
import SolanaMobileWalletAdapter from './wallets/SolanaMobileWalletAdapter'
import Solflare from './wallets/Solflare'
import TokenPocket from './wallets/TokenPocket'
import TrustEVM from './wallets/Trust.evm'
import TrustSVM from './wallets/Trust.svm'
import WalletConnectV1 from './wallets/WalletConnectV1'
import WalletConnectV2 from './wallets/WalletConnectV2'
import WalletLink from './wallets/WalletLink'
import WindowEthereum from './wallets/WindowEthereum'
import WindowSolana from './wallets/WindowSolana'

export default {
  MetaMask,
  PhantomEVM,
  PhantomSVM,
  CoinbaseEVM,
  CoinbaseSVM,
  Binance,
  TrustEVM,
  TrustSVM,
  Backpack,
  Glow,
  Solflare,
  Rabby,
  Brave,
  Opera,
  Coin98EVM,
  Coin98SVM,
  CryptoCom,
  HyperPay,
  TokenPocket,
  ExodusEVM,
  ExodusSVM,

  // standards (not concrete wallets)
  WindowEthereum,
  WindowSolana,
  SolanaMobileWalletAdapter,
  WalletConnectV1,
  WalletConnectV2,
  WalletLink
}

//#endif

