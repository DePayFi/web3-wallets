import { getWallet, wallets, supported } from 'src'
import { connectedInstance, setConnectedInstance } from 'src/wallets/WalletConnect'
import { mock, resetMocks, trigger } from 'depay-web3-mock'

describe('WalletConnect', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(()=>{
          if(connectedInstance) {
            connectedInstance.connectedAccounts = []
          }
          setConnectedInstance(undefined)
        })

        it('provides an accounts function that returns empty list of accounts', async () => {
          expect(await wallets.WalletConnect.accounts()).toStrictEqual([])
        })

        it('provides an account function that returns undefined', async () => {
          expect(await wallets.WalletConnect.account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns empty list of accounts', async () => {
          expect(await wallets.WalletConnect.connect()).toStrictEqual([])
        })
      })

      describe('with supported wallet connected', ()=>{

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
          expect(wallet.logo).toEqual("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='512px' height='512px' viewBox='0 0 512 512' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3C!-- Generator: Sketch 49.3 (51167) - http://www.bohemiancoding.com/sketch --%3E%3Ctitle%3Elogo%3C/title%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cdefs%3E%3C/defs%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='logo'%3E%3Crect id='base' fill='%23FFFFFF' x='0' y='0' width='512' height='512' rx='256'%3E%3C/rect%3E%3Cpath d='M169.209772,184.531136 C217.142772,137.600733 294.857519,137.600733 342.790517,184.531136 L348.559331,190.179285 C350.955981,192.525805 350.955981,196.330266 348.559331,198.676787 L328.82537,217.99798 C327.627045,219.171241 325.684176,219.171241 324.485851,217.99798 L316.547278,210.225455 C283.10802,177.485633 228.89227,177.485633 195.453011,210.225455 L186.951456,218.549188 C185.75313,219.722448 183.810261,219.722448 182.611937,218.549188 L162.877976,199.227995 C160.481326,196.881474 160.481326,193.077013 162.877976,190.730493 L169.209772,184.531136 Z M383.602212,224.489406 L401.165475,241.685365 C403.562113,244.031874 403.562127,247.836312 401.165506,250.182837 L321.971538,327.721548 C319.574905,330.068086 315.689168,330.068112 313.292501,327.721609 C313.292491,327.721599 313.29248,327.721588 313.29247,327.721578 L257.08541,272.690097 C256.486248,272.103467 255.514813,272.103467 254.915651,272.690097 C254.915647,272.690101 254.915644,272.690105 254.91564,272.690108 L198.709777,327.721548 C196.313151,330.068092 192.427413,330.068131 190.030739,327.721634 C190.030725,327.72162 190.03071,327.721606 190.030695,327.721591 L110.834524,250.181849 C108.437875,247.835329 108.437875,244.030868 110.834524,241.684348 L128.397819,224.488418 C130.794468,222.141898 134.680206,222.141898 137.076856,224.488418 L193.284734,279.520668 C193.883897,280.107298 194.85533,280.107298 195.454493,279.520668 C195.454502,279.520659 195.45451,279.520651 195.454519,279.520644 L251.65958,224.488418 C254.056175,222.141844 257.941913,222.141756 260.338618,224.488222 C260.338651,224.488255 260.338684,224.488288 260.338717,224.488321 L316.546521,279.520644 C317.145683,280.107273 318.117118,280.107273 318.71628,279.520644 L374.923175,224.489406 C377.319825,222.142885 381.205562,222.142885 383.602212,224.489406 Z' id='WalletConnect' fill='%233B99FC' fill-rule='nonzero'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
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
  })
});
