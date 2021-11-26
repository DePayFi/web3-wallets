import { getWallet } from 'src'
import { mock, resetMocks, trigger } from '@depay/web3-mock'

describe('MetaMask', () => {

  ['ethereum', 'bsc'].forEach((blockchain)=>{

    describe(blockchain, ()=> {

      const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
      beforeEach(resetMocks)
      beforeEach(()=>{
        resetMocks()
        mock({ blockchain, wallet: 'metamask' })
      })
      beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))

      it('should detect the wallet type', () => {
        expect(getWallet().name).toBe('MetaMask');
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
        expect(getWallet().logo).toStrictEqual("data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 485.93 450.56'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23828487;%7D.cls-2%7Bfill:%23e27726;stroke:%23e27726;%7D.cls-10,.cls-11,.cls-2,.cls-3,.cls-4,.cls-5,.cls-6,.cls-7,.cls-8,.cls-9%7Bstroke-linecap:round;stroke-linejoin:round;%7D.cls-3%7Bfill:%23e37725;stroke:%23e37725;%7D.cls-4%7Bfill:%23d6c0b3;stroke:%23d6c0b3;%7D.cls-5%7Bfill:%23243447;stroke:%23243447;%7D.cls-6%7Bfill:%23cd6328;stroke:%23cd6328;%7D.cls-7%7Bfill:%23e37525;stroke:%23e37525;%7D.cls-8%7Bfill:%23f6851f;stroke:%23f6851f;%7D.cls-9%7Bfill:%23c1ae9e;stroke:%23c1ae9e;%7D.cls-10%7Bfill:%23171717;stroke:%23171717;%7D.cls-11%7Bfill:%23763e1a;stroke:%23763e1a;%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-1' d='M247.91,356.29a26,26,0,1,0-26,26A26,26,0,0,0,247.91,356.29Z' transform='translate(-7.97 -21.33)'/%3E%3Cpath class='cls-1' d='M246.55,149.71a26,26,0,1,0-26,26A26,26,0,0,0,246.55,149.71Z' transform='translate(-7.97 -21.33)'/%3E%3Ccircle class='cls-1' cx='148.4' cy='230.05' r='25.99'/%3E%3Cpolygon class='cls-2' points='461.28 0.5 272.06 141.03 307.05 58.12 461.28 0.5'/%3E%3Cpolygon class='cls-3' points='24.46 0.5 212.16 142.37 178.88 58.12 24.46 0.5'/%3E%3Cpolygon class='cls-3' points='393.2 326.26 342.81 403.47 450.63 433.14 481.63 327.97 393.2 326.26'/%3E%3Cpolygon class='cls-3' points='4.49 327.97 35.3 433.14 143.13 403.47 92.73 326.26 4.49 327.97'/%3E%3Cpolygon class='cls-3' points='137.04 195.8 107 241.25 214.06 246.01 210.26 130.96 137.04 195.8'/%3E%3Cpolygon class='cls-3' points='348.7 195.8 274.53 129.63 272.06 246.01 378.94 241.25 348.7 195.8'/%3E%3Cpolygon class='cls-3' points='143.13 403.47 207.41 372.09 151.88 328.73 143.13 403.47'/%3E%3Cpolygon class='cls-3' points='278.34 372.09 342.81 403.47 333.87 328.73 278.34 372.09'/%3E%3Cpolygon class='cls-4' points='342.81 403.47 278.34 372.09 283.47 414.12 282.9 431.81 342.81 403.47'/%3E%3Cpolygon class='cls-4' points='143.13 403.47 203.03 431.81 202.65 414.12 207.41 372.09 143.13 403.47'/%3E%3Cpolygon class='cls-5' points='203.98 300.97 150.35 285.18 188.2 267.88 203.98 300.97'/%3E%3Cpolygon class='cls-5' points='281.76 300.97 297.55 267.88 335.58 285.18 281.76 300.97'/%3E%3Cpolygon class='cls-6' points='143.13 403.47 152.25 326.26 92.73 327.97 143.13 403.47'/%3E%3Cpolygon class='cls-6' points='333.68 326.26 342.81 403.47 393.2 327.97 333.68 326.26'/%3E%3Cpolygon class='cls-6' points='378.94 241.25 272.06 246.01 281.95 300.97 297.74 267.88 335.77 285.18 378.94 241.25'/%3E%3Cpolygon class='cls-6' points='150.35 285.18 188.39 267.88 203.98 300.97 214.06 246.01 107 241.25 150.35 285.18'/%3E%3Cpolygon class='cls-7' points='107 241.25 151.88 328.73 150.35 285.18 107 241.25'/%3E%3Cpolygon class='cls-7' points='335.77 285.18 333.87 328.73 378.94 241.25 335.77 285.18'/%3E%3Cpolygon class='cls-7' points='214.06 246.01 203.98 300.97 216.53 365.82 219.38 280.43 214.06 246.01'/%3E%3Cpolygon class='cls-7' points='272.06 246.01 266.93 280.24 269.21 365.82 281.95 300.97 272.06 246.01'/%3E%3Cpolygon class='cls-8' points='281.95 300.97 269.21 365.82 278.34 372.09 333.87 328.73 335.77 285.18 281.95 300.97'/%3E%3Cpolygon class='cls-8' points='150.35 285.18 151.88 328.73 207.41 372.09 216.53 365.82 203.98 300.97 150.35 285.18'/%3E%3Cpolygon class='cls-9' points='282.9 431.81 283.47 414.12 278.72 409.94 207.02 409.94 202.65 414.12 203.03 431.81 143.13 403.47 164.05 420.58 206.45 450.06 279.29 450.06 321.89 420.58 342.81 403.47 282.9 431.81'/%3E%3Cpolygon class='cls-10' points='278.34 372.09 269.21 365.82 216.53 365.82 207.41 372.09 202.65 414.12 207.02 409.94 278.72 409.94 283.47 414.12 278.34 372.09'/%3E%3Cpolygon class='cls-11' points='469.27 150.16 485.43 72.57 461.28 0.5 278.34 136.28 348.7 195.8 448.16 224.9 470.22 199.23 460.71 192.38 475.92 178.5 464.13 169.37 479.35 157.77 469.27 150.16'/%3E%3Cpolygon class='cls-11' points='0.5 72.57 16.66 150.16 6.39 157.77 21.61 169.37 10.01 178.5 25.22 192.38 15.71 199.23 37.58 224.9 137.04 195.8 207.41 136.28 24.46 0.5 0.5 72.57'/%3E%3Cpolygon class='cls-8' points='448.16 224.9 348.7 195.8 378.94 241.25 333.87 328.73 393.2 327.97 481.63 327.97 448.16 224.9'/%3E%3Cpolygon class='cls-8' points='137.04 195.8 37.58 224.9 4.49 327.97 92.73 327.97 151.88 328.73 107 241.25 137.04 195.8'/%3E%3Cpolygon class='cls-8' points='272.06 246.01 278.34 136.28 307.24 58.12 178.88 58.12 207.41 136.28 214.06 246.01 216.34 280.62 216.53 365.82 269.21 365.82 269.59 280.62 272.06 246.01'/%3E%3C/svg%3E");
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
        expect(getWallet().install).toEqual('https://metamask.io/download.html');
      });
    });
  });
});
