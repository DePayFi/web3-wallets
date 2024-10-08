/*#if _EVM

import { request, getProvider } from '@depay/web3-client-evm'

/*#elif _SOLANA

import { request, getProvider } from '@depay/web3-client-solana'

//#else */

import { request, getProvider } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { MiniKit, ResponseEvent } from '@depay/worldcoin-precompiled'
import { Transaction } from '../Transaction'

export default class WorldApp {

  static info = {
    name: 'World App',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMzIDMyIj4KICA8Zz4KICAgIDxnPgogICAgICA8cmVjdCBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iMzMiIGhlaWdodD0iMzIiLz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMjQuNywxMi41Yy0uNS0xLjEtMS4xLTItMS45LTIuOHMtMS44LTEuNS0yLjgtMS45Yy0xLjEtLjUtMi4zLS43LTMuNS0uN3MtMi40LjItMy41LjdjLTEuMS41LTIsMS4xLTIuOCwxLjlzLTEuNSwxLjgtMS45LDIuOGMtLjUsMS4xLS43LDIuMy0uNywzLjVzLjIsMi40LjcsMy41LDEuMSwyLDEuOSwyLjhjLjguOCwxLjgsMS41LDIuOCwxLjksMS4xLjUsMi4zLjcsMy41LjdzMi40LS4yLDMuNS0uNywyLTEuMSwyLjgtMS45LDEuNS0xLjgsMS45LTIuOGMuNS0xLjEuNy0yLjMuNy0zLjVzLS4yLTIuNC0uNy0zLjVaTTEzLjUsMTUuMmMuNC0xLjQsMS43LTIuNSwzLjItMi41aDYuMmMuNC44LjcsMS42LjcsMi41aC0xMC4xWk0yMy43LDE2LjhjMCwuOS0uNCwxLjctLjcsMi41aC02LjJjLTEuNSwwLTIuOC0xLjEtMy4yLTIuNWgxMC4xWk0xMS40LDEwLjljMS40LTEuNCwzLjItMi4xLDUuMS0yLjFzMy44LjcsNS4xLDIuMWguMWMwLC4xLTUsLjEtNSwuMS0xLjMsMC0yLjYuNS0zLjUsMS41LS43LjctMS4yLDEuNy0xLjQsMi43aC0yLjVjLjItMS42LjktMy4xLDIuMS00LjNaTTE2LjUsMjMuMmMtMS45LDAtMy44LS43LTUuMS0yLjEtMS4yLTEuMi0xLjktMi43LTIuMS00LjNoMi41Yy4yLDEsLjcsMS45LDEuNCwyLjcuOS45LDIuMiwxLjUsMy41LDEuNWg1LS4xYy0xLjQsMS41LTMuMiwyLjItNS4xLDIuMloiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
    blockchains: ["worldchain"]
  }

  static isAvailable = async()=>{ 
    return Boolean(
      window?.WorldApp
    )
  }
  
  constructor () {
    MiniKit.install()
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.sendTransaction = this.sendTransaction
  }

  sendTransaction(transaction) {
    console.log('sendTransaction', transaction)
    transaction = new Transaction(transaction)
    console.log('after transaction wrapping transaction.sent', transaction.sent)
    console.log('after transaction wrapping transaction.succeeded', transaction.succeeded)
    console.log('after transaction wrapping transaction.failed', transaction.failed)

    return new Promise(async(resolve, reject)=>{
      await transaction.prepare({ wallet: this })
      console.log('after prepare transaction', transaction)
      transaction.nonce = (await this.transactionCount({ blockchain: 'worldchain', address: transaction.from })).toString()
      console.log('after nonce transaction', transaction)

      console.log('before MiniKit.subscribe')
      MiniKit.subscribe(ResponseEvent.MiniAppSendTransaction, (payload)=> {
        console.log('payload', payload)
        if (payload.status == "success") {
          this.fetchTransaction(transaction, payload).then((transactionHash)=>{
            if(transactionHash) {
              resolve(transaction)
            } else {
              reject('Fetching transaction failed!')
            }
          }).catch(reject)
        } else {
          reject('Submitting transaction failed!')
        }
      })
      console.log('after MiniKit.subscribe')

      console.log('before MiniKit.commands.sendTransaction', {
        transaction: [
          {
            address: transaction.to,
            abi: transaction.api?.filter((fragment)=>fragment?.name === transaction.method),
            functionName: transaction.method,
            args: transaction.params?.args
          },
        ],
        permit2: [transaction.params?.permit2]
      })
      MiniKit.commands.sendTransaction({
        transaction: [
          {
            address: transaction.to,
            abi: transaction.api?.filter((fragment)=>fragment?.name === transaction.method),
            functionName: transaction.method,
            args: transaction.params?.args
          },
        ],
        permit2: [transaction.params?.permit2]
      })
      console.log('after MiniKit.commands.sendTransaction')
    })
  }

