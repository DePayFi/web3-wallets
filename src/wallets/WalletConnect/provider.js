import { ethers } from 'ethers'

class WalletConnectProvider extends ethers.providers.JsonRpcProvider {

  constructor({ connector, chainId }) {
    super()
    this.chainId = chainId
    this.connector = connector
  }

  send(method, params) {
    switch(method) {
      case 'eth_chainId':
        return this.chainId
        break
      default:
        return this.connector.sendCustomRequest({ method, params })
    }
  }

}

export {
  WalletConnectProvider
}
