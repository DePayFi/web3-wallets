/*#if _EVM

import Binance from './wallets/Binance'
import Brave from './wallets/Brave'
import Coin98 from './wallets/Coin98'
import Coinbase from './wallets/Coinbase'
import CryptoCom from './wallets/CryptoCom'
import HyperPay from './wallets/HyperPay'
import MetaMask from './wallets/MetaMask'
import Opera from './wallets/Opera'
import Rabby from './wallets/Rabby'
import TokenPocket from './wallets/TokenPocket'
import Trust from './wallets/Trust'
import WalletConnectV1 from './wallets/WalletConnectV1'
import WalletConnectV2 from './wallets/WalletConnectV2'
import WalletLink from './wallets/WalletLink'
import WindowEthereum from './wallets/WindowEthereum'

export default {
  MetaMask,
  Coinbase,
  Binance,
  Trust,
  Rabby,
  Brave,
  Opera,
  Coin98,
  CryptoCom,
  HyperPay,
  TokenPocket,
  WindowEthereum,
  WalletConnectV1,
  WalletConnectV2,
  WalletLink
}

/*#elif _SOLANA

import Backpack from './wallets/Backpack'
import Glow from './wallets/Glow'
import Phantom from './wallets/Phantom'
import SolanaMobileWalletAdapter from './wallets/SolanaMobileWalletAdapter'
import Solflare from './wallets/Solflare'
import WindowSolana from './wallets/WindowSolana'

export default {
  Phantom,
  Backpack,
  Glow,
  Solflare,
  WindowSolana,
  SolanaMobileWalletAdapter,
}

//#else */

import Backpack from './wallets/Backpack'
import Binance from './wallets/Binance'
import Brave from './wallets/Brave'
import Coin98 from './wallets/Coin98'
import Coinbase from './wallets/Coinbase'
import CryptoCom from './wallets/CryptoCom'
import Glow from './wallets/Glow'
import HyperPay from './wallets/HyperPay'
import MetaMask from './wallets/MetaMask'
import Opera from './wallets/Opera'
import Phantom from './wallets/Phantom'
import Rabby from './wallets/Rabby'
import SolanaMobileWalletAdapter from './wallets/SolanaMobileWalletAdapter'
import Solflare from './wallets/Solflare'
import TokenPocket from './wallets/TokenPocket'
import Trust from './wallets/Trust'
import WalletConnectV1 from './wallets/WalletConnectV1'
import WalletConnectV2 from './wallets/WalletConnectV2'
import WalletLink from './wallets/WalletLink'
import WindowEthereum from './wallets/WindowEthereum'
import WindowSolana from './wallets/WindowSolana'

export default {
  MetaMask,
  Phantom,
  Coinbase,
  Binance,
  Trust,
  Backpack,
  Glow,
  Solflare,
  Rabby,
  Brave,
  Opera,
  Coin98,
  CryptoCom,
  HyperPay,
  TokenPocket,
  WindowEthereum,
  WindowSolana,
  SolanaMobileWalletAdapter,
  WalletConnectV1,
  WalletConnectV2,
  WalletLink
}

//#endif