  retryFetchTransaction(transaction, payload, attempt) {
    console.log('Retry Fetch transaction', attempt)
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        this.fetchTransaction(transaction, payload, attempt+1).then(resolve).catch(reject)
      }, (attempt < 30 ? 500 : 1000))
    })
  }

  fetchTransaction(transaction, payload, attempt = 1) {
    return new Promise((resolve, reject)=>{
      console.log('Before fetch')
      fetch(`https://public.depay.com/transactions/worldchain/${payload.transaction_id}`, {
        headers: { "Content-Type": "application/json" },
      }).then((response)=>{
        console.log('After fetch', response)
        if(response.ok) {
          console.log('Before json')
          response.json().then((transactionJSON)=>{
            console.log('After json', transactionJSON)
            if(transactionJSON?.external_id) {
              transaction.id = transactionJSON?.external_id
              transaction.url = Blockchains['worldchain'].explorerUrlFor({ transaction })
              console.log('before transaction.sent', transaction.sent)
              if (transaction.sent) { transaction.sent(transaction) }
              console.log('Before provider')
              getProvider('worldchain').then((provider)=>{
                console.log('After provider', provider)
                console.log('Before wait transaction', transactionJSON.external_id)
                provider.waitForTransaction(transactionJSON.external_id).then((receipt)=>{
                  console.log('After receipt', receipt)
                  if(receipt && receipt.status == 1) {
                    transaction._succeeded = true
                    console.log('before transaction.succeeded', transaction.succeeded)
                    if (transaction.succeeded) { transaction.succeeded(transaction) }
                    resolve(transaction)
                  }
                }).catch(reject)
              }).catch(reject)
            } else {
              this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject)
            }
          }).catch(()=>this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject))
        } else {
          this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject)
        }
      }).catch(()=>this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject))
    })
  }

  getProvider() {
    return this
  }

  async account() {
    if(!this.getProvider()) { return undefined }
    return MiniKit.walletAddress
  }

  connect() {

    return new Promise((resolve, reject)=>{

      if(MiniKit.walletAddress) {
        return resolve(MiniKit.walletAddress)
      }

      MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
        if (payload.status === "error") {
          return reject()
        } else {
          return resolve(MiniKit.walletAddress)
        }
      })

      MiniKit.commands.walletAuth({
        nonce: crypto.randomUUID().replace(/-/g, ""),
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "Connect wallet (v17.3.0)"
      })

    })
  }

  on(event, callback) {}

  off(event, internalCallback) {}

  async connectedTo(input) {
    if(input) {
      return input === 'worldchain'
    } else {
      return 'worldchain'
    }
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  async transactionCount({ blockchain, address }) {
    if(!MiniKit?.walletAddress) {
      return 0
    } else {
      return request({
        blockchain: 'worldchain',
        address: MiniKit?.walletAddress,
        api: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"AddedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"approvedHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"owner","type":"address"}],"name":"ApproveHash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"handler","type":"address"}],"name":"ChangedFallbackHandler","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"guard","type":"address"}],"name":"ChangedGuard","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"ChangedThreshold","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"module","type":"address"}],"name":"DisabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"module","type":"address"}],"name":"EnabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"RemovedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"SafeReceived","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"initiator","type":"address"},{"indexed":false,"internalType":"address[]","name":"owners","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"},{"indexed":false,"internalType":"address","name":"initializer","type":"address"},{"indexed":false,"internalType":"address","name":"fallbackHandler","type":"address"}],"name":"SafeSetup","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"msgHash","type":"bytes32"}],"name":"SignMsg","type":"event"},{"stateMutability":"nonpayable","type":"fallback"},{"inputs":[],"name":"VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"addOwnerWithThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"hashToApprove","type":"bytes32"}],"name":"approveHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"approvedHashes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"changeThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"dataHash","type":"bytes32"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signatures","type":"bytes"},{"internalType":"uint256","name":"requiredSignatures","type":"uint256"}],"name":"checkNSignatures","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"dataHash","type":"bytes32"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"checkSignatures","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"prevModule","type":"address"},{"internalType":"address","name":"module","type":"address"}],"name":"disableModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"domainSeparator","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"module","type":"address"}],"name":"enableModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"encodeTransactionData","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"addresspayable","name":"refundReceiver","type":"address"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"execTransaction","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModule","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModuleReturnData","outputs":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getChainId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"start","type":"address"},{"internalType":"uint256","name":"pageSize","type":"uint256"}],"name":"getModulesPaginated","outputs":[{"internalType":"address[]","name":"array","type":"address[]"},{"internalType":"address","name":"next","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwners","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"offset","type":"uint256"},{"internalType":"uint256","name":"length","type":"uint256"}],"name":"getStorageAt","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"getTransactionHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"module","type":"address"}],"name":"isModuleEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"removeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"requiredTxGas","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"handler","type":"address"}],"name":"setFallbackHandler","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"guard","type":"address"}],"name":"setGuard","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_owners","type":"address[]"},{"internalType":"uint256","name":"_threshold","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"address","name":"fallbackHandler","type":"address"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"addresspayable","name":"paymentReceiver","type":"address"}],"name":"setup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"signedMessages","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"targetContract","type":"address"},{"internalType":"bytes","name":"calldataPayload","type":"bytes"}],"name":"simulateAndRevert","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"oldOwner","type":"address"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"swapOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
        method: 'nonce'
      })
    }
  }

  async sign(message) {
    
    return new Promise((resolve, reject)=>{

      MiniKit.subscribe(ResponseEvent.MiniAppSignMessage, async (payload) => {
        if (payload.status === "error") {
          return reject()
        } else {
          return resolve(payload.signature)
        }
      })

      MiniKit.commands.signMessage({ message })

    })
  }
}
