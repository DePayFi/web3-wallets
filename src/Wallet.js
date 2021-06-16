import MetaMask from './wallets/ethereum/MetaMask'
import Unknown from './wallets/ethereum/Unknown'

export default class Wallet {
  instance() {
    if (typeof window.ethereum !== 'undefined') {
      if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
        return new MetaMask()
      } else {
        return new Unknown()
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
    if (this.instance() === undefined) {
      return
    }
    return await this.instance().connect()
  }

  on(event, callback) {
    if (this.instance() === undefined) {
      return
    }
    this.instance().on(event, callback)
  }
}
