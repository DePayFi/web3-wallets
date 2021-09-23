import QRCodeModal from '@walletconnect/qrcode-modal'
import WalletConnect from '@walletconnect/client'
import { Blockchain } from 'depay-web3-blockchains'

let connectedInstance

class WalletConnectWallet {
  name = 'WalletConnect'
  logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAIVBMVEVHcEzA3v+32f6n0f6Rxv5/vP5ss/1bqv1Kof0zlfw7mfxjyhOQAAAACXRSTlMAGTlZfaC81e2kc52PAAAFE0lEQVR42u3azXMTNxgGcMeJh6s7BLg6eBhyNKSUDKdlMG3JCUILNbekB8iR8NGEU4G21LnixV5dY0q0f2VTZ3dfvK+0zyvZmQ6DnhOzrEf67YderZRaSEhISEhISEhISEhIyP+Zb9pr3dsPfu7eWltp1k4lC+3be2meoxe3VmpzT/3ab/1EpUUS9e7F1dpcU7/2Kk3S6WiVzrWZS3tZC+V2Rs9btfmk/gMpmObTzdo8svgka8KC2azNnuVXWRtWzPOZH+dzfZWCJLO2cum/NmArf8zUynI/lUTPYlncP3FgyzP/Z3cnawNHbfsOVo+KNnBGnu/LdYc2Uv2h5fXw6tQleuxzQ/ZTt2iP2/JjdrEcbkvnlC/WhPLxtC/W5G3ZcmtkXaUeGbacXvV+6hP9xqWRjQxymvd+qequV/7foQPEemuPC9jfB6lObFIViSGJuQV99PKn7trF9rfdB3uJuR09kDZyx1xm391fadJc8uGBWRMJIaZfq9H90vPZ/kWZThz4Q9RfV3gp+M5Ymzuil910qX5tmmcymp/7WtJIg3dvZBtgzz7hJ7+XNHKGX6tNO5tXz/deErVdPQ/wuVx1XfrVMzCjKZ0ue4ZvqKkfoZnb8nSnYuEQrN2G73VVDcG/Su4JpmefNTL2qCZ67DZoq8ijLo46buePPQqj3pXNCPruEOraB+Fs/bKavrguXdNb0mnzTg5xyaqiZ142TGQQZ4q+e/wvB4o6fkocKROIC0Ufus+3JxA5pecCoQcmdjq/kRx6fDo8jtx+0O3UvposfC/9FK8/3JQuAry8Wb7Nya50Lq4i4fOZDFvlb55RS/o+xNI3Te9OQ6QfFz3pSFDvF2WVDsgoDRrT8ECedZxk+REMySi4JFHHCUJlEM/JYgkk6zhBTo68FUAKCoYQhSCYcq6o5bEAklEIklMgpKBgCFHoAKacV3CiSJNQ6nguoyOo+hEFQajj5Ump6mBIPpGBEOr4qip9iGNINpOBM0q6Kzv4Q5wgiELrGdNX9gAuwBGkRJGuZ/xeNEIUBCEKgFAjvfJvx5UQTFk6/q/y5bqgMIUgnIIhw+akXmHKQnYWp2DI7qRg4eWR3Mv7yCF8Oc/YyQGAUCefgoUZOucCOx7ZIJjSs5yCKfy+2b7EGiaIhXK3PGGSrp/2+BNofQdiBCEKgGzRS2CjUFWzUyAEUKg8V1EwBFM4pDSQA0gVBUKKmQKCYApBMKXHeppB7CeUIJjSsHfUesY9giBK9SXHFL7/8A+noCuO7tq6YhsL/FCrEoJeJA7Rb03HqiCYcoNDjDo7BFMWNe+0iXeYQXi9wPVmm0NaxidudJVBBtKdgJHlQaozypEVgim2t3sVnjlAmxp4yMXDQAS2Z0Dx4LXScatmA0DEO6pR5U4TgjCKx/bZBoDIKCry3sYcNqenYv5bmvT68ekinlTSNyHe18AQomAIpvB6TRRfCFFMA3+Z4gUhCoZQmTIUAy8Kh1DBZcXAZV+DQzjFF0I1iUM4xRNCFA7hFA9IMZBXQMDE843bFo1oSahnqGqelBiu5blttNFAziGYMmx5/5VPjNdXCeJBweuNvRLEkxLjpWIqBr4UsAb86PNi4JaFfel2bsMbQgM53i3ZcIcQRbqduwSWC6uXmnMI3hwqDz0OO63yTf8M4kXJIZhyAvGiqLxeY0qy5f0HyZ+E1eG6/tP7j3nbV6TotXn9VXpISEhISEhISEhISEhISEjIl5R/AceNSyX32CxyAAAAAElFTkSuQmCC'
  blockchains = ['ethereum', 'bsc']

  constructor() {
    this.connector = this.newWalletConnectInstance()
  }

  newWalletConnectInstance() {
    let instance = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal
    })

    instance.on("connect", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0]
      this.connectedAccounts = accounts
      this.connectedChainId = chainId
    })

    instance.on("session_update", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0]
      this.connectedAccounts = accounts
      this.connectedChainId = chainId
    })

    instance.on("disconnect", (error, payload) => {
      connectedInstance = undefined
      if (error) { throw error }
    })

    instance.on("modal_closed", ()=>{
      connectedInstance = undefined
      this.connector = this.newWalletConnectInstance()
    })

    return instance
  }

  async account() {
    if(this.connectedAccounts == undefined) { return }
    return this.connectedAccounts[0]
  }

  async accounts() {
    if(this.connectedAccounts == undefined) { return }
    return this.connectedAccounts
  }

  async connect(options) {

    if(this.connector.connected) {
      await this.connector.killSession()
      connectedInstance = undefined
      this.connector = this.newWalletConnectInstance()
    }

    const { accounts, chainId } = await this.connector.connect({ chainId: options?.chainId })

    if(accounts instanceof Array && accounts.length) {
      connectedInstance = this
    }

    this.connectedAccounts = accounts
    this.connectedChainId = chainId
      
    return accounts
  }

  async connectedTo(input) {
    let chainId = await this.connector.sendCustomRequest({ method: 'eth_chainId' })
    const blockchain = Blockchain.findById(chainId)
    if(input) {
      return input === blockchain.name
    } else {
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
    switch (event) {
      case 'account':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0]
          if(accounts instanceof Array) { callback(accounts[0]) }
        })
        break
      case 'accounts':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0]
          callback(accounts)
        })
        break
      case 'network':
        this.connector.on("session_update", (error, payload) => {
          const { chainId } = payload.params[0]
          if(chainId) { callback(Blockchain.findByNetworkId(chainId).name) }
        })
        break
      case 'disconnect':
        this.connector.on('disconnect', callback)
        break
    }
  }
}

export {
  WalletConnectWallet,
  connectedInstance
}
