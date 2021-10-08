import { getWallet } from 'src'
import { mock, resetMocks, trigger } from 'depay-web3-mock'

describe('Coinbase Wallet', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
      beforeEach(()=>{
        resetMocks()
        mock({ blockchain, wallet: 'coinbase' })
      })
      beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))

      it('should detect the wallet type', () => {
        expect(getWallet().name).toBe('Coinbase Wallet');
      });

      it('provides a connect function', async () => {
        expect(await getWallet().connect()).toStrictEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']);
      });

      it('provides an account function', async () => {
        expect(await getWallet().account()).toStrictEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
      });

      it('provides an accounts function', async () => {
        expect(await getWallet().accounts()).toStrictEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']);
      });

      it('provides an logo', async () => {
        expect(getWallet().logo).toStrictEqual("data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 488.96 488.96'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:url(%23linear-gradient);%7D.cls-2%7Bfill:%234361ad;%7D%3C/style%3E%3ClinearGradient id='linear-gradient' x1='250' y1='7.35' x2='250' y2='496.32' gradientTransform='matrix(1, 0, 0, -1, 0, 502)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%233d5ba9'/%3E%3Cstop offset='1' stop-color='%234868b1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath class='cls-1' d='M250,5.68C114.87,5.68,5.52,115,5.52,250.17S114.87,494.65,250,494.65,494.48,385.29,494.48,250.17,385.13,5.68,250,5.68Zm0,387.54A143.06,143.06,0,1,1,393.05,250.17,143.11,143.11,0,0,1,250,393.22Z' transform='translate(-5.52 -5.68)'/%3E%3Cpath class='cls-2' d='M284.69,296.09H215.31a11,11,0,0,1-10.9-10.9V215.48a11,11,0,0,1,10.9-10.91H285a11,11,0,0,1,10.9,10.91v69.71A11.07,11.07,0,0,1,284.69,296.09Z' transform='translate(-5.52 -5.68)'/%3E%3C/svg%3E");
      });

      it('registers a callback and informs about active connected account changes', async () => {
        let accountChangedTo;

        getWallet().on('account', (newAccount)=>{
          accountChangedTo = newAccount;
        })

        trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

        expect(accountChangedTo).toEqual('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
      })

      it('registers a callback and informs about if any connected accounts have changed', async () => {
        let accountsChangedTo;

        getWallet().on('accounts', (newAccounts)=>{
          accountsChangedTo = newAccounts;
        })

        trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

        expect(accountsChangedTo).toEqual(['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])
      })

      it('registers a callback and informs about wallet changes network', async () => {
        let networkChangedTo;

        getWallet().on('network', (newNetwork)=>{
          networkChangedTo = newNetwork;
        })

        trigger('chainChanged', '0x38')
        expect(networkChangedTo).toEqual('bsc')

        trigger('chainChanged', '0x89')
        expect(networkChangedTo).toEqual('polygon')

        trigger('chainChanged', '0x1')
        expect(networkChangedTo).toEqual('ethereum')
      })

      it('provides the blockchains that are supported by the wallet', () => {
        expect(getWallet().blockchains).toEqual(['ethereum', 'bsc']);
      });
      
      it('provides a link to install the wallet', () => {
        expect(getWallet().install).toEqual('https://wallet.coinbase.com');
      });
    });
  });
});
