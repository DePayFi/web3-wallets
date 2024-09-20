export default class Worldapp {

  static info = {
    name: 'Worldapp',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMzIDMyIj4KICA8Zz4KICAgIDxnPgogICAgICA8cmVjdCBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iMzMiIGhlaWdodD0iMzIiLz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMjQuNywxMi41Yy0uNS0xLjEtMS4xLTItMS45LTIuOHMtMS44LTEuNS0yLjgtMS45Yy0xLjEtLjUtMi4zLS43LTMuNS0uN3MtMi40LjItMy41LjdjLTEuMS41LTIsMS4xLTIuOCwxLjlzLTEuNSwxLjgtMS45LDIuOGMtLjUsMS4xLS43LDIuMy0uNywzLjVzLjIsMi40LjcsMy41LDEuMSwyLDEuOSwyLjhjLjguOCwxLjgsMS41LDIuOCwxLjksMS4xLjUsMi4zLjcsMy41LjdzMi40LS4yLDMuNS0uNywyLTEuMSwyLjgtMS45LDEuNS0xLjgsMS45LTIuOGMuNS0xLjEuNy0yLjMuNy0zLjVzLS4yLTIuNC0uNy0zLjVaTTEzLjUsMTUuMmMuNC0xLjQsMS43LTIuNSwzLjItMi41aDYuMmMuNC44LjcsMS42LjcsMi41aC0xMC4xWk0yMy43LDE2LjhjMCwuOS0uNCwxLjctLjcsMi41aC02LjJjLTEuNSwwLTIuOC0xLjEtMy4yLTIuNWgxMC4xWk0xMS40LDEwLjljMS40LTEuNCwzLjItMi4xLDUuMS0yLjFzMy44LjcsNS4xLDIuMWguMWMwLC4xLTUsLjEtNSwuMS0xLjMsMC0yLjYuNS0zLjUsMS41LS43LjctMS4yLDEuNy0xLjQsMi43aC0yLjVjLjItMS42LjktMy4xLDIuMS00LjNaTTE2LjUsMjMuMmMtMS45LDAtMy44LS43LTUuMS0yLjEtMS4yLTEuMi0xLjktMi43LTIuMS00LjNoMi41Yy4yLDEsLjcsMS45LDEuNCwyLjcuOS45LDIuMiwxLjUsMy41LDEuNWg1LS4xYy0xLjQsMS41LTMuMiwyLjItNS4xLDIuMloiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
    blockchains: ["optimism", "worldchain"]
  }

  static isAvailable = async()=>{ 
    return Boolean(
      window?.WorldApp
    )
  }
  
  constructor () {
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.sendTransaction = (transaction)=>{
      console.log('sendTransaction')
    }
  }

  getProvider() {
    return this
  }

  async account() {
    if(!this.getProvider()) { return undefined }
    const accounts = (await this.getProvider().request({ method: 'eth_accounts' })).map((address)=>ethers.utils.getAddress(address))
    return accounts[0]
  }

  async connect() {
    if(!this.getProvider()) { return undefined }
    const accounts = (await this.getProvider().request({ method: 'eth_requestAccounts' })).map((address)=>ethers.utils.getAddress(address))
    return accounts[0]
  }

  on(event, callback) {
    
  }

  off(event, internalCallback) {
    
  }

  async connectedTo(input) {
    const blockchain = Blockchains.findById(await this.getProvider().request({ method: 'eth_chainId' }))
    if(!blockchain) { return false }
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
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

  transactionCount({ blockchain, address }) {
    return request({ blockchain, method: 'transactionCount', address })
  }

  async sign(message) {
    
  }
}
