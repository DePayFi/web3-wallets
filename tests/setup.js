import 'regenerator-runtime/runtime'

global.fetch = require('node-fetch')

// WalletconnectV2
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
