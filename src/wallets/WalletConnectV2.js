import { Blockchain } from '@depay/web3-blockchains'
import { Core, SignClient } from "@depay/walletconnect-v2"
import { ethers } from 'ethers'
import { sendTransaction } from './WalletConnectV2/transaction'

const KEY = '_DePayWeb3WalletsConnectedWalletConnectV2Instance'

const getConnectedInstance = ()=>{
  return window[KEY]
}

const setConnectedInstance = (value)=>{
  window[KEY] = value
}

class WalletConnectV2 {

  static info = {
    name: 'WalletConnect',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
    blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
  }

  static isAvailable = ()=>{ 
    return getConnectedInstance() != undefined 
  }

  constructor() {
    this.name = this.constructor.info.name
    this.logo = this.constructor.info.logo
    this.blockchains = this.constructor.info.blockchains
    this.connector = WalletConnect.instance || this.newWalletConnectInstance()
    WalletConnect.instance = this.connector
    this.sendTransaction = (transaction)=>{ 
      return sendTransaction({
        wallet: this,
        transaction
      })
    }
  }

  newWalletConnectInstance() { 
    return new Core({ projectId: window._walletConnectProjectId })
  }

  async account() {
    if(this.connectedAccount == undefined) { return }
    return this.connectedAccount
  }

  async connect({ connect, blockchain }) {
    
    if(!connect || typeof connect != 'function') { throw('Provided connect paremeters is not present or not a function!') }
    
    try {

      delete localStorage[`wc@2:core:${this.connector.pairing.version}//subscription`] // DO NOT RECOVER AN OTHER SUBSCRIPTION!!!
      this.signClient = await SignClient.init({ core: this.connector })

      this.signClient.on("session_delete", () => {
        console.log('WALLETCONNECT DISCONNECT')
        this.connector = undefined
        WalletConnect.instance = undefined
        this.connectedAccount = undefined
        this.signClient = undefined
        this.session = undefined
      })

      blockchain = Blockchain.findByName(blockchain)

      let namespaces = {}

      namespaces[blockchain.namespace] = {
        methods: [
          "eth_sendTransaction",
          "personal_sign",
        ],
        chains: [`${blockchain.namespace}:${blockchain.networkId}`],
        events: [],
      }

      const { uri, approval } = await this.signClient.connect({ requiredNamespaces: namespaces })

      await connect({ uri })
      this.session = await approval()
      this.session.chainId = `${blockchain.namespace}:${blockchain.networkId}`
      
      let meta = this.session?.peer?.metadata
      if(meta && meta.name) {
        this.name = meta.name
        if(meta?.icons && meta.icons.length) { this.logo = meta.icons[0] }
      }

      const account = Object.values(this.session.namespaces)[0].accounts[0].split(":")[2]
      this.connectedAccount = account
      this.connectedBlockchain = blockchain.name
      
      return account

    } catch (error) {
      console.log('WALLETCONNECT ERROR', error)
    }
  }

  async connectedTo(input) {
    if(input) {
      return input === this.connectedBlockchain
    } else {
      const blockchain = Blockchain.findByName(this.connectedBlockchain)
      return blockchain.name
    }
  }

  switchTo(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      reject({ code: 'NOT_SUPPORTED' })
    })
  }

  on(event, callback) {
    // currently not supported
  }

  off(event, callback) {
    // currently not supported
  }

  async sign(message) {
    let address = await this.account()
    var params = [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), address]
    let signature = await this.signClient.request({
      topic: this.session.topic,
      chainId: this.session.chainId,
      request:{
        id: 1,
        jsonrpc: '2.0',
        method: 'personal_sign',
        params
      }
    })
    if(typeof signature == 'object') {
      signature = ethers.utils.hexlify(signature)
    }
    return signature
  }
}

WalletConnectV2.getConnectedInstance = getConnectedInstance
WalletConnectV2.setConnectedInstance = setConnectedInstance

export default WalletConnectV2
