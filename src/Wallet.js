import MetaMask from './wallets/ethereum/MetaMask'
import Ethereum from './wallets/ethereum/Ethereum'

export default class Wallet {
  instance() {
    if (typeof window.ethereum !== 'undefined') {
      if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
        return new MetaMask()
      } else {
        return new Ethereum()
      }
    }
  }

  type() {
    if (this.instance() === undefined) {
      return
    }
    return this.instance().type()
  }

  image() {
    if (this.instance() === undefined) {
      return
    }
    return this.instance().image()
  }

  async connect() {
    return await this.instance().connect()
  }
}
