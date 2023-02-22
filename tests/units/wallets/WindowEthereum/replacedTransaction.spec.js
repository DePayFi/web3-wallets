import { ethers } from 'ethers'
import { getWallets } from 'src'
import { mock, connect, resetMocks, confirm, increaseBlock, fail, replace } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('window.ethereum wallet replaced transactions', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {
      
      let wallet

      const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      beforeEach(resetMocks)
      beforeEach(async()=>{
        mock({ blockchain, accounts: { return: [account] }})
        wallet = (await getWallets())[0]
      })
      afterEach(resetMocks)

      let address = '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92';
      let api = [{"inputs":[{"internalType":"address","name":"_configuration","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"configuration","outputs":[{"internalType":"contract DePayRouterV1Configuration","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"pluginAddress","type":"address"}],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"address[]","name":"plugins","type":"address[]"},{"internalType":"string[]","name":"data","type":"string[]"}],"name":"route","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
      let method = 'route';
      let params = {
        path: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'],
        amounts: ['7640757987460190', '10000000000000000000', '1623407305'],
        addresses: ['0x65aBbdEd9B937E38480A50eca85A8E4D2c8350E4'],
        plugins: ['0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019', '0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9'],
        data: []
      };
      
      let transaction;
      let mockedTransaction;
      let replacingTransactionMock;

      describe('a replacing transaction was mined successfully', ()=>{
        
        beforeEach(()=>{

          transaction = {
            blockchain,
            from: account,
            to: address,
            api: api,
            method: method,
            params: params
          };

          mockedTransaction = mock({
            blockchain,
            transaction
          })

          replacingTransactionMock = mock({
            blockchain,
            transaction
          })
          
        })

        it('calls the "confirmed" callback with the replacing transaction', async ()=> {
          let succededTransaction
          let submittedTransaction = await wallet.sendTransaction({... transaction, succeeded: (_succededTransaction)=>{
            succededTransaction = _succededTransaction
          }})
          replace(mockedTransaction, replacingTransactionMock)
          await new Promise((r) => setTimeout(r, 2000));
          expect(succededTransaction.id).toEqual(replacingTransactionMock.transaction._id)
          expect(succededTransaction.url).toMatch(replacingTransactionMock.transaction._id)
        })
      })

      describe('a replacing transaction was mined but failed', ()=>{
        
        beforeEach(()=>{

          transaction = {
            blockchain,
            from: account,
            to: address,
            api: api,
            method: method,
            params: params
          };

          mockedTransaction = mock({
            blockchain,
            transaction
          })

          replacingTransactionMock = mock({
            blockchain,
            transaction
          })
          
        })

        it('calls the "failed" callback with the replacing transaction', async ()=> {
          let failedTransaction
          let submittedTransaction = await wallet.sendTransaction({... transaction, failed: (_failedTransaction)=>{
            failedTransaction = _failedTransaction
          }})
          replace(mockedTransaction, replacingTransactionMock, false)
          await new Promise((r) => setTimeout(r, 2000));
          expect(failedTransaction.id).toEqual(replacingTransactionMock.transaction._id)
          expect(failedTransaction.url).toMatch(replacingTransactionMock.transaction._id)
        })
      })
    })
  })
})
