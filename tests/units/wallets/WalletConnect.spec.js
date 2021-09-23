import { getWallet, supported } from 'src'
import { mock, resetMocks, trigger } from 'depay-web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
      const wallet = supported[0]
      beforeEach(()=>{
        resetMocks()
      })
      beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
      beforeEach(()=>mock({ blockchain, wallet: 'walletconnect', connector: wallet.connector }))

      it('requires to be connected first', async()=> {
        let accounts = await wallet.connect()
        expect(accounts).toEqual(accounts)
      });

      it('provides a wallet name', async()=> {
        expect(wallet.name).toEqual('WalletConnect')
      })

      it('provides a wallet logo', async()=> {
        expect(wallet.logo).toEqual('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAIVBMVEVHcEzA3v+32f6n0f6Rxv5/vP5ss/1bqv1Kof0zlfw7mfxjyhOQAAAACXRSTlMAGTlZfaC81e2kc52PAAAFE0lEQVR42u3azXMTNxgGcMeJh6s7BLg6eBhyNKSUDKdlMG3JCUILNbekB8iR8NGEU4G21LnixV5dY0q0f2VTZ3dfvK+0zyvZmQ6DnhOzrEf67YderZRaSEhISEhISEhISEhIyP+Zb9pr3dsPfu7eWltp1k4lC+3be2meoxe3VmpzT/3ab/1EpUUS9e7F1dpcU7/2Kk3S6WiVzrWZS3tZC+V2Rs9btfmk/gMpmObTzdo8svgka8KC2azNnuVXWRtWzPOZH+dzfZWCJLO2cum/NmArf8zUynI/lUTPYlncP3FgyzP/Z3cnawNHbfsOVo+KNnBGnu/LdYc2Uv2h5fXw6tQleuxzQ/ZTt2iP2/JjdrEcbkvnlC/WhPLxtC/W5G3ZcmtkXaUeGbacXvV+6hP9xqWRjQxymvd+qequV/7foQPEemuPC9jfB6lObFIViSGJuQV99PKn7trF9rfdB3uJuR09kDZyx1xm391fadJc8uGBWRMJIaZfq9H90vPZ/kWZThz4Q9RfV3gp+M5Ymzuil910qX5tmmcymp/7WtJIg3dvZBtgzz7hJ7+XNHKGX6tNO5tXz/deErVdPQ/wuVx1XfrVMzCjKZ0ue4ZvqKkfoZnb8nSnYuEQrN2G73VVDcG/Su4JpmefNTL2qCZ67DZoq8ijLo46buePPQqj3pXNCPruEOraB+Fs/bKavrguXdNb0mnzTg5xyaqiZ142TGQQZ4q+e/wvB4o6fkocKROIC0Ufus+3JxA5pecCoQcmdjq/kRx6fDo8jtx+0O3UvposfC/9FK8/3JQuAry8Wb7Nya50Lq4i4fOZDFvlb55RS/o+xNI3Te9OQ6QfFz3pSFDvF2WVDsgoDRrT8ECedZxk+REMySi4JFHHCUJlEM/JYgkk6zhBTo68FUAKCoYQhSCYcq6o5bEAklEIklMgpKBgCFHoAKacV3CiSJNQ6nguoyOo+hEFQajj5Ump6mBIPpGBEOr4qip9iGNINpOBM0q6Kzv4Q5wgiELrGdNX9gAuwBGkRJGuZ/xeNEIUBCEKgFAjvfJvx5UQTFk6/q/y5bqgMIUgnIIhw+akXmHKQnYWp2DI7qRg4eWR3Mv7yCF8Oc/YyQGAUCefgoUZOucCOx7ZIJjSs5yCKfy+2b7EGiaIhXK3PGGSrp/2+BNofQdiBCEKgGzRS2CjUFWzUyAEUKg8V1EwBFM4pDSQA0gVBUKKmQKCYApBMKXHeppB7CeUIJjSsHfUesY9giBK9SXHFL7/8A+noCuO7tq6YhsL/FCrEoJeJA7Rb03HqiCYcoNDjDo7BFMWNe+0iXeYQXi9wPVmm0NaxidudJVBBtKdgJHlQaozypEVgim2t3sVnjlAmxp4yMXDQAS2Z0Dx4LXScatmA0DEO6pR5U4TgjCKx/bZBoDIKCry3sYcNqenYv5bmvT68ekinlTSNyHe18AQomAIpvB6TRRfCFFMA3+Z4gUhCoZQmTIUAy8Kh1DBZcXAZV+DQzjFF0I1iUM4xRNCFA7hFA9IMZBXQMDE843bFo1oSahnqGqelBiu5blttNFAziGYMmx5/5VPjNdXCeJBweuNvRLEkxLjpWIqBr4UsAb86PNi4JaFfel2bsMbQgM53i3ZcIcQRbqduwSWC6uXmnMI3hwqDz0OO63yTf8M4kXJIZhyAvGiqLxeY0qy5f0HyZ+E1eG6/tP7j3nbV6TotXn9VXpISEhISEhISEhISEhISEjIl5R/AceNSyX32CxyAAAAAElFTkSuQmCC')
      })

      it('provides currently connected main account', async()=> {
        expect(await wallet.account()).toEqual(accounts[0])
      })

      it('provides currently connected accounts', async()=> {
        expect(await wallet.accounts()).toEqual(accounts)
      })

      it('provides the walletConnect wallet uppon requesting getWallet if there is a connected instance', async()=> {
        expect(getWallet().name).toEqual('WalletConnect')
      })

      it('receives supported blockchains', async()=> {
        expect(wallet.blockchains).toEqual(['ethereum', 'bsc'])
      })

      it('receives connected blockchain', async()=> {
        expect(await wallet.connectedTo(blockchain)).toEqual(true)
        expect(await wallet.connectedTo()).toEqual(blockchain)
      })

      it('register an event to be called back if walletConnect disconnects', async()=> {
        let disconnectCalled
        wallet.on('disconnect', ()=>{
          disconnectCalled = true
        })
        trigger('disconnect')
        expect(disconnectCalled).toEqual(true)
      })

      it('register an event to be called back if network changes', async()=> {
        let newNetworkName
        wallet.on('network', (networkName)=>{
          newNetworkName = networkName
        })
        trigger('session_update', [null, { params: [{ chainId: 1 }] }])
        expect(newNetworkName).toEqual('ethereum')
        trigger('session_update', [null, { params: [{ chainId: 56 }] }])
        expect(newNetworkName).toEqual('bsc')
      })

      it('register an event to be called back if accounts change', async()=> {
        let newAccounts
        wallet.on('accounts', (accounts)=>{
          newAccounts = accounts
        })
        trigger('session_update', [null, { params: [{ accounts }] }])
        expect(newAccounts).toEqual(accounts)
      })

      it('register an event to be called back if account change', async()=> {
        let newAccount
        wallet.on('account', (account)=>{
          newAccount = account
        })
        trigger('session_update', [null, { params: [{ accounts }] }])
        expect(newAccount).toEqual(accounts[0])
      })

      it('rejects switchTo with NOT_SUPPORTED', async()=> {
        await expect(
          wallet.switchTo('bsc')
        ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
      })

      it('rejects addNetwork with NOT_SUPPORTED', async()=> {
        await expect(
          wallet.addNetwork('bsc')
        ).rejects.toEqual({ code: 'NOT_SUPPORTED' })
      })
    })
  })
});
