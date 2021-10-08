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
        expect(getWallet().logo).toStrictEqual("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3C!-- Generator: Adobe Illustrator 23.0.6, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 150 150' style='enable-background:new 0 0 150 150;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:url(%23SVGID_1_);%7D .st1%7Bfill:%232059EB;%7D %3C/style%3E%3Cg id='Layer_1'%3E%3C/g%3E%3Cg id='Layer_5'%3E%3Cg%3E%3ClinearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='75' y1='149' x2='75' y2='1'%3E%3Cstop offset='0' style='stop-color:%231447EA'%3E%3C/stop%3E%3Cstop offset='1' style='stop-color:%232B65FB'%3E%3C/stop%3E%3C/linearGradient%3E%3Cpath class='st0' d='M75,1C34.1,1,1,34.1,1,75s33.1,74,74,74s74-33.1,74-74S115.9,1,75,1z M75,118.3c-23.9,0-43.3-19.4-43.3-43.3 S51.1,31.7,75,31.7s43.3,19.4,43.3,43.3S98.9,118.3,75,118.3z'%3E%3C/path%3E%3Cpath class='st1' d='M85.5,88.9H64.5c-1.8,0-3.3-1.5-3.3-3.3V64.5c0-1.8,1.5-3.3,3.3-3.3h21.1c1.8,0,3.3,1.5,3.3,3.3v21.1 C88.9,87.4,87.4,88.9,85.5,88.9z'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E ");
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
