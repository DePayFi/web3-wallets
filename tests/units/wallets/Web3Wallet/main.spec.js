import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { getWallet, wallets } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('Ethereum generic Web3 Wallet', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      describe('with no supported wallet connected', ()=>{
        
        beforeEach(resetMocks)

        it('provides an accounts function that returns empty list of accounts', async () => {
          expect(await new wallets.Web3Wallet().accounts()).toStrictEqual([])
        })

        it('provides an account function that returns undefined', async () => {
          expect(await new wallets.Web3Wallet().account()).toStrictEqual(undefined)
        })

        it('provides an connect function that returns empty list of accounts', async () => {
          expect(await new wallets.Web3Wallet().connect()).toStrictEqual([])
        })
      })

      describe('with supported wallet connected', ()=>{

        const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
        beforeEach(resetMocks)
        beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))

        it('should detect any generic wallet integration that integrates window.ethereum', () => {
          mock(blockchain)
          expect(getWallet().name).toBe('Web3 Wallet');
        });

        it('provides a connect function', async () => {
          mock(blockchain)
          expect(await getWallet().connect()).toStrictEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']);
        });

        it('provides an account function', async () => {
          mock(blockchain)
          expect(await getWallet().account()).toStrictEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
        });

        it('provides an accounts function', async () => {
          mock(blockchain)
          expect(await getWallet().accounts()).toStrictEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']);
        });

        it('provides a logo', async () => {
          mock(blockchain)
          expect(getWallet().logo).toStrictEqual("data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 446.42 376.77'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23828487;%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-1' d='M408.69,171.4H473.4V107.77a46.55,46.55,0,0,0-46.55-46.55H73.53A46.55,46.55,0,0,0,27,107.77v65.09H62.7L89.56,146a9.46,9.46,0,0,1,5.73-2.73h0l.41,0h78.59a47.2,47.2,0,1,1,82.63,39.56q-1.41,1.71-3,3.31t-3.31,3a47.21,47.21,0,0,1-76.31-26.9H100.21L73.34,189.07a9.43,9.43,0,0,1-5.73,2.73h0l-.41,0h-.07l-.48,0H27v74H55.83l18.25-18.24a9.39,9.39,0,0,1,5.73-2.74h0l.41,0h29.9a47.16,47.16,0,1,1,0,19H84.72L66.48,282.11a9.42,9.42,0,0,1-5.72,2.74h0l-.39,0H27V319H83.29a4,4,0,0,1,.49,0h.06l.41,0h0A9.41,9.41,0,0,1,90,321.78l28,28h57.66a47.2,47.2,0,1,1,81.48,40.9c-.6.67-1.22,1.32-1.86,2s-1.3,1.26-2,1.86a47.22,47.22,0,0,1-77.65-25.73H114.09a9.5,9.5,0,0,1-3.09-.52l-.08,0-.29-.11-.17-.07-.19-.08-.27-.12-.08,0a9.38,9.38,0,0,1-2.55-1.81l-28-28H27v53.46A46.55,46.55,0,0,0,73.53,438H426.86a46.55,46.55,0,0,0,46.54-46.55V327.82H408.69a78.22,78.22,0,0,1-78.21-78.21h0A78.22,78.22,0,0,1,408.69,171.4Z' transform='translate(-26.98 -61.22)'/%3E%3Cpath class='cls-1' d='M247.91,359.29a26,26,0,1,0-26,26A26,26,0,0,0,247.91,359.29Z' transform='translate(-26.98 -61.22)'/%3E%3Cpath class='cls-1' d='M246.55,152.71a26,26,0,1,0-26,26A26,26,0,0,0,246.55,152.71Z' transform='translate(-26.98 -61.22)'/%3E%3Ccircle class='cls-1' cx='129.39' cy='193.15' r='25.99'/%3E%3Cpath class='cls-1' d='M409.17,190h-.48a59.57,59.57,0,0,0-59.57,59.57h0a59.57,59.57,0,0,0,59.57,59.57h.48a59.58,59.58,0,0,0,59.58-59.57h0A59.58,59.58,0,0,0,409.17,190Zm14.45,90.61h-31l8.88-32.53a15.5,15.5,0,1,1,13.29,0Z' transform='translate(-26.98 -61.22)'/%3E%3C/svg%3E");
        });

        it('provides the blockchains that are supported by the wallet', () => {
          mock(blockchain)
          expect(getWallet().blockchains).toEqual(['ethereum', 'bsc'])
        });

        it('allows to switch network', async ()=>{
          let switchMock = mock({
            blockchain: 'ethereum',
            network: { switchTo: 'bsc' }
          })
          let wallet = getWallet()
          await getWallet().switchTo('bsc')
          expect(switchMock).toHaveBeenCalled()
        })

        it('adds the network if the network you request to switch to does not exist and switches to it afterwards', async ()=>{
          let switchMock
          let blockchain = Blockchain.findByName('bsc')

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
          
          let wallet = getWallet()
          await wallet.switchTo('bsc')

          expect(switchMock).toHaveBeenCalled()
          expect(addMock).toHaveBeenCalled()
          expect(await wallet.connectedTo('bsc')).toEqual(true)
        })
      })
    })
  })
})
