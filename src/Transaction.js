import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'

class Transaction {

  constructor({
    blockchain,
    from,
    to,
    value,
    api,
    method,
    params,
    instructions,
    signers,
    alts,
    sent,
    succeeded,
    failed,
    accepted,
  }) {

    // required
    this.blockchain = blockchain
    this.from = (from && from.match('0x')) ? ethers.utils.getAddress(from) : from
    this.to = (to && to.match('0x')) ? ethers.utils.getAddress(to) : to

    // optional
    this.value = Transaction.bigNumberify(value, blockchain)?.toString()
    this.api = api
    this.method = method
    this.params = params
    this.accepted = accepted
    this.sent = sent
    this.succeeded = succeeded
    this.failed = failed
    this.instructions = instructions
    this.signers = signers
    this.alts = alts

    // internal
    this._succeeded = false
    this._failed = false
  }

  async prepare({ wallet }) {
    this.from = await wallet.account(this.blockchain)
  }

  static bigNumberify(value, blockchain) {
    if (typeof value === 'number') {
      return ethers.utils.parseUnits(value.toString(), Blockchains[blockchain].currency.decimals)
    } else if (value && value.toString) {
      return ethers.BigNumber.from(value.toString())
    } else {
      return value
    }
  }

  findFragment() {
    return this.getContract().interface.fragments.find((fragment) => {
      return(
        fragment.name == this.method &&
        (fragment.inputs && this.params && typeof(this.params) === 'object' ? fragment.inputs.length == Object.keys(this.params).length : true)
      )
    })
  }

  getParamType(param) {
    if(param?.components?.length) {
      return `(${param.components.map((param)=>this.getParamType(param)).join(',')})`
    } else {
      return param.type
    }
  }

  getMethodNameWithSignature() {
    let fragment = this.findFragment()
    if(fragment.inputs) {
      return `${this.method}(${fragment.inputs.map((param)=>this.getParamType(param)).join(',')})`
    } else {
      return this.method
    }
  }

  getContractArguments() {
    if(this.params instanceof Array) {
      return this.params
    } else if (this.params instanceof Object) {
      let fragment = this.findFragment()

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
      populatedTransaction = await this.getContract().populateTransaction[this.getMethodNameWithSignature()].apply(
        null, contractArguments
      )
    } else {
      populatedTransaction = await this.getContract().populateTransaction[this.getMethodNameWithSignature()].apply(null)
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
