import { getWallet } from 'dist/cjs/index.js'
import { mock, resetMocks, trigger } from 'depay-web3-mock'

describe('MetaMask', () => {

  beforeEach(()=>{
    resetMocks()
    mock({ blockchain: 'ethereum', wallet: 'metamask' })
  })
  afterEach(resetMocks)

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
    expect(getWallet().logo).toStrictEqual('data:image/png;base64,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');
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

  it('provides wallet assets for all supported blockchains', async ()=> {
    
    mock('bsc')

    let apiKey = 'Test123'

     let assetsEthereum = [
      {
        "name": "Ether",
        "symbol": "ETH",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "blockchain": "ethereum",
        "type": "NATIVE",
        "balance": "5000000000000"
      }, {
        "name": "Dai Stablecoin",
        "symbol": "DAI",
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "type": "ERC20",
        "balance": "8007804249707967889272"
      }, {
        "name": "DePay",
        "symbol": "DEPAY",
        "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
        "type": "ERC20",
        "balance": "212816860003097638129"
      }
    ]

    let assetsBsc = [
      {
        "name": "Binance Coin",
        "symbol": "BNB",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "blockchain": "bsc",
        "type": "NATIVE",
        "balance": "1000000000000"
      }, {
        "name": "PancakeSwap Token",
        "symbol": "CAKE",
        "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        "type": "BEP20",
        "balance": "2221112213212321"
      }
    ]
    
    global.fetch = jest.fn((url, options)=>{
      expect(options).toEqual({ headers: { 'X-Api-Key': 'Test123' } })
      if(url.match('ethereum')) {
        expect(url).toEqual('https://api.depay.pro/v1/assets?account=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&blockchain=ethereum')
        return Promise.resolve({
          json: () => Promise.resolve(assetsEthereum)
        })
      } else if (url.match('bsc')) {
        expect(url).toEqual('https://api.depay.pro/v1/assets?account=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&blockchain=bsc')
        return Promise.resolve({
          json: () => Promise.resolve(assetsBsc)
        })
      }
    })

    let wallet = getWallet()
    expect(await wallet.assets({ apiKey })).toEqual([
      {
        "name": "Ether",
        "symbol": "ETH",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "blockchain": "ethereum",
        "type": "NATIVE",
        "balance": "5000000000000"
      }, {
        "name": "Dai Stablecoin",
        "symbol": "DAI",
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "blockchain": "ethereum",
        "type": "ERC20",
        "balance": "8007804249707967889272"
      }, {
        "name": "DePay",
        "symbol": "DEPAY",
        "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
        "blockchain": "ethereum",
        "type": "ERC20",
        "balance": "212816860003097638129"
      }, {
        "name": "Binance Coin",
        "symbol": "BNB",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "blockchain": "bsc",
        "type": "NATIVE",
        "balance": "1000000000000"
      }, {
        "name": "PancakeSwap Token",
        "symbol": "CAKE",
        "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        "blockchain": "bsc",
        "type": "BEP20",
        "balance": "2221112213212321"
      }
    ])
  })
});
