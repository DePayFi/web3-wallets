import WalletLink from 'src/wallets/WalletLink'
import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'ethers'
import { getWallets, wallets, supported } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('Coinbase WalletLink', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)
        beforeEach(async()=>{
          WalletLink.setConnectedInstance(undefined)
          mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink })
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.WalletLink().account()).toStrictEqual(undefined)
        })
      })

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(async()=>{
          mock({ blockchain, wallet: 'walletlink', connector: wallets.WalletLink, accounts: { return: accounts } })
          await new wallets.WalletLink().connect()
          wallet = (await getWallets())[0]
          expect(wallet.name).toEqual('Coinbase')
        })

        it('requires to be connected first', async()=> {
          let account = await wallet.connect()
          expect(account).toEqual(ethers.utils.getAddress(accounts[0]))
        });

        it('provides a wallet name', async()=> {
          expect(wallet.name).toEqual('Coinbase')
        })

        it('provides currently connected main account', async()=> {
          expect(await wallet.account()).toEqual(ethers.utils.getAddress(accounts[0]))
        })

        it('provides the walletLink wallet uppon requesting getWallet if there is a connected instance', async()=> {
          expect(wallet.name).toEqual('Coinbase')
        })

        it('receives supported blockchains', async()=> {
          expect(wallet.blockchains).toEqual(supportedBlockchains.evm)
        })

        it('receives connected blockchain', async()=> {
          expect(await wallet.connectedTo(blockchain)).toEqual(true)
          expect(await wallet.connectedTo()).toEqual(blockchain)
        })

        it('allows to switch network', async ()=>{
          let switchMock = mock({
            blockchain: 'ethereum',
            network: { switchTo: 'bsc' }
          })
          await wallet.switchTo('bsc')
          expect(switchMock).toHaveBeenCalled()
        })

        it('adds the network if the network you request to switch to does not exist and switches to it afterwards', async ()=>{
          let switchMock
          let blockchain = Blockchains.findByName('bsc')

          mock({
            blockchain: 'ethereum',
            network: { 
              switchTo: 'bsc',
              error: ()=>{
                switchMock = mock({
                  blockchain: 'ethereum',
                  network: { switchTo: 'bsc' }
                })
                return { code: 4902 }
              }
            }
          })

          let addMock = mock({
            blockchain: 'ethereum',
            network: {
              add: {
                chainId: blockchain.id,
                chainName: blockchain.fullName,
                nativeCurrency: {
                  name: blockchain.currency.name,
                  symbol: blockchain.currency.symbol,
                  decimals: blockchain.currency.decimals
                },
                rpcUrls: [blockchain.rpc],
                blockExplorerUrls: [blockchain.explorer],
                iconUrls: [blockchain.logo]
              }
            }
          })
          
          await wallet.switchTo('bsc')

          expect(switchMock).toHaveBeenCalled()
          expect(addMock).toHaveBeenCalled()
          expect(await wallet.connectedTo('bsc')).toEqual(true)
        })
      })
    })
  })
});
