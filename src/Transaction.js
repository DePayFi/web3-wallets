import { ethers } from 'ethers'
import { CONSTANTS } from '@depay/web3-constants'

class Transaction {

  constructor({ blockchain, from, nonce, to, api, method, params, value, sent, confirmed, failed }) {

    this.blockchain = blockchain
    this.from = from
    this.nonce = nonce
    this.to = to
    this.api = api
    this.method = method
    this.params = params
    this.value = Transaction.bigNumberify(value, blockchain)?.toString()
    this.sent = sent
    this.confirmed = confirmed
    this.failed = failed
    this._confirmed = false
    this._failed = false
  }

  async prepare({ wallet }) {
    this.from = await wallet.account()
  }

  static bigNumberify(value, blockchain) {
    if (typeof value === 'number') {
      return ethers.utils.parseUnits(value.toString(), CONSTANTS[blockchain].DECIMALS)
    } else if (value && value.toString) {
      return ethers.BigNumber.from(value.toString())
    } else {
      return value
    }
  }

  getContractArguments ({ contract }) {
    let fragment = contract.interface.fragments.find((fragment) => {
      return fragment.name == this.method
    })

    if(this.params instanceof Array) {
      return this.params
    } else if (this.params instanceof Object) {
      return fragment.inputs.map((input) => {
        return this.params[input.name]
      })
    } else {
      throw 'Contract params have wrong type!'
    }
  }

  confirmation() {
    if (this._confirmed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalConfirmed = this.confirmed
      this.confirmed = () => {
        if (originalConfirmed) originalConfirmed(this)
        resolve(this)
      }
    })
  }

  failure() {
    if (this._failed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalFailed = this.failed
      this.failed = () => {
        if (originalFailed) originalFailed(this)
        resolve(this)
      }
    })
  }
}

export {
  Transaction
}
