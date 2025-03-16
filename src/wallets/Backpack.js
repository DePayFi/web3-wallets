/*#if _EVM

import { getProvider as getConnection } from '@depay/web3-client-evm'

/*#elif _SVM

import { getProvider as getConnection } from '@depay/web3-client-svm'

//#else */

import { getProvider as getConnection } from '@depay/web3-client'

//#endif

import WindowSolana from './WindowSolana'

export default class Backpack extends WindowSolana {

  static info = {
    name: 'Backpack',
    logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMDAgMTAwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2NsaXAtcGF0aDp1cmwoI1NWR0lEXzAwMDAwMTA2ODQwODY0OTg0NTM1NTU0MzQwMDAwMDAwNDc2MjMzMDgyNzcwODcyOTcxXyk7fQoJLnN0MXtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOiNFMzNFM0Y7fQo8L3N0eWxlPgo8Zz4KCTxkZWZzPgoJCTxyZWN0IGlkPSJTVkdJRF8xXyIgeD0iMjMuOCIgeT0iMTAuNCIgd2lkdGg9IjUyLjQiIGhlaWdodD0iNzYuMiIvPgoJPC9kZWZzPgoJPGNsaXBQYXRoIGlkPSJTVkdJRF8wMDAwMDE3ODE5NTUzMTM2ODQxNzQ3MDkwMDAwMDAxNDk2Njk4MDAxOTUxNjc4MTk3MF8iPgoJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzFfIiAgc3R5bGU9Im92ZXJmbG93OnZpc2libGU7Ii8+Cgk8L2NsaXBQYXRoPgoJPGcgc3R5bGU9ImNsaXAtcGF0aDp1cmwoI1NWR0lEXzAwMDAwMTc4MTk1NTMxMzY4NDE3NDcwOTAwMDAwMDE0OTY2OTgwMDE5NTE2NzgxOTcwXyk7Ij4KCQk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNTUsMTYuNGMyLjgsMCw1LjQsMC40LDcuOCwxLjFjLTIuNC01LjUtNy4yLTcuMS0xMi43LTcuMWMtNS41LDAtMTAuNCwxLjYtMTIuNyw3LjFjMi40LTAuNyw1LTEuMSw3LjctMS4xCgkJCUg1NXogTTQ0LjQsMjEuOWMtMTMuMiwwLTIwLjcsMTAuNC0yMC43LDIzLjF2MTMuMWMwLDEuMywxLjEsMi4zLDIuNCwyLjNoNDcuNmMxLjMsMCwyLjQtMSwyLjQtMi4zVjQ1YzAtMTIuOC04LjctMjMuMS0yMS45LTIzLjEKCQkJSDQ0LjR6IE01MCw0NS4xYzQuNiwwLDguMy0zLjcsOC4zLTguM3MtMy43LTguMy04LjMtOC4zcy04LjMsMy43LTguMyw4LjNTNDUuNCw0NS4xLDUwLDQ1LjF6IE0yMy44LDY4LjFjMC0xLjMsMS4xLTIuMywyLjQtMi4zCgkJCWg0Ny42YzEuMywwLDIuNCwxLDIuNCwyLjNWODJjMCwyLjYtMi4xLDQuNi00LjgsNC42SDI4LjZjLTIuNiwwLTQuOC0yLjEtNC44LTQuNlY2OC4xeiIvPgoJPC9nPgo8L2c+Cjwvc3ZnPgo=',
    blockchains: ['solana']
  }

  static isAvailable = async()=>{
    return (
      window?.backpack &&
      window.backpack.isBackpack
    )
  }

  getProvider() { return window.backpack }

  async sign(message) {
    const encodedMessage = new TextEncoder().encode(message)
    const signature = await this.getProvider().signMessage(encodedMessage)
    return Object.values(signature)
  }

  _sendTransaction(transaction) {
    return this.getProvider().sendAndConfirm(transaction)
  }
}
