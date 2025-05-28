/*#if _EVM

import { request, rpcRequest, getProvider } from '@depay/web3-client-evm'

/*#elif _SVM

import { request, rpcRequest, getProvider } from '@depay/web3-client-svm'

//#else */

import { request, rpcRequest, getProvider } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { MiniKit, ResponseEvent } from './WorldApp/index'
import { Transaction } from '../Transaction'

const STORAGE_KEY = '_DePayWorldAppAddressV1'

export default class WorldApp {

  static MiniKit = MiniKit

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
    transaction = new Transaction(transaction)

    return new Promise(async(resolve, reject)=>{
      await transaction.prepare({ wallet: this })
      transaction.fromBlock = await request('worldchain://latestBlockNumber')

      MiniKit.subscribe(ResponseEvent.MiniAppSendTransaction, (payload)=> {
        MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction)
        if (payload.status == "success") {
          if (transaction.accepted) { transaction.accepted() }
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
      MiniKit.commands.sendTransaction({
        transaction: [
          {
            address: transaction.to,
            abi: transaction.api?.filter((fragment)=>fragment.name === transaction.method && fragment?.inputs?.length ===  transaction.params?.args?.length),
            functionName: transaction.method,
            args: transaction.params?.args
          },
        ],
        permit2: [transaction.params?.permit2]
      })
    })
  }

  retryFetchTransaction(transaction, payload, attempt) {
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        this.fetchTransaction(transaction, payload, attempt+1).then(resolve).catch(reject)
      }, (attempt < 30 ? 500 : 2000))
    })
  }

  pollTransactionIdFromWorldchain(payload) {

    return new Promise((resolve)=>{

      fetch(`https://public.depay.com/transactions/worldchain/${payload.transaction_id}?app_id=${payload.mini_app_id}`, {
        headers: { "Content-Type": "application/json" },
      }).then((response)=>{
        if(response.ok) {
          response.json().then((transactionJSON)=>{
            if(transactionJSON?.external_id) {
              resolve(transactionJSON?.external_id)
            } else {
              resolve()
            }
          }).catch(()=>resolve())
        } else {
          resolve()
        }
      }).catch((error)=>{
        console.log('CATCH ERROR', error)
        resolve()
      })
    })
  }

  pollEventForUserOp(transaction, payload) {

    return new Promise((resolve)=>{

      rpcRequest({
        blockchain: 'worldchain',
        method: "eth_getLogs",
        params: [
          {
            "fromBlock":  ethers.utils.hexValue(transaction.fromBlock),
            "toBlock": "latest",
            "address": "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // entry point
            "topics": [
              "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f",
              payload.userOpHash
            ]
          }
        ]
      }).then((responseData)=>{
        if(responseData && responseData instanceof Array) {
          let event = responseData.find((event)=>{
            return(!event.removed)
          })
          if(event && event.transactionHash) {
            return resolve(event.transactionHash)
          }
        }
        resolve()
      }).catch(()=>resolve())
    })
  }



  fetchTransaction(transaction, payload, attempt = 1) {
    return new Promise((resolve, reject)=>{

      Promise.all([
        this.pollTransactionIdFromWorldchain(payload),
        this.pollEventForUserOp(transaction, payload),
      ]).then((results)=>{
        let transactionHash = results ? results.filter(Boolean)[0] : undefined
        if(transactionHash) {
          transaction.id = transactionHash
          transaction.url = Blockchains['worldchain'].explorerUrlFor({ transaction })
          if (transaction.sent) { transaction.sent(transaction) }
          getProvider('worldchain').then((provider)=>{
            provider.waitForTransaction(transactionHash).then((receipt)=>{
              if(receipt && receipt.status == 1) {
                transaction._succeeded = true
                if (transaction.succeeded) { transaction.succeeded(transaction) }
                resolve(transaction)
              } else {
                if (transaction.failed) { transaction.failed(transaction, 'Transaction failed') }
                reject(transaction)
              }
            }).catch(reject)
          }).catch(reject)
        } else {
          this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject)
        }
      }).catch((error)=>{
        console.log('CATCH ERROR!', error)
        this.retryFetchTransaction(transaction, payload, attempt).then(resolve).catch(reject)
      })
    })
  }

  getProvider() {
    return this
  }

  async account() {
    if(!this.getProvider()) { return undefined }
    return this.walletAddress()
  }

  walletAddress() {
    if(localStorage.getItem(STORAGE_KEY)) {
      return localStorage.getItem(STORAGE_KEY)
    }
    return (window.MiniKit.user?.walletAddress || MiniKit.user?.walletAddress)
  }

  connect() {

    return new Promise( async(resolve, reject)=>{

      if(this.walletAddress()) {
        return resolve(this.walletAddress())
      }

      MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
        MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth)
        if (payload.status === "error") {
          return reject(payload.message)
        } else {
          let walletAddress = this.walletAddress()
          if(walletAddress && walletAddress.length) {
            localStorage.setItem(STORAGE_KEY, walletAddress)
          }
          return resolve(walletAddress)
        }
      })

      MiniKit.commands.walletAuth({
        nonce: crypto.randomUUID().replace(/-/g, "")
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
    if(!this.walletAddress()) {
      return 0
    } else {
      return request({
        blockchain: 'worldchain',
        address: this.walletAddress(),
        api: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"AddedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"approvedHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"owner","type":"address"}],"name":"ApproveHash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"handler","type":"address"}],"name":"ChangedFallbackHandler","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"guard","type":"address"}],"name":"ChangedGuard","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"ChangedThreshold","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"module","type":"address"}],"name":"DisabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"module","type":"address"}],"name":"EnabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"RemovedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"SafeReceived","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"initiator","type":"address"},{"indexed":false,"internalType":"address[]","name":"owners","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"},{"indexed":false,"internalType":"address","name":"initializer","type":"address"},{"indexed":false,"internalType":"address","name":"fallbackHandler","type":"address"}],"name":"SafeSetup","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"msgHash","type":"bytes32"}],"name":"SignMsg","type":"event"},{"stateMutability":"nonpayable","type":"fallback"},{"inputs":[],"name":"VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"addOwnerWithThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"hashToApprove","type":"bytes32"}],"name":"approveHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"approvedHashes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"changeThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"dataHash","type":"bytes32"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signatures","type":"bytes"},{"internalType":"uint256","name":"requiredSignatures","type":"uint256"}],"name":"checkNSignatures","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"dataHash","type":"bytes32"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"checkSignatures","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"prevModule","type":"address"},{"internalType":"address","name":"module","type":"address"}],"name":"disableModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"domainSeparator","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"module","type":"address"}],"name":"enableModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"encodeTransactionData","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"addresspayable","name":"refundReceiver","type":"address"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"execTransaction","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModule","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModuleReturnData","outputs":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getChainId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"start","type":"address"},{"internalType":"uint256","name":"pageSize","type":"uint256"}],"name":"getModulesPaginated","outputs":[{"internalType":"address[]","name":"array","type":"address[]"},{"internalType":"address","name":"next","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwners","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"offset","type":"uint256"},{"internalType":"uint256","name":"length","type":"uint256"}],"name":"getStorageAt","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"getTransactionHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"module","type":"address"}],"name":"isModuleEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"removeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enumEnum.Operation","name":"operation","type":"uint8"}],"name":"requiredTxGas","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"handler","type":"address"}],"name":"setFallbackHandler","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"guard","type":"address"}],"name":"setGuard","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_owners","type":"address[]"},{"internalType":"uint256","name":"_threshold","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"address","name":"fallbackHandler","type":"address"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"addresspayable","name":"paymentReceiver","type":"address"}],"name":"setup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"signedMessages","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"targetContract","type":"address"},{"internalType":"bytes","name":"calldataPayload","type":"bytes"}],"name":"simulateAndRevert","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"oldOwner","type":"address"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"swapOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
        method: 'nonce'
      })
    }
  }

  async sign(message) {
    
    return new Promise((resolve, reject)=>{

      MiniKit.subscribe(ResponseEvent.MiniAppSignMessage, async (payload) => {
        MiniKit.unsubscribe(ResponseEvent.MiniAppSignMessage)
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
