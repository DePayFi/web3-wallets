import { supported } from '../blockchains'
import WindowEthereum from './WindowEthereum'

export default class Binance extends WindowEthereum {

  static info = {
    name: 'Binance',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxOTIgMTkzLjciPgogIDwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyOS40LjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiAyLjEuMCBCdWlsZCAxNTIpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogIzFlMjAyNDsKICAgICAgfQoKICAgICAgLnN0MSB7CiAgICAgICAgZmlsbDogI2YzYmEyZjsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHJlY3QgY2xhc3M9InN0MCIgeT0iMCIgd2lkdGg9IjE5MiIgaGVpZ2h0PSIxOTMuNyIvPgogIDxnPgogICAgPHBhdGggY2xhc3M9InN0MSIgZD0iTTY1LjcsODQuNGwzMC4zLTMwLjMsMzAuMywzMC4zLDE3LjYtMTcuNi00Ny45LTQ3LjktNDcuOSw0Ny45LDE3LjYsMTcuNloiLz4KICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xOCw5Ni44bDE3LjYtMTcuNiwxNy42LDE3LjYtMTcuNiwxNy42LTE3LjYtMTcuNloiLz4KICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik02NS43LDEwOS4zbDMwLjMsMzAuMywzMC4zLTMwLjMsMTcuNiwxNy42aDBzLTQ3LjksNDcuOS00Ny45LDQ3LjlsLTQ3LjktNDcuOWgwczE3LjctMTcuNiwxNy43LTE3LjZaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMTM4LjgsOTYuOGwxNy42LTE3LjYsMTcuNiwxNy42LTE3LjYsMTcuNi0xNy42LTE3LjZaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMTEzLjksOTYuOGwtMTcuOS0xNy45LTEzLjIsMTMuMi0xLjUsMS41LTMuMSwzLjFoMHMwLDAsMCwwbDE3LjksMTcuOSwxNy45LTE3LjloMHMwLDAsMCwwWiIvPgogIDwvZz4KPC9zdmc+",
    blockchains: supported.evm
  }

  static isAvailable = async()=>{
    return window?.BinanceChain &&
      !window.coin98 &&
      !window.trustwallet
  }

  getProvider() { return window.BinanceChain }

}
