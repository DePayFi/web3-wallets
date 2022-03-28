import 'regenerator-runtime/runtime'

// CoinbaseWalletSdk
import { Crypto } from "@peculiar/webcrypto"
global.crypto = new Crypto()
import fetch from 'cross-fetch'
global.fetch = fetch
