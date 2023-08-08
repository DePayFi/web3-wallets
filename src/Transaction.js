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
    failed
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

  getContractArguments() {
    if(this.params instanceof Array) {
      return this.params
    } else if (this.params instanceof Object) {
      let fragment = this.getContract().interface.fragments.find((fragment) => {
        return(
          fragment.name == this.method &&
          fragment.inputs.length == Object.keys(this.params).length
        )
      })

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
    let method = this.method
    if(this.getContract()[method] === undefined){
      let fragment = this.getContract().interface.fragments.find((fragment) => {
        return fragment.name == this.method
      })
      method = `${method}(${fragment.inputs.map((input)=>input.type).join(',')})`;
    }
    if(contractArguments) {
      populatedTransaction = await this.getContract().populateTransaction[method].apply(
        null, contractArguments
      )
    } else {
      populatedTransaction = await this.getContract().populateTransaction[method].apply(null)
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
