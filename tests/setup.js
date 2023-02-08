import 'regenerator-runtime/runtime'

// CoinbaseWalletSdk
import { Crypto } from "@peculiar/webcrypto"
global.crypto = new Crypto()
import fetch from 'cross-fetch'
global.fetch = fetch

// WalletconnectV2
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
