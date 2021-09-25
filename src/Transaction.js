import { ethers } from 'ethers'
import { CONSTANTS } from 'depay-web3-constants'

class Transaction {

  constructor({ blockchain, from, to, api, method, params, value, sent, confirmed, ensured, failed }) {

    this.blockchain = blockchain
    this.from = from
    this.to = to
    this.api = api
    this.method = method
    this.params = params
    this.value = this.bigNumberify(value)
    this.sent = sent
    this.confirmed = confirmed
    this.ensured = ensured
    this.failed = ensured
    this._confirmed = false
    this._ensured = false
    this._failed = false
  }

  async prepare({ wallet }) {
    this.from = await wallet.account()
  }

  bigNumberify(value) {
    if (typeof value === 'number') {
      return ethers.utils.parseUnits(value.toString(), CONSTANTS[this.blockchain].DECIMALS)
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

  ensurance() {
    if (this._ensured) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalEnsured = this.ensured
      this.ensured = () => {
        if (originalEnsured) originalEnsured(this)
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
