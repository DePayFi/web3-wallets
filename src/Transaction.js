import { ethers } from 'ethers'
import { CONSTANTS } from '@depay/web3-constants'

class Transaction {

  constructor({ blockchain, from, to, value, api, method, params, instructions, sent, succeeded, failed }) {

    // required
    this.blockchain = blockchain
    this.from = (from && from.match('0x')) ? ethers.utils.getAddress(from) : from
    this.to = (to && to.match('0x')) ? ethers.utils.getAddress(to) : to

    // optional
    this.value = Transaction.bigNumberify(value, blockchain)?.toString()
    this.api = api
    this.method = method
    this.params = params
    this.sent = sent
    this.succeeded = succeeded
    this.failed = failed
    this.instructions = instructions

    // internal
    this._succeeded = false
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

  getContractArguments() {
    let fragment = this.getContract().interface.fragments.find((fragment) => {
      return fragment.name == this.method
    })

    if(this.params instanceof Array) {
      return this.params
    } else if (this.params instanceof Object) {
      return fragment.inputs.map((input) => {
        return this.params[input.name]
      })
    }
  }

  getContract() {
    return new ethers.Contract(this.to, this.api)
  }

  async getData() {
    let contractArguments = this.getContractArguments()
    let populatedTransaction
    if(contractArguments) {
      populatedTransaction = await this.getContract().populateTransaction[this.method].apply(
        null, contractArguments
      )
    } else {
      populatedTransaction = await this.getContract().populateTransaction[this.method].apply(null)
    }
     
    return populatedTransaction.data
  }

  success() {
    if (this._succeeded) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalSucceeded = this.succeeded
      this.succeeded = (transaction) => {
        if (originalSucceeded) originalSucceeded(transaction)
        resolve(transaction)
      }
    })
  }

  failure() {
    if (this._failed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalFailed = this.failed
      this.failed = (transaction, reason) => {
        if (originalFailed) originalFailed(transaction, reason)
        resolve(transaction, reason)
      }
    })
  }
}

export {
  Transaction
}
