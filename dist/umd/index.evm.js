(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@depay/web3-client-evm'), require('@depay/web3-blockchains'), require('ethers'), require('@depay/walletconnect-v2'), require('@depay/coinbase-wallet-sdk')) :
  typeof define === 'function' && define.amd ? define(['exports', '@depay/web3-client-evm', '@depay/web3-blockchains', 'ethers', '@depay/walletconnect-v2', '@depay/coinbase-wallet-sdk'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Wallets = {}, global.Web3Client, global.Web3Blockchains, global.ethers, global.WalletConnectV2, global.CoinbaseWalletSdk));
}(this, (function (exports, web3ClientEvm, Blockchains$1, ethers, walletconnectV2, coinbaseWalletSdk) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Blockchains__default = /*#__PURE__*/_interopDefaultLegacy(Blockchains$1);

  let supported$1 = ['ethereum', 'bsc', 'polygon', 'fantom', 'arbitrum', 'avalanche', 'gnosis', 'optimism', 'base', 'worldchain'];
  supported$1.evm = ['ethereum', 'bsc', 'polygon', 'fantom', 'arbitrum', 'avalanche', 'gnosis', 'optimism', 'base', 'worldchain'];
  supported$1.solana = [];

  function _optionalChain$p(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Transaction {

    constructor({
      blockchain,
      from,
      to,
      value,
      api,
      method,
      params,
      instructions,
      signers,
      alts,
      sent,
      succeeded,
      failed
    }) {

      // required
      this.blockchain = blockchain;
      this.from = (from && from.match('0x')) ? ethers.ethers.utils.getAddress(from) : from;
      this.to = (to && to.match('0x')) ? ethers.ethers.utils.getAddress(to) : to;

      // optional
      this.value = _optionalChain$p([Transaction, 'access', _ => _.bigNumberify, 'call', _2 => _2(value, blockchain), 'optionalAccess', _3 => _3.toString, 'call', _4 => _4()]);
      this.api = api;
      this.method = method;
      this.params = params;
      this.sent = sent;
      this.succeeded = succeeded;
      this.failed = failed;
      this.instructions = instructions;
      this.signers = signers;
      this.alts = alts;

      // internal
      this._succeeded = false;
      this._failed = false;
    }

    async prepare({ wallet }) {
      this.from = await wallet.account(this.blockchain);
    }

    static bigNumberify(value, blockchain) {
      if (typeof value === 'number') {
        return ethers.ethers.utils.parseUnits(value.toString(), Blockchains__default['default'][blockchain].currency.decimals)
      } else if (value && value.toString) {
        return ethers.ethers.BigNumber.from(value.toString())
      } else {
        return value
      }
    }

    findFragment() {
      return this.getContract().interface.fragments.find((fragment) => {
        return(
          fragment.name == this.method &&
          (fragment.inputs && this.params && typeof(this.params) === 'object' ? fragment.inputs.length == Object.keys(this.params).length : true)
        )
      })
    }

    getParamType(param) {
      if(_optionalChain$p([param, 'optionalAccess', _5 => _5.components, 'optionalAccess', _6 => _6.length])) {
        return `(${param.components.map((param)=>this.getParamType(param)).join(',')})`
      } else {
        return param.type
      }
    }

    getMethodNameWithSignature() {
      let fragment = this.findFragment();
      if(fragment.inputs) {
        return `${this.method}(${fragment.inputs.map((param)=>this.getParamType(param)).join(',')})`
      } else {
        return this.method
      }
    }

    getContractArguments() {
      if(this.params instanceof Array) {
        return this.params
      } else if (this.params instanceof Object) {
        let fragment = this.findFragment();

        return fragment.inputs.map((input) => {
          return this.params[input.name]
        })
      }
    }

    getContract() {
      return new ethers.ethers.Contract(this.to, this.api)
    }

    async getData() {
      let contractArguments = this.getContractArguments();
      let populatedTransaction;
      if(contractArguments) {
        populatedTransaction = await this.getContract().populateTransaction[this.getMethodNameWithSignature()].apply(
          null, contractArguments
        );
      } else {
        populatedTransaction = await this.getContract().populateTransaction[this.getMethodNameWithSignature()].apply(null);
      }
       
      return populatedTransaction.data
    }

    success() {
      if (this._succeeded) {
        return Promise.resolve(this)
      }
      return new Promise((resolve, reject) => {
        let originalSucceeded = this.succeeded;
        this.succeeded = (transaction) => {
          if (originalSucceeded) originalSucceeded(transaction);
          resolve(transaction);
        };
      })
    }

    failure() {
      if (this._failed) {
        return Promise.resolve(this)
      }
      return new Promise((resolve, reject) => {
        let originalFailed = this.failed;
        this.failed = (transaction, reason) => {
          if (originalFailed) originalFailed(transaction, reason);
          resolve(transaction, reason);
        };
      })
    }
  }

  function _optionalChain$o(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const sendTransaction$2 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      await wallet.switchTo(transaction.blockchain);
    }
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
    await transaction.prepare({ wallet });
    let transactionCount = await web3ClientEvm.request({ blockchain: transaction.blockchain, method: 'transactionCount', address: transaction.from });
    transaction.nonce = transactionCount;
    let provider = new ethers.ethers.providers.Web3Provider(wallet.getProvider(), 'any');
    let signer = provider.getSigner(0);
    await submit$2({ transaction, provider, signer }).then((sentTransaction)=>{
      if (sentTransaction) {
        transaction.id = sentTransaction.hash;
        transaction.nonce = sentTransaction.nonce || transactionCount;
        transaction.url = Blockchains__default['default'].findByName(transaction.blockchain).explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        retrieveConfirmedTransaction$2(sentTransaction).then(() => {
          transaction._succeeded = true;
          if (transaction.succeeded) transaction.succeeded(transaction);
        }).catch((error)=>{
          if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
            if(error.replacement && error.replacement.hash) {
              transaction.id = error.replacement.hash;
              transaction.url = Blockchains__default['default'].findByName(transaction.blockchain).explorerUrlFor({ transaction });
            }
            if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 1) {
              transaction._succeeded = true;
              if (transaction.succeeded) transaction.succeeded(transaction);
            } else if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 0) {
              transaction._failed = true;
              if(transaction.failed) transaction.failed(transaction, error);  
            }
          } else {
            transaction._failed = true;
            if(transaction.failed) transaction.failed(transaction, error);
          }
        });
      } else {
        throw('Submitting transaction failed!')
      }
    });
    return transaction
  };

  const retrieveConfirmedTransaction$2 = (sentTransaction)=>{
    return new Promise((resolve, reject)=>{
      try {

        sentTransaction.wait(1).then(resolve).catch((error)=>{
          if(
            (error && _optionalChain$o([error, 'optionalAccess', _ => _.stack, 'optionalAccess', _2 => _2.match, 'call', _3 => _3('JSON-RPC error')])) ||
            (error && error.toString().match('undefined'))
          ) {
            setTimeout(()=>{
              retrieveConfirmedTransaction$2(sentTransaction)
                .then(resolve)
                .catch(reject);
            }, 500);
          } else {
            reject(error);
          }
        });
      } catch(error) {
        if(
          (error && _optionalChain$o([error, 'optionalAccess', _4 => _4.stack, 'optionalAccess', _5 => _5.match, 'call', _6 => _6('JSON-RPC error')])) ||
          (error && error.toString().match('undefined'))
        ) {
          setTimeout(()=>{
            retrieveConfirmedTransaction$2(sentTransaction)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      }
    })
  };

  const submit$2 = ({ transaction, provider, signer }) => {
    if(transaction.method) {
      return submitContractInteraction$2({ transaction, signer, provider })
    } else {
      return submitSimpleTransfer$2({ transaction, signer })
    }
  };

  const submitContractInteraction$2 = async ({ transaction, signer, provider })=>{
    let contract = new ethers.ethers.Contract(transaction.to, transaction.api, provider);
    let contractArguments = transaction.getContractArguments({ contract });
    let method = contract.connect(signer)[transaction.getMethodNameWithSignature()];
    let gas;
    try {
      gas = await web3ClientEvm.estimate(transaction);
      gas = gas.add(gas.div(10));
    } catch (e) {}
    if(contractArguments) {
      return await method(...contractArguments, {
        value: Transaction.bigNumberify(transaction.value, transaction.blockchain),
        gasLimit: _optionalChain$o([gas, 'optionalAccess', _7 => _7.toHexString, 'call', _8 => _8()])
      })
    } else {
      return await method({
        value: Transaction.bigNumberify(transaction.value, transaction.blockchain),
        gasLimit: _optionalChain$o([gas, 'optionalAccess', _9 => _9.toHexString, 'call', _10 => _10()])
      })
    }
  };

  const submitSimpleTransfer$2 = ({ transaction, signer })=>{
    return signer.sendTransaction({
      to: transaction.to,
      value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
    })
  };

  function _optionalChain$n(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  class WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Ethereum Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA0NDYuNCAzNzYuOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ2LjQgMzc2Ljg7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojODI4NDg3O30KCS5zdDF7ZmlsbDojMzQzNDM0O30KCS5zdDJ7ZmlsbDojOEM4QzhDO30KCS5zdDN7ZmlsbDojM0MzQzNCO30KCS5zdDR7ZmlsbDojMTQxNDE0O30KCS5zdDV7ZmlsbDojMzkzOTM5O30KPC9zdHlsZT4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTM4MS43LDExMC4yaDY0LjdWNDYuNWMwLTI1LjctMjAuOC00Ni41LTQ2LjUtNDYuNUg0Ni41QzIwLjgsMCwwLDIwLjgsMCw0Ni41djY1LjFoMzUuN2wyNi45LTI2LjkKCWMxLjUtMS41LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDc4LjZjNS4zLTI1LjUsMzAuMi00Miw1NS43LTM2LjdjMjUuNSw1LjMsNDIsMzAuMiwzNi43LDU1LjdjLTEuNiw3LjUtNC45LDE0LjYtOS44LDIwLjUKCWMtMC45LDEuMS0xLjksMi4yLTMsMy4zYy0xLjEsMS4xLTIuMiwyLjEtMy4zLDNjLTIwLjEsMTYuNi00OS45LDEzLjgtNjYuNS02LjNjLTQuOS01LjktOC4zLTEzLTkuOC0yMC42SDczLjJsLTI2LjksMjYuOAoJYy0xLjUsMS41LTMuNiwyLjUtNS43LDIuN2wwLDBoLTAuNGgtMC4xaC0wLjVIMHY3NGgyOC44bDE4LjItMTguMmMxLjUtMS42LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDI5LjkKCWM1LjItMjUuNSwzMC4yLTQxLjksNTUuNy0zNi43czQxLjksMzAuMiwzNi43LDU1LjdzLTMwLjIsNDEuOS01NS43LDM2LjdjLTE4LjUtMy44LTMyLjktMTguMi0zNi43LTM2LjdINTcuN2wtMTguMiwxOC4zCgljLTEuNSwxLjUtMy42LDIuNS01LjcsMi43bDAsMGgtMC40SDB2MzQuMmg1Ni4zYzAuMiwwLDAuMywwLDAuNSwwaDAuMWgwLjRsMCwwYzIuMiwwLjIsNC4yLDEuMiw1LjgsMi44bDI4LDI4aDU3LjcKCWM1LjMtMjUuNSwzMC4yLTQyLDU1LjctMzYuN3M0MiwzMC4yLDM2LjcsNTUuN2MtMS43LDguMS01LjUsMTUuNy0xMSwyMS45Yy0wLjYsMC43LTEuMiwxLjMtMS45LDJzLTEuMywxLjMtMiwxLjkKCWMtMTkuNSwxNy4zLTQ5LjMsMTUuNi02Ni43LTMuOWMtNS41LTYuMi05LjMtMTMuNy0xMS0yMS45SDg3LjFjLTEuMSwwLTIuMS0wLjItMy4xLTAuNWgtMC4xbC0wLjMtMC4xbC0wLjItMC4xbC0wLjItMC4xbC0wLjMtMC4xCgloLTAuMWMtMC45LTAuNS0xLjgtMS4xLTIuNi0xLjhsLTI4LTI4SDB2NTMuNWMwLjEsMjUuNywyMC45LDQ2LjQsNDYuNSw0Ni40aDM1My4zYzI1LjcsMCw0Ni41LTIwLjgsNDYuNS00Ni41di02My42aC02NC43CgljLTQzLjIsMC03OC4yLTM1LTc4LjItNzguMmwwLDBDMzAzLjUsMTQ1LjIsMzM4LjUsMTEwLjIsMzgxLjcsMTEwLjJ6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMjAuOSwyOTguMWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIyMC45LDMxMi40LDIyMC45LDI5OC4xTDIyMC45LDI5OC4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjE5LjYsOTEuNWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIxOS42LDEwNS44LDIxOS42LDkxLjV6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zODIuMiwxMjguOGgtMC41Yy0zMi45LDAtNTkuNiwyNi43LTU5LjYsNTkuNmwwLDBsMCwwYzAsMzIuOSwyNi43LDU5LjYsNTkuNiw1OS42bDAsMGgwLjUKCWMzMi45LDAsNTkuNi0yNi43LDU5LjYtNTkuNmwwLDBDNDQxLjgsMTU1LjQsNDE1LjEsMTI4LjgsMzgyLjIsMTI4Ljh6IE0zOTYuNiwyMTkuNGgtMzFsOC45LTMyLjVjLTcuNy0zLjctMTEtMTIuOS03LjQtMjAuNgoJYzMuNy03LjcsMTIuOS0xMSwyMC42LTcuNGM3LjcsMy43LDExLDEyLjksNy40LDIwLjZjLTEuNSwzLjItNC4xLDUuOC03LjQsNy40TDM5Ni42LDIxOS40eiIvPgo8ZyBpZD0iTGF5ZXJfeDAwMjBfMSI+Cgk8ZyBpZD0iXzE0MjEzOTQzNDI0MDAiPgoJCTxnPgoJCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjEyOSwxNjYuMiAxMjguNywxNjcuMyAxMjguNywyMDEuNCAxMjksMjAxLjcgMTQ0LjgsMTkyLjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDE2Ni4yIDExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDMiIHBvaW50cz0iMTI5LDIwNC43IDEyOC44LDIwNC45IDEyOC44LDIxNyAxMjksMjE3LjYgMTQ0LjgsMTk1LjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDIxNy42IDEyOSwyMDQuNyAxMTMuMiwxOTUuNCAJCQkiLz4KCQkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMjksMjAxLjcgMTQ0LjgsMTkyLjQgMTI5LDE4NS4yIAkJCSIvPgoJCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJPC9nPgoJPC9nPgo8L2c+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ 
      return (
        _optionalChain$n([window, 'optionalAccess', _38 => _38.ethereum]) &&
        // not MetaMask
        !(_optionalChain$n([window, 'optionalAccess', _39 => _39.ethereum, 'optionalAccess', _40 => _40.isMetaMask]) && Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!PocketUniverse)(?!RevokeCash)/)).length == 1) &&
        // not Coin98
        !_optionalChain$n([window, 'optionalAccess', _41 => _41.coin98]) &&
        // not Trust Wallet
        !(_optionalChain$n([window, 'optionalAccess', _42 => _42.ethereum, 'optionalAccess', _43 => _43.isTrust]) || _optionalChain$n([window, 'optionalAccess', _44 => _44.ethereum, 'optionalAccess', _45 => _45.isTrustWallet])) &&
        // not crypto.com
        !_optionalChain$n([window, 'optionalAccess', _46 => _46.ethereum, 'optionalAccess', _47 => _47.isDeficonnectProvider]) &&
        // not HyperPay
        !_optionalChain$n([window, 'optionalAccess', _48 => _48.ethereum, 'optionalAccess', _49 => _49.isHyperPay]) &&
        // not Phantom
        !(window.phantom && !window.glow && !_optionalChain$n([window, 'optionalAccess', _50 => _50.solana, 'optionalAccess', _51 => _51.isGlow]) && !['isBitKeep'].some((identifier)=>window.solana && window.solana[identifier])) &&
        // not Rabby
        !_optionalChain$n([window, 'optionalAccess', _52 => _52.ethereum, 'optionalAccess', _53 => _53.isRabby]) &&
        // not Backpack
        !_optionalChain$n([window, 'optionalAccess', _54 => _54.backpack, 'optionalAccess', _55 => _55.isBackpack]) &&
        // not TokenPocket
        !_optionalChain$n([window, 'optionalAccess', _56 => _56.ethereum, 'optionalAccess', _57 => _57.isTokenPocket]) && 
        // not BitKeep
        !_optionalChain$n([window, 'optionalAccess', _58 => _58.ethereum, 'optionalAccess', _59 => _59.isBitKeep]) && 
        // not Coinbase
        !(_optionalChain$n([window, 'optionalAccess', _60 => _60.ethereum, 'optionalAccess', _61 => _61.isCoinbaseWallet]) || _optionalChain$n([window, 'optionalAccess', _62 => _62.ethereum, 'optionalAccess', _63 => _63.isWalletLink])) &&
        // MetaMask through ProviderMap
        !_optionalChain$n([window, 'optionalAccess', _64 => _64.ethereum, 'optionalAccess', _65 => _65.providerMap, 'optionalAccess', _66 => _66.has, 'call', _67 => _67('MetaMask')]) &&
        // Brave Wallet
        !_optionalChain$n([window, 'optionalAccess', _68 => _68.ethereum, 'optionalAccess', _69 => _69.isBraveWallet]) &&
        // Uniswap Wallet
        !_optionalChain$n([window, 'optionalAccess', _70 => _70.ethereum, 'optionalAccess', _71 => _71.isUniswapWallet]) &&
        // Rainbow
        !_optionalChain$n([window, 'optionalAccess', _72 => _72.ethereum, 'optionalAccess', _73 => _73.isRainbow]) &&
        // OKX Wallet
        !_optionalChain$n([window, 'optionalAccess', _74 => _74.okxwallet])
      )
    };}
    
    constructor () {
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      this.sendTransaction = (transaction)=>{
        return sendTransaction$2({
          wallet: this,
          transaction
        })
      };
    }

    getProvider() { return window.ethereum }

    async account() {
      if(!this.getProvider()) { return undefined }
      const accounts = (await this.getProvider().request({ method: 'eth_accounts' })).map((address)=>ethers.ethers.utils.getAddress(address));
      return accounts[0]
    }

    async connect() {
      if(!this.getProvider()) { return undefined }
      const accounts = (await this.getProvider().request({ method: 'eth_requestAccounts' })).map((address)=>ethers.ethers.utils.getAddress(address));
      return accounts[0]
    }

    on(event, callback) {
      let internalCallback;
      switch (event) {
        case 'account':
          internalCallback = (accounts) => callback(ethers.ethers.utils.getAddress(accounts[0]));
          this.getProvider().on('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    off(event, internalCallback) {
      switch (event) {
        case 'account':
          this.getProvider().removeListener('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    async connectedTo(input) {
      const blockchain = Blockchains__default['default'].findById(await this.getProvider().request({ method: 'eth_chainId' }));
      if(!blockchain) { return false }
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        this.getProvider().request({
          method: 'wallet_addEthereumChain',
          params: [{
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
          }],
        }).then(resolve).catch(reject);
      })
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        this.getProvider().request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: blockchain.id }],
        }).then(resolve).catch((error)=> {
          if(error.code === 4902){ // chain not yet added
            this.addNetwork(blockchainName)
              .then(()=>this.switchTo(blockchainName).then(resolve))
              .catch(reject);
          } else {
            reject(error);
          }
        });
      })
    }

    transactionCount({ blockchain, address }) {
      return web3ClientEvm.request({ blockchain, method: 'transactionCount', address })
    }

    async sign(message) {
      if(typeof message === 'object') {
        let provider = this.getProvider();
        let account = await this.account();
        if((await this.connectedTo(Blockchains__default['default'].findByNetworkId(message.domain.chainId).name)) === false) {
          throw({ code: 'WRONG_NETWORK' })
        }
        let signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [account, message],
          from: account,
        });
        return signature
      } else if (typeof message === 'string') {
        await this.account();
        let provider = new ethers.ethers.providers.Web3Provider(this.getProvider(), 'any');
        let signer = provider.getSigner(0);
        let signature = await signer.signMessage(message);
        return signature
      }
    }
  } WindowEthereum.__initStatic(); WindowEthereum.__initStatic2();

  function _optionalChain$m(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Binance extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Binance Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIgMTkzLjY4Ij48cmVjdCB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5My42OCIgZmlsbD0iIzFlMjAyNCIvPjxwYXRoIGQ9Im01Ni45Miw0Ni41M2wzOS4wOC0yMi41NCwzOS4wOCwyMi41NC0xNC4zNSw4LjM2LTI0LjczLTE0LjE4LTI0LjczLDE0LjE4LTE0LjM1LTguMzZabTc4LjE3LDI4LjUzbC0xNC4zNS04LjM2LTI0LjczLDE0LjI3LTI0LjczLTE0LjI3LTE0LjM1LDguMzZ2MTYuNzFsMjQuNzMsMTQuMTh2MjguNDVsMTQuMzUsOC4zNiwxNC4zNS04LjM2di0yOC40NWwyNC43My0xNC4yN3YtMTYuNjNabTAsNDUuMTZ2LTE2LjcxbC0xNC4zNSw4LjM2djE2LjcxbDE0LjM1LTguMzZabTEwLjIxLDUuODJsLTI0LjczLDE0LjI3djE2LjcxbDM5LjA4LTIyLjU0di00NS4yNWwtMTQuMzUsOC4zNnYyOC40NVptLTE0LjM1LTY1LjI1bDE0LjM1LDguMzZ2MTYuNzFsMTQuMzUtOC4zNnYtMTYuNzFsLTE0LjM1LTguMzYtMTQuMzUsOC4zNlptLTQ5LjMsODUuNnYxNi43MWwxNC4zNSw4LjM2LDE0LjM1LTguMzZ2LTE2LjcxbC0xNC4zNSw4LjM2LTE0LjM1LTguMzZabS0yNC43My0yNi4xN2wxNC4zNSw4LjM2di0xNi43MWwtMTQuMzUtOC4zNnYxNi43MVptMjQuNzMtNTkuNDNsMTQuMzUsOC4zNiwxNC4zNS04LjM2LTE0LjM1LTguMzYtMTQuMzUsOC4zNlptLTM0Ljk1LDguMzZsMTQuMzUtOC4zNi0xNC4zNS04LjM2LTE0LjM1LDguMzZ2MTYuNzFsMTQuMzUsOC4zNnYtMTYuNzFabTAsMjguNDVsLTE0LjM1LTguMzZ2NDUuMTZsMzkuMDgsMjIuNTR2LTE2LjcxbC0yNC43My0xNC4yN3MwLTI4LjM2LDAtMjguMzZaIiBmaWxsPSIjZjBiOTBiIi8+PC9zdmc+",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return _optionalChain$m([window, 'optionalAccess', _2 => _2.BinanceChain]) &&
        !window.coin98 &&
        !window.trustwallet
    };}

    getProvider() { return window.BinanceChain }

  } Binance.__initStatic(); Binance.__initStatic2();

  var logos = {
    exodus: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yOTguMjAzIDgzLjc2NDVMMTcwLjQ0OSAwVjQ2LjgzMzJMMjUyLjQwNSAxMDAuMDg5TDI0Mi43NjMgMTMwLjU5OEgxNzAuNDQ5VjE2OS40MDJIMjQyLjc2M0wyNTIuNDA1IDE5OS45MTFMMTcwLjQ0OSAyNTMuMTY3VjMwMEwyOTguMjAzIDIxNi41MDNMMjc3LjMxMyAxNTAuMTM0TDI5OC4yMDMgODMuNzY0NVoiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8xNjYxXzI5NSkiLz4KPHBhdGggZD0iTTU5LjMwMDcgMTY5LjQwMkgxMzEuMzQ2VjEzMC41OThINTkuMDMyOUw0OS42NTg5IDEwMC4wODlMMTMxLjM0NiA0Ni44MzMyVjBMMy41OTI1MyA4My43NjQ1TDI0LjQ4MzEgMTUwLjEzNEwzLjU5MjUzIDIxNi41MDNMMTMxLjYxNCAzMDBWMjUzLjE2N0w0OS42NTg5IDE5OS45MTFMNTkuMzAwNyAxNjkuNDAyWiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzE2NjFfMjk1KSIvPgo8bWFzayBpZD0ibWFzazBfMTY2MV8yOTUiIHN0eWxlPSJtYXNrLXR5cGU6YWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjMiIHk9IjAiIHdpZHRoPSIyOTYiIGhlaWdodD0iMzAwIj4KPHBhdGggZD0iTTI5OC4yMDQgODMuNzY0NUwxNzAuNDUgMFY0Ni44MzMyTDI1Mi40MDUgMTAwLjA4OUwyNDIuNzYzIDEzMC41OThIMTcwLjQ1VjE2OS40MDJIMjQyLjc2M0wyNTIuNDA1IDE5OS45MTFMMTcwLjQ1IDI1My4xNjdWMzAwTDI5OC4yMDQgMjE2LjUwM0wyNzcuMzEzIDE1MC4xMzRMMjk4LjIwNCA4My43NjQ1WiIgZmlsbD0idXJsKCNwYWludDJfbGluZWFyXzE2NjFfMjk1KSIvPgo8cGF0aCBkPSJNNTkuMzAxIDE2OS40MDJIMTMxLjM0N1YxMzAuNTk4SDU5LjAzMzJMNDkuNjU5MiAxMDAuMDg5TDEzMS4zNDcgNDYuODMzMlYwTDMuNTkyNzcgODMuNzY0NUwyNC40ODM0IDE1MC4xMzRMMy41OTI3NyAyMTYuNTAzTDEzMS42MTUgMzAwVjI1My4xNjdMNDkuNjU5MiAxOTkuOTExTDU5LjMwMSAxNjkuNDAyWiIgZmlsbD0idXJsKCNwYWludDNfbGluZWFyXzE2NjFfMjk1KSIvPgo8L21hc2s+CjxnIG1hc2s9InVybCgjbWFzazBfMTY2MV8yOTUpIj4KPHJlY3QgeD0iMy43NTAyNCIgd2lkdGg9IjI5Mi41IiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNwYWludDRfbGluZWFyXzE2NjFfMjk1KSIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMTY2MV8yOTUiIHgxPSIyNTYuODc1IiB5MT0iMzIwLjYyNSIgeDI9IjE3MS4zIiB5Mj0iLTMyLjk0NTkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzBCNDZGOSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNCQkZCRTAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyXzE2NjFfMjk1IiB4MT0iMjU2Ljg3NSIgeTE9IjMyMC42MjUiIHgyPSIxNzEuMyIgeTI9Ii0zMi45NDU5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwQjQ2RjkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjQkJGQkUwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQyX2xpbmVhcl8xNjYxXzI5NSIgeDE9IjI1Ni44NzUiIHkxPSIzMjAuNjI1IiB4Mj0iMTcxLjMiIHkyPSItMzIuOTQ1OSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMEI0NkY5Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0JCRkJFMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50M19saW5lYXJfMTY2MV8yOTUiIHgxPSIyNTYuODc1IiB5MT0iMzIwLjYyNSIgeDI9IjE3MS4zIiB5Mj0iLTMyLjk0NTkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzBCNDZGOSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNCQkZCRTAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDRfbGluZWFyXzE2NjFfMjk1IiB4MT0iMjIuNTAwMiIgeTE9IjY3LjUiIHgyPSIxNzAuNjI1IiB5Mj0iMTc4LjEyNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMTE5NzkyIiBzdG9wLWNvbG9yPSIjODk1MkZGIiBzdG9wLW9wYWNpdHk9IjAuODciLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjREFCREZGIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K",
    phantom: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMjggMTI4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMjggMTI4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0FCOUZGMjt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMy43LDEwOWMxMy42LDAsMjMuOS0xMS45LDMwLTIxLjJjLTAuNywyLjEtMS4yLDQuMS0xLjIsNi4xYzAsNS41LDMuMSw5LjQsOS4zLDkuNGM4LjUsMCwxNy42LTcuNSwyMi4zLTE1LjUKCWMtMC4zLDEuMi0wLjUsMi4yLTAuNSwzLjJjMCwzLjgsMi4xLDYuMiw2LjUsNi4yYzEzLjgsMCwyNy43LTI0LjUsMjcuNy00NS45YzAtMTYuNy04LjQtMzEuNC0yOS42LTMxLjQKCWMtMzcuMiwwLTc3LjMsNDUuNS03Ny4zLDc0LjhDMTEuMSwxMDYuMywxNy4zLDEwOSwyMy43LDEwOXogTTc1LjUsNDkuNWMwLTQuMSwyLjMtNy4xLDUuNy03LjFjMy4zLDAsNS42LDIuOSw1LjYsNy4xCgljMCw0LjEtMi4zLDcuMS01LjYsNy4xQzc3LjgsNTYuNyw3NS41LDUzLjcsNzUuNSw0OS41eiBNOTMuMiw0OS41YzAtNC4xLDIuMy03LjEsNS43LTcuMWMzLjMsMCw1LjYsMi45LDUuNiw3LjEKCWMwLDQuMS0yLjMsNy4xLTUuNiw3LjFDOTUuNSw1Ni43LDkzLjIsNTMuNyw5My4yLDQ5LjV6Ii8+Cjwvc3ZnPgo=",
    coin98: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA0MC43IDQwIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA0MC43IDQwIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsPSIjRDlCNDMyIiBkPSJtMzMuMyAwaC0yNS45Yy00LjEgMC03LjQgMy4zLTcuNCA3LjN2MjUuNGMwIDQgMy4zIDcuMyA3LjQgNy4zaDI1LjljNC4xIDAgNy40LTMuMyA3LjQtNy4zdi0yNS40YzAtNC0zLjMtNy4zLTcuNC03LjN6Ii8+CjxwYXRoIGZpbGw9IiMyNTI1MjUiIGQ9Im0zMy4zIDBoLTI1LjljLTQuMSAwLTcuNCAzLjMtNy40IDcuM3YyNS40YzAgNCAzLjMgNy4zIDcuNCA3LjNoMjUuOWM0LjEgMCA3LjQtMy4zIDcuNC03LjN2LTI1LjRjMC00LTMuMy03LjMtNy40LTcuM3ptLTYuMyAxMGMzIDAgNS41IDIuNCA1LjUgNS40IDAgMC45LTAuMiAxLjgtMC42IDIuNi0wLjctMC41LTEuNS0xLTIuMy0xLjMgMC4yLTAuNCAwLjMtMC45IDAuMy0xLjMgMC0xLjUtMS4zLTIuOC0yLjgtMi44LTEuNiAwLTIuOCAxLjMtMi44IDIuOCAwIDAuNSAwLjEgMC45IDAuMyAxLjMtMC44IDAuMy0xLjYgMC43LTIuMyAxLjMtMC41LTAuOC0wLjYtMS43LTAuNi0yLjYtMC4xLTMgMi4zLTUuNCA1LjMtNS40em0tMTMuMyAyMGMtMyAwLTUuNS0yLjQtNS41LTUuNGgyLjZjMCAxLjUgMS4zIDIuOCAyLjggMi44czIuOC0xLjMgMi44LTIuOGgyLjZjMC4yIDMtMi4zIDUuNC01LjMgNS40em0wLTcuNWMtMy41IDAtNi4zLTIuOC02LjMtNi4yczIuOC02LjMgNi4zLTYuMyA2LjQgMi44IDYuNCA2LjNjMCAzLjQtMi45IDYuMi02LjQgNi4yem0xMy4zIDcuNWMtMy41IDAtNi40LTIuOC02LjQtNi4yIDAtMy41IDIuOC02LjMgNi40LTYuMyAzLjUgMCA2LjMgMi44IDYuMyA2LjMgMC4xIDMuNC0yLjggNi4yLTYuMyA2LjJ6bTMuOC02LjNjMCAyLjEtMS43IDMuNy0zLjggMy43cy0zLjgtMS43LTMuOC0zLjdjMC0yLjEgMS43LTMuNyAzLjgtMy43IDIuMSAwLjEgMy44IDEuNyAzLjggMy43em0tMTMuNC03LjRjMCAyLjEtMS43IDMuNy0zLjggMy43cy0zLjgtMS43LTMuOC0zLjdjMC0yLjEgMS43LTMuNyAzLjgtMy43IDIuMiAwIDMuOCAxLjYgMy44IDMuN3oiLz4KPC9zdmc+Cg==",
    coinbase: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB2aWV3Qm94PScwIDAgNDg4Ljk2IDQ4OC45Nic+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6IzQzNjFhZDt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9J2xpbmVhci1ncmFkaWVudCcgeDE9JzI1MCcgeTE9JzcuMzUnIHgyPScyNTAnIHkyPSc0OTYuMzInIGdyYWRpZW50VHJhbnNmb3JtPSdtYXRyaXgoMSwgMCwgMCwgLTEsIDAsIDUwMiknIGdyYWRpZW50VW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyMzZDViYTknLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyM0ODY4YjEnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNTAsNS42OEMxMTQuODcsNS42OCw1LjUyLDExNSw1LjUyLDI1MC4xN1MxMTQuODcsNDk0LjY1LDI1MCw0OTQuNjUsNDk0LjQ4LDM4NS4yOSw0OTQuNDgsMjUwLjE3LDM4NS4xMyw1LjY4LDI1MCw1LjY4Wm0wLDM4Ny41NEExNDMuMDYsMTQzLjA2LDAsMSwxLDM5My4wNSwyNTAuMTcsMTQzLjExLDE0My4xMSwwLDAsMSwyNTAsMzkzLjIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUuNTIgLTUuNjgpJy8+PHBhdGggY2xhc3M9J2Nscy0yJyBkPSdNMjg0LjY5LDI5Ni4wOUgyMTUuMzFhMTEsMTEsMCwwLDEtMTAuOS0xMC45VjIxNS40OGExMSwxMSwwLDAsMSwxMC45LTEwLjkxSDI4NWExMSwxMSwwLDAsMSwxMC45LDEwLjkxdjY5LjcxQTExLjA3LDExLjA3LDAsMCwxLDI4NC42OSwyOTYuMDlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNS41MiAtNS42OCknLz48L3N2Zz4=",
    trust: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI4LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAzOTkuOCA0MTUuMSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzk5LjggNDE1LjE7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojMDUwMEZGO30KCS5zdDF7ZmlsbDp1cmwoI1NWR0lEXzFfKTt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTU1LjUsOTJsMTQ0LjQtNDd2MzI1Qzk2LjcsMzI2LjcsNTUuNSwyNDMuNiw1NS41LDE5Ni43TDU1LjUsOTJMNTUuNSw5MnoiLz4KCQoJCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMzA1Ljk5NTMiIHkxPSIxODQ2LjAwMDIiIHgyPSIxOTYuODc1MiIgeTI9IjIxODkuMzQwMyIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDAgLTE4MjMuNzM5NykiPgoJCTxzdG9wICBvZmZzZXQ9IjIuMDAwMDAwZS0wMiIgc3R5bGU9InN0b3AtY29sb3I6IzAwMDBGRiIvPgoJCTxzdG9wICBvZmZzZXQ9IjguMDAwMDAwZS0wMiIgc3R5bGU9InN0b3AtY29sb3I6IzAwOTRGRiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuMTYiIHN0eWxlPSJzdG9wLWNvbG9yOiM0OEZGOTEiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjQyIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA5NEZGIi8+CgkJPHN0b3AgIG9mZnNldD0iMC42OCIgc3R5bGU9InN0b3AtY29sb3I6IzAwMzhGRiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOSIgc3R5bGU9InN0b3AtY29sb3I6IzA1MDBGRiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0zNDQuNCw5MkwxOTkuOSw0NXYzMjVjMTAzLjItNDMuMywxNDQuNS0xMjYuNCwxNDQuNS0xNzMuM1Y5MkwzNDQuNCw5MnoiLz4KPC9nPgo8L3N2Zz4K",
    brave: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyNTYgMzAxIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNTYgMzAxIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoKCTxwYXRoIGZpbGw9IiNGMTVBMjIiIGQ9Im0yMzYgMTA1LjQtNy44LTIxLjIgNS40LTEyLjJjMC43LTEuNiAwLjMtMy40LTAuOC00LjZsLTE0LjgtMTQuOWMtNi41LTYuNS0xNi4xLTguOC0yNC44LTUuN2wtNC4xIDEuNC0yMi42LTI0LjUtMzguMi0wLjNoLTAuM2wtMzguNSAwLjMtMjIuNiAyNC43LTQtMS40Yy04LjgtMy4xLTE4LjUtMC44LTI1IDUuOGwtMTUgMTUuMmMtMSAxLTEuMyAyLjQtMC44IDMuN2w1LjcgMTIuNy03LjggMjEuMiA1LjEgMTkuMiAyMyA4Ny4yYzIuNiAxMCA4LjcgMTguOCAxNy4yIDI0LjkgMCAwIDI3LjggMTkuNyA1NS4zIDM3LjUgMi40IDEuNiA1IDIuNyA3LjcgMi43czUuMi0xLjEgNy43LTIuN2MzMC45LTIwLjIgNTUuMy0zNy41IDU1LjMtMzcuNSA4LjQtNi4xIDE0LjUtMTQuOCAxNy4xLTI0LjlsMjIuOC04Ny4yIDQuOC0xOS40eiIvPgoJPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0ibTEzMy4xIDE3OS40Yy0xLTAuNC0yLjEtMC44LTIuNC0wLjhoLTIuN2MtMC4zIDAtMS40IDAuMy0yLjQgMC44bC0xMSA0LjZjLTEgMC40LTIuNyAxLjItMy43IDEuN2wtMTYuNSA4LjZjLTEgMC41LTEuMSAxLjQtMC4yIDIuMWwxNC42IDEwLjNjMC45IDAuNyAyLjQgMS44IDMuMiAyLjVsNi41IDUuNmMwLjggMC44IDIuMiAxLjkgMyAyLjdsNi4yIDUuNmMwLjggMC44IDIuMiAwLjggMyAwbDYuNC01LjZjMC44LTAuOCAyLjItMS45IDMtMi43bDYuNS01LjdjMC44LTAuOCAyLjMtMS45IDMuMi0yLjVsMTQuNi0xMC40YzAuOS0wLjcgMC44LTEuNi0wLjItMi4xbC0xNi41LTguNGMtMS0wLjUtMi43LTEuMy0zLjctMS43bC0xMC45LTQuNnoiLz4KCTxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Im0yMTIuMiAxMDkuMmMwLjMtMS4xIDAuMy0xLjUgMC4zLTEuNSAwLTEuMS0wLjEtMy0wLjMtNGwtMC44LTIuNGMtMC41LTEtMS40LTIuNi0yLTMuNWwtOS41LTE0LjFjLTAuNi0wLjktMS43LTIuNC0yLjQtMy4zbC0xMi4zLTE1LjRjLTAuNy0wLjgtMS40LTEuNi0xLjQtMS41aC0wLjJzLTAuOSAwLjItMiAwLjNsLTE4LjggMy43Yy0xLjEgMC4zLTIuOSAwLjYtNCAwLjhsLTAuMyAwLjFjLTEuMSAwLjItMi45IDAuMS00LTAuM2wtMTUuOC01LjFjLTEuMS0wLjMtMi45LTAuOC0zLjktMS4xIDAgMC0zLjItMC44LTUuOC0wLjctMi42IDAtNS44IDAuNy01LjggMC43LTEuMSAwLjMtMi45IDAuOC0zLjkgMS4xbC0xNS44IDUuMWMtMS4xIDAuMy0yLjkgMC40LTQgMC4zbC0wLjMtMC4xYy0xLjEtMC4yLTIuOS0wLjYtNC0wLjhsLTE5LTMuNWMtMS4xLTAuMy0yLTAuMy0yLTAuM2gtMC4yYy0wLjEgMC0wLjggMC43LTEuNCAxLjVsLTEyLjMgMTUuMmMtMC43IDAuOC0xLjggMi40LTIuNCAzLjNsLTkuNSAxNC4xYy0wLjYgMC45LTEuNSAyLjUtMiAzLjVsLTAuOCAyLjRjLTAuMiAxLjEtMC4zIDMtMC4zIDQuMSAwIDAgMCAwLjMgMC4zIDEuNSAwLjYgMiAyIDMuOSAyIDMuOSAwLjcgMC44IDEuOSAyLjMgMi43IDNsMjcuOSAyOS43YzAuOCAwLjggMSAyLjQgMC42IDMuNGwtNS44IDEzLjhjLTAuNCAxLTAuNSAyLjctMC4xIDMuOGwxLjYgNC4zYzEuMyAzLjYgMy42IDYuOCA2LjcgOS4zbDUuNyA0LjZjMC44IDAuNyAyLjQgMC45IDMuNCAwLjRsMTcuOS04LjVjMS0wLjUgMi41LTEuNSAzLjQtMi4zbDEyLjgtMTEuNmMxLjktMS43IDEuOS00LjYgMC4zLTYuNGwtMjYuOS0xOC4xYy0wLjktMC42LTEuMy0xLjktMC44LTNsMTEuOC0yMi4zYzAuNS0xIDAuNi0yLjYgMC4yLTMuNmwtMS40LTMuM2MtMC40LTEtMS43LTIuMi0yLjctMi42bC0zNC45LTEzYy0xLTAuNC0xLTAuOCAwLjEtMC45bDIyLjQtMi4xYzEuMS0wLjEgMi45IDAuMSA0IDAuM2wxOS45IDUuNmMxLjEgMC4zIDEuOCAxLjQgMS42IDIuNWwtNyAzNy44Yy0wLjIgMS4xLTAuMiAyLjYgMC4xIDMuNXMxLjMgMS42IDIuNCAxLjlsMTMuOCAzYzEuMSAwLjMgMi45IDAuMyA0IDBsMTIuOS0zYzEuMS0wLjMgMi4yLTEuMSAyLjQtMS45IDAuMy0wLjggMC4zLTIuNCAwLjEtMy41bC02LjgtMzcuOWMtMC4yLTEuMSAwLjUtMi4zIDEuNi0yLjVsMTkuOS01LjZjMS4xLTAuMyAyLjktMC40IDQtMC4zbDIyLjQgMi4xYzEuMSAwLjEgMS4yIDAuNSAwLjEgMC45bC0zNC43IDEzLjJjLTEgMC40LTIuMyAxLjUtMi43IDIuNmwtMS40IDMuM2MtMC40IDEtMC40IDIuNyAwLjIgMy42bDExLjkgMjIuM2MwLjUgMSAwLjIgMi4zLTAuOCAzbC0yNi45IDE4LjJjLTEuOCAxLjgtMS42IDQuNyAwLjMgNi40bDEyLjggMTEuNmMwLjggMC44IDIuNCAxLjggMy40IDIuMmwxOCA4LjVjMSAwLjUgMi41IDAuMyAzLjQtMC40bDUuNy00LjZjMy0yLjQgNS4zLTUuNyA2LjYtOS4zbDEuNi00LjNjMC40LTEgMC4zLTIuOC0wLjEtMy44bC01LjgtMTMuOGMtMC40LTEtMC4yLTIuNSAwLjYtMy40bDI3LjktMjkuN2MwLjgtMC44IDEuOS0yLjIgMi43LTMtMC40LTAuMyAxLjEtMi4xIDEuNi00LjF6Ii8+Cgo8L3N2Zz4K",
    magicEden: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjAwIDIwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8cmVjdCB4PSIwIiBmaWxsPSIjRTQyNTc1IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPgo8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTMxLjgsNzcuNWw4LjksMTAuNWMxLDEuMiwxLjksMi4xLDIuMywyLjdjMi43LDIuNyw0LjIsNi4yLDQuMiwxMGMtMC4zLDQuNC0zLjEsNy40LTUuOCwxMC42bC02LjMsNy4zCglsLTMuMywzLjhjLTAuMSwwLjEtMC4yLDAuMy0wLjIsMC41YzAsMC4yLDAsMC4zLDAuMSwwLjVjMC4xLDAuMiwwLjIsMC4zLDAuMywwLjRjMC4yLDAuMSwwLjMsMC4xLDAuNSwwLjFoMzIuNgoJYzUsMCwxMS4zLDQuMiwxMC45LDEwLjVjMCwyLjktMS4yLDUuNy0zLjMsNy43Yy0yLjEsMi00LjksMy4yLTcuOCwzLjJIMTE0Yy0zLjQsMC0xMi40LDAuNC0xNC45LTcuM2MtMC41LTEuNi0wLjYtMy4zLTAuMi01CgljMC43LTIuNCwxLjktNC43LDMuNC02LjhjMi42LTMuOCw1LjMtNy42LDguMS0xMS4zYzMuNS00LjgsNy4yLTkuNSwxMC43LTE0LjRjMC4xLTAuMiwwLjItMC40LDAuMi0wLjZjMC0wLjItMC4xLTAuNC0wLjItMC42CglsLTEzLTE1LjJjLTAuMS0wLjEtMC4yLTAuMi0wLjMtMC4zYy0wLjEtMC4xLTAuMy0wLjEtMC40LTAuMWMtMC4xLDAtMC4zLDAtMC40LDAuMWMtMC4xLDAuMS0wLjIsMC4yLTAuMywwLjMKCWMtMy41LDQuNi0xOC43LDI1LjEtMjEuOSwyOS4yYy0zLjIsNC4xLTExLjIsNC40LTE1LjcsMEw0OC44LDkzLjRjLTAuMS0wLjEtMC4zLTAuMi0wLjUtMC4zYy0wLjIsMC0wLjQsMC0wLjUsMC4xCgljLTAuMiwwLjEtMC4zLDAuMi0wLjQsMC4zYy0wLjEsMC4yLTAuMiwwLjMtMC4yLDAuNXYzOC42YzAsMi43LTAuOCw1LjQtMi40LDcuN2MtMS42LDIuMy0zLjgsNC02LjQsNC45Yy0xLjcsMC42LTMuNSwwLjctNS4yLDAuNQoJYy0xLjgtMC4yLTMuNC0wLjktNC45LTEuOWMtMS40LTEtMi42LTIuMy0zLjQtMy45Yy0wLjgtMS41LTEuMi0zLjMtMS4yLTVWNjUuNWMwLjEtMi41LDEtNC45LDIuNi02LjljMS42LTIsMy43LTMuNCw2LjItNC4xCgljMi4xLTAuNiw0LjMtMC41LDYuNCwwYzIuMSwwLjYsNCwxLjcsNS41LDMuMmwzMS4yLDMwLjhjMC4xLDAuMSwwLjIsMC4yLDAuMywwLjJjMC4xLDAsMC4zLDAuMSwwLjQsMC4xYzAuMSwwLDAuMy0wLjEsMC40LTAuMQoJYzAuMS0wLjEsMC4yLTAuMiwwLjMtMC4zbDIyLjItMzAuMmMxLTEuMiwyLjMtMi4yLDMuOC0yLjljMS41LTAuNywzLTEuMSw0LjctMS4xaDU3LjZjMS42LDAsMy4xLDAuMyw0LjYsMXMyLjcsMS42LDMuOCwyLjgKCWMxLDEuMiwxLjgsMi41LDIuMyw0YzAuNSwxLjUsMC42LDMuMSwwLjQsNC42Yy0wLjQsMi43LTEuOCw1LjEtMy45LDYuOXMtNC44LDIuNy03LjUsMi43aC0zMi4zYy0wLjIsMC0wLjMsMC4xLTAuNSwwLjEKCWMtMC4xLDAuMS0wLjIsMC4yLTAuMywwLjNjLTAuMSwwLjEtMC4xLDAuMy0wLjEsMC41UzEzMS43LDc3LjQsMTMxLjgsNzcuNXoiLz4KPC9zdmc+Cg==",
    okx: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI4LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAzMzYuMSAzMzYuMSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzM2LjEgMzM2LjE7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KPC9zdHlsZT4KPHBhdGggZD0iTTMxMy43LDBIMjIuNEMxMCwwLDAsMTAsMCwyMi40djI5MS4zYzAsMTIuNCwxMCwyMi40LDIyLjQsMjIuNGgyOTEuM2MxMi40LDAsMjIuNC0xMCwyMi40LTIyLjRWMjIuNAoJQzMzNi4xLDEwLDMyNi4xLDAsMzEzLjcsMHoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTIwNC41LDEzMC43aC02NC43Yy0yLjcsMC01LDIuMi01LDV2NjQuN2MwLDIuNywyLjIsNSw1LDVoNjQuN2MyLjcsMCw1LTIuMiw1LTV2LTY0LjcKCUMyMDkuNSwxMzIuOSwyMDcuMiwxMzAuNywyMDQuNSwxMzAuN3oiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTEyOS44LDU2LjFINjUuMWMtMi43LDAtNSwyLjItNSw1djY0LjdjMCwyLjcsMi4yLDUsNSw1aDY0LjdjMi44LDAsNS0yLjIsNS01VjYxCglDMTM0LjgsNTguMywxMzIuNSw1Ni4xLDEyOS44LDU2LjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yNzkuMSw1Ni4xaC02NC43Yy0yLjcsMC01LDIuMi01LDV2NjQuN2MwLDIuNywyLjIsNSw1LDVoNjQuN2MyLjcsMCw1LTIuMiw1LTVWNjEKCUMyODQuMSw1OC4zLDI4MS45LDU2LjEsMjc5LjEsNTYuMXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTEyOS44LDIwNS40SDY1LjFjLTIuNywwLTUsMi4yLTUsNXY2NC43YzAsMi43LDIuMiw1LDUsNWg2NC43YzIuOCwwLDUtMi4yLDUtNXYtNjQuNwoJQzEzNC44LDIwNy42LDEzMi41LDIwNS40LDEyOS44LDIwNS40eiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjc5LjEsMjA1LjRoLTY0LjdjLTIuNywwLTUsMi4yLTUsNXY2NC43YzAsMi43LDIuMiw1LDUsNWg2NC43YzIuNywwLDUtMi4yLDUtNXYtNjQuNwoJQzI4NC4xLDIwNy42LDI4MS45LDIwNS40LDI3OS4xLDIwNS40eiIvPgo8L3N2Zz4K",
  };

  function _optionalChain$l(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class BraveEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Brave',
      logo: logos.brave,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$l([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isBraveWallet]) };}

    getProvider() { 
      return window.ethereum
    }
  } BraveEVM.__initStatic(); BraveEVM.__initStatic2();

  function _optionalChain$k(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Coin98EVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Coin98',
      logo: logos.coin98,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$k([window, 'optionalAccess', _2 => _2.coin98]) };}

    getProvider() { return window.coin98.provider }
    
  } Coin98EVM.__initStatic(); Coin98EVM.__initStatic2();

  function _optionalChain$j(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class CoinbaseEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Coinbase',
      logo: logos.coinbase,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    getProvider() { 
      if(_optionalChain$j([window, 'optionalAccess', _9 => _9.ethereum, 'optionalAccess', _10 => _10.providerMap, 'optionalAccess', _11 => _11.has, 'call', _12 => _12('CoinbaseWallet')])) {
        return _optionalChain$j([window, 'optionalAccess', _13 => _13.ethereum, 'optionalAccess', _14 => _14.providerMap, 'optionalAccess', _15 => _15.get, 'call', _16 => _16('CoinbaseWallet')])
      } else {
        return window.ethereum
      }
    }

    static __initStatic2() {this.isAvailable = async()=>{ 
      return(
        (
          _optionalChain$j([window, 'optionalAccess', _17 => _17.ethereum, 'optionalAccess', _18 => _18.isCoinbaseWallet]) || _optionalChain$j([window, 'optionalAccess', _19 => _19.ethereum, 'optionalAccess', _20 => _20.isWalletLink])
        ) || (
          _optionalChain$j([window, 'optionalAccess', _21 => _21.ethereum, 'optionalAccess', _22 => _22.providerMap, 'optionalAccess', _23 => _23.has, 'call', _24 => _24('CoinbaseWallet')])
        )
      )
    };}
  } CoinbaseEVM.__initStatic(); CoinbaseEVM.__initStatic2();

  function _optionalChain$i(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class CryptoCom extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Crypto.com | DeFi Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA4OS45IDEwMi44IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA4OS45IDEwMi44IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNGRkZGRkY7fQoJLnN0MXtmaWxsOiMwMzMxNkM7fQo8L3N0eWxlPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuMzc1MSAtMTEzLjYxKSI+Cgk8ZyB0cmFuc2Zvcm09Im1hdHJpeCguMzE3OTQgMCAwIC4zMTQ2NSAtMS4wNDczIDMwLjQ0NykiPgoJCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Im0xNjEuNiAyNjQuMy0xNDEuNCA4MS42djE2My4zbDE0MS40IDgxLjYgMTQxLjQtODEuNnYtMTYzLjNsLTE0MS40LTgxLjZ6bTAgMC0xNDEuNCA4MS42djE2My4zbDE0MS40IDgxLjYgMTQxLjQtODEuNnYtMTYzLjNsLTE0MS40LTgxLjZ6Ii8+CgkJPHBhdGggY2xhc3M9InN0MSIgZD0ibTIxNy41IDUyNy4xaC0yMC4xbC0yNC4xLTIyLjF2LTExLjNsMjQuOS0yMy44di0zNy43bDMyLjYtMjEuMyAzNy4xIDI4LjEtNTAuNCA4OC4xem0tODMuMy01OS42IDMuNy0zNS40LTEyLjItMzEuN2g3MmwtMTEuOSAzMS43IDMuNCAzNS40aC01NXptMTYuNCAzNy41LTI0LjEgMjIuNGgtMjAuNGwtNTAuNy04OC40IDM3LjQtMjcuOCAzMi45IDIxdjM3LjdsMjQuOSAyMy44djExLjN6bS00NC44LTE3MC4xaDExMS40bDEzLjMgNTYuN2gtMTM3LjdsMTMtNTYuN3ptNTUuOC03MC42LTE0MS40IDgxLjZ2MTYzLjNsMTQxLjQgODEuNiAxNDEuNC04MS42di0xNjMuM2wtMTQxLjQtODEuNnoiLz4KCTwvZz4KPC9nPgo8L3N2Zz4K",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$i([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isDeficonnectProvider]) };}
  } CryptoCom.__initStatic(); CryptoCom.__initStatic2();

  function _optionalChain$h(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class ExodusEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Exodus',
      logo: logos.exodus,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$h([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isExodus]) };}
  } ExodusEVM.__initStatic(); ExodusEVM.__initStatic2();

  function _optionalChain$g(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class HyperPay extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'HyperPay',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjA0LjcgMjAwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyMDQuNyAyMDA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZmlsbD0iIzFBNzJGRSIgZD0iTTEwMi41LDUuMkM1MC44LDUuMiw4LjgsNDcuMiw4LjgsOTlzNDIsOTMuNSw5My44LDkzLjVzOTMuOC00Miw5My44LTkzLjhTMTU0LjIsNS4yLDEwMi41LDUuMnogTTEyNy4yLDExOS4yCgljLTYuMiwwLTIxLjcsMC4zLTIxLjcsMC4zbC03LDI3aC0yOWw2LjgtMjYuNUgzMWw3LjItMjEuOGMwLDAsNzguOCwwLjIsODUuMiwwYzYuNS0wLjIsMTYuNS0xLjgsMTYuOC0xNC44YzAuMy0xNy44LTI3LTE2LjgtMjkuMi0xCgljLTEuNSwxMC0xLjUsMTIuNS0xLjUsMTIuNUg4My44bDUtMjMuNUg0N2w2LjMtMjJjMCwwLDYxLjIsMC4yLDcyLjgsMC4yczQyLjIsMyw0Mi4yLDMxLjJDMTY4LjIsMTEyLDEzOC41LDExOS4zLDEyNy4yLDExOS4yCglMMTI3LjIsMTE5LjJ6Ii8+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$g([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isHyperPay]) };}
  } HyperPay.__initStatic(); HyperPay.__initStatic2();

  function _optionalChain$f(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class MagicEdenEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Magic Eden',
      logo: logos.magicEden,
      blockchains: ['ethereum', 'polygon'],
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        _optionalChain$f([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isMagicEden])
      )
    };}
  } MagicEdenEVM.__initStatic(); MagicEdenEVM.__initStatic2();

  function _optionalChain$e(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class MetaMask extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'MetaMask',
      logo: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0ODUuOTMgNDUwLjU2Jz48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzgyODQ4Nzt9LmNscy0ye2ZpbGw6I2UyNzcyNjtzdHJva2U6I2UyNzcyNjt9LmNscy0xMCwuY2xzLTExLC5jbHMtMiwuY2xzLTMsLmNscy00LC5jbHMtNSwuY2xzLTYsLmNscy03LC5jbHMtOCwuY2xzLTl7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTN7ZmlsbDojZTM3NzI1O3N0cm9rZTojZTM3NzI1O30uY2xzLTR7ZmlsbDojZDZjMGIzO3N0cm9rZTojZDZjMGIzO30uY2xzLTV7ZmlsbDojMjQzNDQ3O3N0cm9rZTojMjQzNDQ3O30uY2xzLTZ7ZmlsbDojY2Q2MzI4O3N0cm9rZTojY2Q2MzI4O30uY2xzLTd7ZmlsbDojZTM3NTI1O3N0cm9rZTojZTM3NTI1O30uY2xzLTh7ZmlsbDojZjY4NTFmO3N0cm9rZTojZjY4NTFmO30uY2xzLTl7ZmlsbDojYzFhZTllO3N0cm9rZTojYzFhZTllO30uY2xzLTEwe2ZpbGw6IzE3MTcxNztzdHJva2U6IzE3MTcxNzt9LmNscy0xMXtmaWxsOiM3NjNlMWE7c3Ryb2tlOiM3NjNlMWE7fTwvc3R5bGU+PC9kZWZzPjxwYXRoIGNsYXNzPSdjbHMtMScgZD0nTTI0Ny45MSwzNTYuMjlhMjYsMjYsMCwxLDAtMjYsMjZBMjYsMjYsMCwwLDAsMjQ3LjkxLDM1Ni4yOVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03Ljk3IC0yMS4zMyknLz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNDYuNTUsMTQ5LjcxYTI2LDI2LDAsMSwwLTI2LDI2QTI2LDI2LDAsMCwwLDI0Ni41NSwxNDkuNzFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNy45NyAtMjEuMzMpJy8+PGNpcmNsZSBjbGFzcz0nY2xzLTEnIGN4PScxNDguNCcgY3k9JzIzMC4wNScgcj0nMjUuOTknLz48cG9seWdvbiBjbGFzcz0nY2xzLTInIHBvaW50cz0nNDYxLjI4IDAuNSAyNzIuMDYgMTQxLjAzIDMwNy4wNSA1OC4xMiA0NjEuMjggMC41Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzI0LjQ2IDAuNSAyMTIuMTYgMTQyLjM3IDE3OC44OCA1OC4xMiAyNC40NiAwLjUnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMzkzLjIgMzI2LjI2IDM0Mi44MSA0MDMuNDcgNDUwLjYzIDQzMy4xNCA0ODEuNjMgMzI3Ljk3IDM5My4yIDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPSc0LjQ5IDMyNy45NyAzNS4zIDQzMy4xNCAxNDMuMTMgNDAzLjQ3IDkyLjczIDMyNi4yNiA0LjQ5IDMyNy45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPScxMzcuMDQgMTk1LjggMTA3IDI0MS4yNSAyMTQuMDYgMjQ2LjAxIDIxMC4yNiAxMzAuOTYgMTM3LjA0IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzM0OC43IDE5NS44IDI3NC41MyAxMjkuNjMgMjcyLjA2IDI0Ni4wMSAzNzguOTQgMjQxLjI1IDM0OC43IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzE0My4xMyA0MDMuNDcgMjA3LjQxIDM3Mi4wOSAxNTEuODggMzI4LjczIDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAzNDIuODEgNDAzLjQ3IDMzMy44NyAzMjguNzMgMjc4LjM0IDM3Mi4wOScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPSczNDIuODEgNDAzLjQ3IDI3OC4zNCAzNzIuMDkgMjgzLjQ3IDQxNC4xMiAyODIuOSA0MzEuODEgMzQyLjgxIDQwMy40NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPScxNDMuMTMgNDAzLjQ3IDIwMy4wMyA0MzEuODEgMjAyLjY1IDQxNC4xMiAyMDcuNDEgMzcyLjA5IDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTUnIHBvaW50cz0nMjAzLjk4IDMwMC45NyAxNTAuMzUgMjg1LjE4IDE4OC4yIDI2Ny44OCAyMDMuOTggMzAwLjk3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy01JyBwb2ludHM9JzI4MS43NiAzMDAuOTcgMjk3LjU1IDI2Ny44OCAzMzUuNTggMjg1LjE4IDI4MS43NiAzMDAuOTcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTYnIHBvaW50cz0nMTQzLjEzIDQwMy40NyAxNTIuMjUgMzI2LjI2IDkyLjczIDMyNy45NyAxNDMuMTMgNDAzLjQ3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy02JyBwb2ludHM9JzMzMy42OCAzMjYuMjYgMzQyLjgxIDQwMy40NyAzOTMuMiAzMjcuOTcgMzMzLjY4IDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPSczNzguOTQgMjQxLjI1IDI3Mi4wNiAyNDYuMDEgMjgxLjk1IDMwMC45NyAyOTcuNzQgMjY3Ljg4IDMzNS43NyAyODUuMTggMzc4Ljk0IDI0MS4yNScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE4OC4zOSAyNjcuODggMjAzLjk4IDMwMC45NyAyMTQuMDYgMjQ2LjAxIDEwNyAyNDEuMjUgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNycgcG9pbnRzPScxMDcgMjQxLjI1IDE1MS44OCAzMjguNzMgMTUwLjM1IDI4NS4xOCAxMDcgMjQxLjI1Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzMzNS43NyAyODUuMTggMzMzLjg3IDMyOC43MyAzNzguOTQgMjQxLjI1IDMzNS43NyAyODUuMTgnLz48cG9seWdvbiBjbGFzcz0nY2xzLTcnIHBvaW50cz0nMjE0LjA2IDI0Ni4wMSAyMDMuOTggMzAwLjk3IDIxNi41MyAzNjUuODIgMjE5LjM4IDI4MC40MyAyMTQuMDYgMjQ2LjAxJy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzI3Mi4wNiAyNDYuMDEgMjY2LjkzIDI4MC4yNCAyNjkuMjEgMzY1LjgyIDI4MS45NSAzMDAuOTcgMjcyLjA2IDI0Ni4wMScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyODEuOTUgMzAwLjk3IDI2OS4yMSAzNjUuODIgMjc4LjM0IDM3Mi4wOSAzMzMuODcgMzI4LjczIDMzNS43NyAyODUuMTggMjgxLjk1IDMwMC45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE1MS44OCAzMjguNzMgMjA3LjQxIDM3Mi4wOSAyMTYuNTMgMzY1LjgyIDIwMy45OCAzMDAuOTcgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOScgcG9pbnRzPScyODIuOSA0MzEuODEgMjgzLjQ3IDQxNC4xMiAyNzguNzIgNDA5Ljk0IDIwNy4wMiA0MDkuOTQgMjAyLjY1IDQxNC4xMiAyMDMuMDMgNDMxLjgxIDE0My4xMyA0MDMuNDcgMTY0LjA1IDQyMC41OCAyMDYuNDUgNDUwLjA2IDI3OS4yOSA0NTAuMDYgMzIxLjg5IDQyMC41OCAzNDIuODEgNDAzLjQ3IDI4Mi45IDQzMS44MScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTAnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAyNjkuMjEgMzY1LjgyIDIxNi41MyAzNjUuODIgMjA3LjQxIDM3Mi4wOSAyMDIuNjUgNDE0LjEyIDIwNy4wMiA0MDkuOTQgMjc4LjcyIDQwOS45NCAyODMuNDcgNDE0LjEyIDI3OC4zNCAzNzIuMDknLz48cG9seWdvbiBjbGFzcz0nY2xzLTExJyBwb2ludHM9JzQ2OS4yNyAxNTAuMTYgNDg1LjQzIDcyLjU3IDQ2MS4yOCAwLjUgMjc4LjM0IDEzNi4yOCAzNDguNyAxOTUuOCA0NDguMTYgMjI0LjkgNDcwLjIyIDE5OS4yMyA0NjAuNzEgMTkyLjM4IDQ3NS45MiAxNzguNSA0NjQuMTMgMTY5LjM3IDQ3OS4zNSAxNTcuNzcgNDY5LjI3IDE1MC4xNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTEnIHBvaW50cz0nMC41IDcyLjU3IDE2LjY2IDE1MC4xNiA2LjM5IDE1Ny43NyAyMS42MSAxNjkuMzcgMTAuMDEgMTc4LjUgMjUuMjIgMTkyLjM4IDE1LjcxIDE5OS4yMyAzNy41OCAyMjQuOSAxMzcuMDQgMTk1LjggMjA3LjQxIDEzNi4yOCAyNC40NiAwLjUgMC41IDcyLjU3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzQ0OC4xNiAyMjQuOSAzNDguNyAxOTUuOCAzNzguOTQgMjQxLjI1IDMzMy44NyAzMjguNzMgMzkzLjIgMzI3Ljk3IDQ4MS42MyAzMjcuOTcgNDQ4LjE2IDIyNC45Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzEzNy4wNCAxOTUuOCAzNy41OCAyMjQuOSA0LjQ5IDMyNy45NyA5Mi43MyAzMjcuOTcgMTUxLjg4IDMyOC43MyAxMDcgMjQxLjI1IDEzNy4wNCAxOTUuOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyNzIuMDYgMjQ2LjAxIDI3OC4zNCAxMzYuMjggMzA3LjI0IDU4LjEyIDE3OC44OCA1OC4xMiAyMDcuNDEgMTM2LjI4IDIxNC4wNiAyNDYuMDEgMjE2LjM0IDI4MC42MiAyMTYuNTMgMzY1LjgyIDI2OS4yMSAzNjUuODIgMjY5LjU5IDI4MC42MiAyNzIuMDYgMjQ2LjAxJy8+PC9zdmc+",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isMetaMask = (provider)=> {
      return(
        _optionalChain$e([provider, 'optionalAccess', _3 => _3.isMetaMask]) &&
        Object.keys(provider).filter((key)=>key.match(/^is(?!Connected)(?!PocketUniverse)(?!WalletGuard)(?!RevokeCash)/)).length == 1
      )
    };}

    static __initStatic3() {this.getEip6963Provider = ()=>{
      return window['_eip6963Providers'] ? Object.values(window['_eip6963Providers']).find((provider)=>{
        return MetaMask.isMetaMask(provider)
      }) : undefined
    };}

    static __initStatic4() {this.isAvailable = async()=>{
      return(
        MetaMask.getEip6963Provider() ||
        MetaMask.isMetaMask(_optionalChain$e([window, 'optionalAccess', _4 => _4.ethereum]))
      )
    };}

    getProvider() {
      return MetaMask.getEip6963Provider() || (MetaMask.isMetaMask(_optionalChain$e([window, 'optionalAccess', _5 => _5.ethereum])) && _optionalChain$e([window, 'optionalAccess', _6 => _6.ethereum]))
    }
  } MetaMask.__initStatic(); MetaMask.__initStatic2(); MetaMask.__initStatic3(); MetaMask.__initStatic4();

  function _optionalChain$d(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class OKXEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'OKX',
      logo: logos.okx,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        _optionalChain$d([window, 'optionalAccess', _2 => _2.okxwallet])
      )
    };}
  } OKXEVM.__initStatic(); OKXEVM.__initStatic2();

  function _optionalChain$c(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Opera extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Opera',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA3NS42IDc1LjYiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMyAwIDAgLTEuMzMzMyAwIDEwNy4yKSI+CiAgCiAgPGxpbmVhckdyYWRpZW50IGlkPSJvcGVyYUxvZ28wMDAwMDAxMjM1MTEiIHgxPSItMTA3LjM0IiB4Mj0iLTEwNi4zNCIgeTE9Ii0xMzcuODUiIHkyPSItMTM3Ljg1IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAgLTczLjI1NyAtNzMuMjU3IDAgLTEwMDc1IC03Nzg0LjEpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRkYxQjJEIiBvZmZzZXQ9IjAiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjFCMkQiIG9mZnNldD0iLjMiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjFCMkQiIG9mZnNldD0iLjYxNCIvPgogICAgPHN0b3Agc3RvcC1jb2xvcj0iI0E3MDAxNCIgb2Zmc2V0PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICAKICA8cGF0aCBmaWxsPSJ1cmwoI29wZXJhTG9nbzAwMDAwMDEyMzUxMSkiIGQ9Im0yOC4zIDgwLjRjLTE1LjYgMC0yOC4zLTEyLjctMjguMy0yOC4zIDAtMTUuMiAxMi0yNy42IDI3LTI4LjNoMS40YzcuMyAwIDEzLjkgMi43IDE4LjkgNy4yLTMuMy0yLjItNy4yLTMuNS0xMS40LTMuNS02LjggMC0xMi44IDMuMy0xNi45IDguNi0zLjEgMy43LTUuMiA5LjItNS4zIDE1LjN2MS4zYzAuMSA2LjEgMi4yIDExLjYgNS4zIDE1LjMgNC4xIDUuMyAxMC4xIDguNiAxNi45IDguNiA0LjIgMCA4LTEuMyAxMS40LTMuNS01IDQuNS0xMS42IDcuMi0xOC44IDcuMi0wLjEgMC4xLTAuMSAwLjEtMC4yIDAuMXoiLz4KICAKICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9Ii0xMDcuMDYiIHgyPSItMTA2LjA2IiB5MT0iLTEzOC4wNCIgeTI9Ii0xMzguMDQiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMCAtNjQuNzkyIC02NC43OTIgMCAtODkwNi4yIC02ODYwLjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBzdG9wLWNvbG9yPSIjOUMwMDAwIiBvZmZzZXQ9IjAiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjRCNEIiIG9mZnNldD0iLjciLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjRCNEIiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHBhdGggZD0ibTE5IDY4YzIuNiAzLjEgNiA0LjkgOS42IDQuOSA4LjMgMCAxNC45LTkuNCAxNC45LTIwLjlzLTYuNy0yMC45LTE0LjktMjAuOWMtMy43IDAtNyAxLjktOS42IDQuOSA0LjEtNS4zIDEwLjEtOC42IDE2LjktOC42IDQuMiAwIDggMS4zIDExLjQgMy41IDUuOCA1LjIgOS41IDEyLjcgOS41IDIxLjFzLTMuNyAxNS45LTkuNSAyMS4xYy0zLjMgMi4yLTcuMiAzLjUtMTEuNCAzLjUtNi44IDAuMS0xMi44LTMuMy0xNi45LTguNiIgZmlsbD0idXJsKCNiKSIvPgo8L2c+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$c([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isOpera]) };}
  } Opera.__initStatic(); Opera.__initStatic2();

  function _optionalChain$b(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class PhantomEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Phantom',
      logo: logos.phantom,
      blockchains: ['ethereum', 'polygon'],
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        window.phantom &&
        window.phantom.ethereum &&
        ! _optionalChain$b([window, 'optionalAccess', _4 => _4.ethereum, 'optionalAccess', _5 => _5.isMagicEden]) &&
        ! _optionalChain$b([window, 'optionalAccess', _6 => _6.okxwallet])
      )
    };}

    getProvider() { 
      return _optionalChain$b([window, 'optionalAccess', _7 => _7.phantom, 'optionalAccess', _8 => _8.ethereum]) || window.ethereum
    }
  } PhantomEVM.__initStatic(); PhantomEVM.__initStatic2();

  function _optionalChain$a(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Rabby extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Rabby',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9ImthdG1hbl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjA0IDE1MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjA0IDE1MjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDF7ZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMTE4MzY5MTkwNjY5MjcyNDcwNjgwMDAwMDE1NjE0NDY3MTMxNjE1Mjc5NDkxXyk7fQoJLnN0MntmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjU1ZHSURfMDAwMDAwNjU3Nzc0NTQ3NDc4MDEzNzcwNTAwMDAwMDcwMDM5OTUyODQ2NDY5NTk3NzVfKTt9Cgkuc3Qze2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDA5MTY5NjU3NTkzMjA0MzQxNTM5MDAwMDAwMTAyMTU2NDM5MjA1MDA3ODg1Nl8pO30KPC9zdHlsZT4KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI3MS4zNDE4IiB5MT0iNDE5LjA4NjkiIHgyPSIxNzUuMjg4MSIgeTI9IjQ0OC41NjQxIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMCAtMzQ2KSI+Cgk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojODc5N0ZGIi8+Cgk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojQUFBOEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNzYuNCw4NS40YzUuOS0xMy4yLTIzLjMtNTAuMS01MS4yLTY1LjNDMTA3LjUsOC4xLDg5LjMsOS43LDg1LjUsMTVjLTguMSwxMS40LDI3LDIxLjMsNTAuNCwzMi41CgljLTUuMSwyLjItOS44LDYuMi0xMi41LDExLjFDMTE0LjcsNDksOTUuNSw0MC44LDczLDQ3LjVjLTE1LjIsNC40LTI3LjgsMTUuMS0zMi43LDMwLjljLTEuMS0wLjUtMi41LTAuOC0zLjgtMC44CgljLTUuMiwwLTkuNSw0LjMtOS41LDkuNWMwLDUuMiw0LjMsOS41LDkuNSw5LjVjMSwwLDQtMC42LDQtMC42bDQ4LjgsMC4zYy0xOS41LDMxLjEtMzUsMzUuNS0zNSw0MC45czE0LjcsNCwyMC4zLDEuOQoJYzI2LjYtOS41LDU1LjItMzkuNSw2MC4xLTQ4LjFDMTU1LjMsOTMuOCwxNzIuNSw5My45LDE3Ni40LDg1LjR6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMDAwMDAwMzg0MDY0NTAzNDY5MjQ4NjkzNTAwMDAwMDA5NDQzOTczMDQwMTQ3OTk1NDdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE1My45OTAyIiB5MT0iNDIxLjM0NzQiIHgyPSI3OC45ODgzIiB5Mj0iMzQ2LjE2MTgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAwIC0zNDYpIj4KCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzQjIyQTAiLz4KCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MTU2RDg7c3RvcC1vcGFjaXR5OjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDAzODQwNjQ1MDM0NjkyNDg2OTM1MDAwMDAwMDk0NDM5NzMwNDAxNDc5OTU0N18pOyIgZD0iCglNMTM2LjEsNDcuNUwxMzYuMSw0Ny41YzEuMS0wLjUsMS0yLjEsMC42LTMuM2MtMC42LTIuOS0xMi41LTE0LjYtMjMuNi0xOS44Yy0xNS4yLTcuMS0yNi4zLTYuOC0yNy45LTMuNWMzLDYuMywxNy40LDEyLjIsMzIuNCwxOC42CglDMTIzLjcsNDEuOSwxMzAuMiw0NC42LDEzNi4xLDQ3LjVMMTM2LjEsNDcuNXoiLz4KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8wMDAwMDE0NzIyMDY3MjYxNTU0Nzk0MjI0MDAwMDAxMTg5NDM0ODEwNDAwNzM1NDA0NF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTE4Ljc4NjUiIHkxPSI0NTkuOTQ1OSIgeDI9IjQ2LjczODgiIHkyPSI0MTguNTIzNiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDAgLTM0NikiPgoJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNCMUU4RiIvPgoJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzZBNkZGQjtzdG9wLW9wYWNpdHk6MCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cGF0aCBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMTQ3MjIwNjcyNjE1NTQ3OTQyMjQwMDAwMDExODk0MzQ4MTA0MDA3MzU0MDQ0Xyk7IiBkPSIKCU0xMTYuNywxMTEuMmMtMy0xLjEtNi41LTIuMi0xMC41LTMuMmM0LjEtNy41LDUuMS0xOC43LDEuMS0yNS43Yy01LjYtOS44LTEyLjUtMTUuMS0yOC45LTE1LjFjLTguOSwwLTMzLDMtMzMuNSwyMy4yCgljMCwyLjEsMCw0LDAuMiw1LjlsNDQuMSwwYy01LjksOS40LTExLjQsMTYuMy0xNi4zLDIxLjZjNS45LDEuNCwxMC42LDIuNywxNS4xLDRjNC4xLDEuMSw4LjEsMi4xLDEyLjEsMy4yCglDMTA2LjEsMTIwLjYsMTExLjgsMTE1LjgsMTE2LjcsMTExLjJ6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMDAwMDAxMjg0NzQ1MTgwNjUxMjc5MDc2OTAwMDAwMDg3OTM1NDY5MjM0OTg1OTA4NjFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjY2LjM2MDQiIHkxPSI0MjcuNjAyIiB4Mj0iMTE1LjA1OTMiIHkyPSI0ODkuNDc5MiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDAgLTM0NikiPgoJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6Izg4OThGRiIvPgoJPHN0b3AgIG9mZnNldD0iMC45ODM5IiBzdHlsZT0ic3RvcC1jb2xvcjojNUY0N0YxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIHN0eWxlPSJmaWxsOnVybCgjU1ZHSURfMDAwMDAxMjg0NzQ1MTgwNjUxMjc5MDc2OTAwMDAwMDg3OTM1NDY5MjM0OTg1OTA4NjFfKTsiIGQ9Ik0zOS43LDkzLjljMS43LDE1LjIsMTAuNSwyMS4zLDI4LjIsMjMKCWMxNy44LDEuNywyNy45LDAuNiw0MS40LDEuN2MxMS4zLDEsMjEuNCw2LjgsMjUuMSw0LjhjMy4zLTEuNywxLjQtOC4yLTMtMTIuNGMtNS45LTUuNC0xNC05LTI4LjEtMTAuNWMyLjktNy44LDIuMS0xOC43LTIuNC0yNC42CgljLTYuMy04LjYtMTguMS0xMi40LTMzLTEwLjhDNTIuMyw2Ny4xLDM3LjQsNzQuOSwzOS43LDkzLjl6Ii8+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ 
      return(
        _optionalChain$a([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isRabby])
      )
    };}
  } Rabby.__initStatic(); Rabby.__initStatic2();

  function _optionalChain$9(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Rainbow extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Rainbow',
      logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNjJfMzI5KSIvPgo8cGF0aCBkPSJNMjAgMzhIMjZDNTYuOTI3OSAzOCA4MiA2My4wNzIxIDgyIDk0VjEwMEg5NEM5Ny4zMTM3IDEwMCAxMDAgOTcuMzEzNyAxMDAgOTRDMTAwIDUzLjEzMDkgNjYuODY5MSAyMCAyNiAyMEMyMi42ODYzIDIwIDIwIDIyLjY4NjMgMjAgMjZWMzhaIiBmaWxsPSJ1cmwoI3BhaW50MV9yYWRpYWxfNjJfMzI5KSIvPgo8cGF0aCBkPSJNODQgOTRIMTAwQzEwMCA5Ny4zMTM3IDk3LjMxMzcgMTAwIDk0IDEwMEg4NFY5NFoiIGZpbGw9InVybCgjcGFpbnQyX2xpbmVhcl82Ml8zMjkpIi8+CjxwYXRoIGQ9Ik0yNiAyMEwyNiAzNkgyMEwyMCAyNkMyMCAyMi42ODYzIDIyLjY4NjMgMjAgMjYgMjBaIiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfNjJfMzI5KSIvPgo8cGF0aCBkPSJNMjAgMzZIMjZDNTguMDMyNSAzNiA4NCA2MS45Njc1IDg0IDk0VjEwMEg2NlY5NEM2NiA3MS45MDg2IDQ4LjA5MTQgNTQgMjYgNTRIMjBWMzZaIiBmaWxsPSJ1cmwoI3BhaW50NF9yYWRpYWxfNjJfMzI5KSIvPgo8cGF0aCBkPSJNNjggOTRIODRWMTAwSDY4Vjk0WiIgZmlsbD0idXJsKCNwYWludDVfbGluZWFyXzYyXzMyOSkiLz4KPHBhdGggZD0iTTIwIDUyTDIwIDM2TDI2IDM2TDI2IDUySDIwWiIgZmlsbD0idXJsKCNwYWludDZfbGluZWFyXzYyXzMyOSkiLz4KPHBhdGggZD0iTTIwIDYyQzIwIDY1LjMxMzcgMjIuNjg2MyA2OCAyNiA2OEM0MC4zNTk0IDY4IDUyIDc5LjY0MDYgNTIgOTRDNTIgOTcuMzEzNyA1NC42ODYzIDEwMCA1OCAxMDBINjhWOTRDNjggNzAuODA0IDQ5LjE5NiA1MiAyNiA1MkgyMFY2MloiIGZpbGw9InVybCgjcGFpbnQ3X3JhZGlhbF82Ml8zMjkpIi8+CjxwYXRoIGQ9Ik01MiA5NEg2OFYxMDBINThDNTQuNjg2MyAxMDAgNTIgOTcuMzEzNyA1MiA5NFoiIGZpbGw9InVybCgjcGFpbnQ4X3JhZGlhbF82Ml8zMjkpIi8+CjxwYXRoIGQ9Ik0yNiA2OEMyMi42ODYzIDY4IDIwIDY1LjMxMzcgMjAgNjJMMjAgNTJMMjYgNTJMMjYgNjhaIiBmaWxsPSJ1cmwoI3BhaW50OV9yYWRpYWxfNjJfMzI5KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzYyXzMyOSIgeDE9IjYwIiB5MT0iMCIgeDI9IjYwIiB5Mj0iMTIwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMxNzQyOTkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDAxRTU5Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQxX3JhZGlhbF82Ml8zMjkiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjYgOTQpIHJvdGF0ZSgtOTApIHNjYWxlKDc0KSI+CjxzdG9wIG9mZnNldD0iMC43NzAyNzciIHN0b3AtY29sb3I9IiNGRjQwMDAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjODc1NEM5Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQyX2xpbmVhcl82Ml8zMjkiIHgxPSI4MyIgeTE9Ijk3IiB4Mj0iMTAwIiB5Mj0iOTciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZGNDAwMCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4NzU0QzkiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDNfbGluZWFyXzYyXzMyOSIgeDE9IjIzIiB5MT0iMjAiIHgyPSIyMyIgeTI9IjM3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4NzU0QzkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkY0MDAwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ0X3JhZGlhbF82Ml8zMjkiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjYgOTQpIHJvdGF0ZSgtOTApIHNjYWxlKDU4KSI+CjxzdG9wIG9mZnNldD0iMC43MjM5MjkiIHN0b3AtY29sb3I9IiNGRkY3MDAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkY5OTAxIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ1X2xpbmVhcl82Ml8zMjkiIHgxPSI2OCIgeTE9Ijk3IiB4Mj0iODQiIHkyPSI5NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkZGNzAwIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGOTkwMSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Nl9saW5lYXJfNjJfMzI5IiB4MT0iMjMiIHkxPSI1MiIgeDI9IjIzIiB5Mj0iMzYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZGRjcwMCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjk5MDEiLz4KPC9saW5lYXJHcmFkaWVudD4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDdfcmFkaWFsXzYyXzMyOSIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyNiA5NCkgcm90YXRlKC05MCkgc2NhbGUoNDIpIj4KPHN0b3Agb2Zmc2V0PSIwLjU5NTEzIiBzdG9wLWNvbG9yPSIjMDBBQUZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAxREE0MCIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50OF9yYWRpYWxfNjJfMzI5IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDUxIDk3KSBzY2FsZSgxNyA0NS4zMzMzKSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwMEFBRkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDFEQTQwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ5X3JhZGlhbF82Ml8zMjkiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMgNjkpIHJvdGF0ZSgtOTApIHNjYWxlKDE3IDMyMi4zNykiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDBBQUZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAxREE0MCIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.getEip6963Provider = ()=>{
      return window['_eip6963Providers'] ? Object.values(window['_eip6963Providers']).find((provider)=>{
        return _optionalChain$9([provider, 'optionalAccess', _4 => _4.isRainbow])
      }) : undefined
    };}

    static __initStatic3() {this.isAvailable = async()=>{
      return(
        Rainbow.getEip6963Provider() ||
        _optionalChain$9([window, 'optionalAccess', _5 => _5.rainbow, 'optionalAccess', _6 => _6.isRainbow])
      )
    };}

    getProvider() {
      return Rainbow.getEip6963Provider() || _optionalChain$9([window, 'optionalAccess', _7 => _7.rainbow])
    }

  } Rainbow.__initStatic(); Rainbow.__initStatic2(); Rainbow.__initStatic3();

  function _optionalChain$8(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class TokenPocket extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'TP Wallet (TokenPocket)',
      logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8bWFzayBpZD0ibWFzazBfNDA4XzIyNSIgc3R5bGU9Im1hc2stdHlwZTphbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCI+CjxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IiNDNEM0QzQiLz4KPC9tYXNrPgo8ZyBtYXNrPSJ1cmwoI21hc2swXzQwOF8yMjUpIj4KPHBhdGggZD0iTTEwNDEuNTIgMEgtMjdWMTAyNEgxMDQxLjUyVjBaIiBmaWxsPSIjMjk4MEZFIi8+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF80MDhfMjI1KSI+CjxwYXRoIGQ9Ik00MDYuNzk2IDQzOC42NDNINDA2LjkyN0M0MDYuNzk2IDQzNy44NTcgNDA2Ljc5NiA0MzYuOTQgNDA2Ljc5NiA0MzYuMTU0VjQzOC42NDNaIiBmaWxsPSIjMjlBRUZGIi8+CjxwYXRoIGQ9Ik02NjcuNjAyIDQ2My41MzNINTIzLjI0OVY3MjQuMDc2QzUyMy4yNDkgNzM2LjM4OSA1MzMuMjA0IDc0Ni4zNDUgNTQ1LjUxNyA3NDYuMzQ1SDY0NS4zMzNDNjU3LjY0NyA3NDYuMzQ1IDY2Ny42MDIgNzM2LjM4OSA2NjcuNjAyIDcyNC4wNzZWNDYzLjUzM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00NTMuNTYzIDI3N0g0NDguNzE2SDE5MC4yNjlDMTc3Ljk1NSAyNzcgMTY4IDI4Ni45NTUgMTY4IDI5OS4yNjlWMzg5LjY1M0MxNjggNDAxLjk2NyAxNzcuOTU1IDQxMS45MjIgMTkwLjI2OSA0MTEuOTIySDI1MC45MThIMjc1LjAyMVY0MzguNjQ0VjcyNC43MzFDMjc1LjAyMSA3MzcuMDQ1IDI4NC45NzYgNzQ3IDI5Ny4yODkgNzQ3SDM5Mi4xMjhDNDA0LjQ0MSA3NDcgNDE0LjM5NiA3MzcuMDQ1IDQxNC4zOTYgNzI0LjczMVY0MzguNjQ0VjQzNi4xNTZWNDExLjkyMkg0MzguNDk5SDQ0OC4zMjNINDUzLjE3QzQ5MC4zNzIgNDExLjkyMiA1MjAuNjMxIDM4MS42NjMgNTIwLjYzMSAzNDQuNDYxQzUyMS4wMjQgMzA3LjI1OSA0OTAuNzY1IDI3NyA0NTMuNTYzIDI3N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02NjcuNzM1IDQ2My41MzNWNjQ1LjM1QzY3Mi43MTMgNjQ2LjUyOSA2NzcuODIxIDY0Ny40NDYgNjgzLjA2MSA2NDguMjMyQzY5MC4zOTcgNjQ5LjI4IDY5Ny45OTQgNjQ5LjkzNSA3MDUuNTkyIDY1MC4wNjZDNzA1Ljk4NSA2NTAuMDY2IDcwNi4zNzggNjUwLjA2NiA3MDYuOTAyIDY1MC4wNjZWNTA1LjQ1QzY4NS4wMjYgNTA0LjAwOSA2NjcuNzM1IDQ4NS44MDEgNjY3LjczNSA0NjMuNTMzWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzQwOF8yMjUpIi8+CjxwYXRoIGQ9Ik03MDkuNzgxIDI3N0M2MDYuODIyIDI3NyA1MjMuMjQ5IDM2MC41NzMgNTIzLjI0OSA0NjMuNTMzQzUyMy4yNDkgNTUyLjA4NCA1ODQuOTQ2IDYyNi4yMjUgNjY3LjczMyA2NDUuMzVWNDYzLjUzM0M2NjcuNzMzIDQ0MC4zNDcgNjg2LjU5NiA0MjEuNDg0IDcwOS43ODEgNDIxLjQ4NEM3MzIuOTY3IDQyMS40ODQgNzUxLjgzIDQ0MC4zNDcgNzUxLjgzIDQ2My41MzNDNzUxLjgzIDQ4My4wNTEgNzM4LjYgNDk5LjQyNSA3MjAuNTIzIDUwNC4xNEM3MTcuMTE3IDUwNS4wNTcgNzEzLjQ0OSA1MDUuNTgxIDcwOS43ODEgNTA1LjU4MVY2NTAuMDY2QzcxMy40NDkgNjUwLjA2NiA3MTYuOTg2IDY0OS45MzUgNzIwLjUyMyA2NDkuODA0QzgxOC41MDUgNjQ0LjE3MSA4OTYuMzE0IDU2Mi45NTYgODk2LjMxNCA0NjMuNTMzQzg5Ni40NDUgMzYwLjU3MyA4MTIuODcyIDI3NyA3MDkuNzgxIDI3N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03MDkuNzggNjUwLjA2NlY1MDUuNTgxQzcwOC43MzMgNTA1LjU4MSA3MDcuODE2IDUwNS41ODEgNzA2Ljc2OCA1MDUuNDVWNjUwLjA2NkM3MDcuODE2IDY1MC4wNjYgNzA4Ljg2NCA2NTAuMDY2IDcwOS43OCA2NTAuMDY2WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNDA4XzIyNSIgeDE9IjcwOS44NDQiIHkxPSI1NTYuODI3IiB4Mj0iNjY3Ljc1MyIgeTI9IjU1Ni44MjciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0id2hpdGUiLz4KPHN0b3Agb2Zmc2V0PSIwLjk2NjciIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjAuMzIzMyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjAuMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzQwOF8yMjUiPgo8cmVjdCB3aWR0aD0iNzI4LjQ0OCIgaGVpZ2h0PSI0NzAiIGZpbGw9IndoaXRlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNjggMjc3KSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        _optionalChain$8([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isTokenPocket])
      )
    };}
  } TokenPocket.__initStatic(); TokenPocket.__initStatic2();

  function _optionalChain$7(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class TrustEVM extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Trust Wallet',
      logo: logos.trust,
      blockchains: supported$1.evm,
      platform: 'evm',
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        (_optionalChain$7([window, 'optionalAccess', _5 => _5.ethereum, 'optionalAccess', _6 => _6.isTrust]) || _optionalChain$7([window, 'optionalAccess', _7 => _7.ethereum, 'optionalAccess', _8 => _8.isTrustWallet])) &&
        Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!Debug)(?!TrustWallet)(?!MetaMask)(?!PocketUniverse)(?!RevokeCash)/)).length == 1
      )
    };}
  } TrustEVM.__initStatic(); TrustEVM.__initStatic2();

  function _optionalChain$6(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Uniswap extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Uniswap',
      logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQxIiBoZWlnaHQ9IjY0MCIgdmlld0JveD0iMCAwIDY0MSA2NDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMjQuNTM0IDEyMy4yMjZDMjE4LjY5MiAxMjIuMzIgMjE4LjQ0NSAxMjIuMjEzIDIyMS4xOTUgMTIxLjc5MUMyMjYuNDY0IDEyMC45OCAyMzguOTA1IDEyMi4wODUgMjQ3LjQ3OSAxMjQuMTIzQzI2Ny40OTQgMTI4Ljg4MSAyODUuNzA3IDE0MS4wNjkgMzA1LjE0OCAxNjIuNzE0TDMxMC4zMTMgMTY4LjQ2NUwzMTcuNzAxIDE2Ny4yNzdDMzQ4LjgyOCAxNjIuMjc1IDM4MC40OTMgMTY2LjI1IDQwNi45NzggMTc4LjQ4NUM0MTQuMjY0IDE4MS44NTEgNDI1Ljc1MiAxODguNTUyIDQyNy4xODcgMTkwLjI3NEM0MjcuNjQ1IDE5MC44MjIgNDI4LjQ4NSAxOTQuMzU1IDQyOS4wNTMgMTk4LjEyNEM0MzEuMDIgMjExLjE2NCA0MzAuMDM2IDIyMS4xNiA0MjYuMDQ3IDIyOC42MjVDNDIzLjg3NyAyMzIuNjg4IDQyMy43NTYgMjMzLjk3NSA0MjUuMjE1IDIzNy40NTJDNDI2LjM4IDI0MC4yMjcgNDI5LjYyNyAyNDIuMjggNDMyLjg0MyAyNDIuMjc2QzQzOS40MjUgMjQyLjI2NyA0NDYuNTA5IDIzMS42MjcgNDQ5Ljc5MSAyMTYuODIzTDQ1MS4wOTUgMjEwLjk0M0w0NTMuNjc4IDIxMy44NjhDNDY3Ljg0NiAyMjkuOTIgNDc4Ljk3NCAyNTEuODExIDQ4MC44ODUgMjY3LjM5M0w0ODEuMzgzIDI3MS40NTVMNDc5LjAwMiAyNjcuNzYyQzQ3NC45MDMgMjYxLjQwNyA0NzAuNzg1IDI1Ny4wOCA0NjUuNTEyIDI1My41OTFDNDU2LjAwNiAyNDcuMzAxIDQ0NS45NTUgMjQ1LjE2MSA0MTkuMzM3IDI0My43NThDMzk1LjI5NiAyNDIuNDkxIDM4MS42OSAyNDAuNDM4IDM2OC4xOTggMjM2LjAzOEMzNDUuMjQ0IDIyOC41NTQgMzMzLjY3MiAyMTguNTg3IDMwNi40MDUgMTgyLjgxMkMyOTQuMjk0IDE2Ni45MjMgMjg2LjgwOCAxNTguMTMxIDI3OS4zNjIgMTUxLjA1MUMyNjIuNDQyIDEzNC45NjQgMjQ1LjgxNiAxMjYuNTI3IDIyNC41MzQgMTIzLjIyNloiIGZpbGw9IiNGRjAwN0EiLz4KPHBhdGggZD0iTTQzMi42MSAxNTguNzA0QzQzMy4yMTUgMTQ4LjA1NyA0MzQuNjU5IDE0MS4wMzMgNDM3LjU2MiAxMzQuNjJDNDM4LjcxMSAxMzIuMDgxIDQzOS43ODggMTMwLjAwMyA0MzkuOTU0IDEzMC4wMDNDNDQwLjEyIDEzMC4wMDMgNDM5LjYyMSAxMzEuODc3IDQzOC44NDQgMTM0LjE2N0M0MzYuNzMzIDE0MC4zOTIgNDM2LjM4NyAxNDguOTA1IDQzNy44NCAxNTguODExQzQzOS42ODYgMTcxLjM3OSA0NDAuNzM1IDE3My4xOTIgNDU0LjAxOSAxODYuNzY5QzQ2MC4yNSAxOTMuMTM3IDQ2Ny40OTcgMjAxLjE2OCA0NzAuMTI0IDIwNC42MTZMNDc0LjkwMSAyMTAuODg2TDQ3MC4xMjQgMjA2LjQwNUM0NjQuMjgyIDIwMC45MjYgNDUwLjg0NyAxOTAuMjQgNDQ3Ljg3OSAxODguNzEyQzQ0NS44OSAxODcuNjg4IDQ0NS41OTQgMTg3LjcwNSA0NDQuMzY2IDE4OC45MjdDNDQzLjIzNSAxOTAuMDUzIDQ0Mi45OTcgMTkxLjc0NCA0NDIuODQgMTk5Ljc0MUM0NDIuNTk2IDIxMi4yMDQgNDQwLjg5NyAyMjAuMjA0IDQzNi43OTcgMjI4LjIwM0M0MzQuNTggMjMyLjUyOSA0MzQuMjMgMjMxLjYwNiA0MzYuMjM3IDIyNi43MjNDNDM3LjczNSAyMjMuMDc3IDQzNy44ODcgMjIxLjQ3NCA0MzcuODc2IDIwOS40MDhDNDM3Ljg1MyAxODUuMTY3IDQzNC45NzUgMTc5LjMzOSA0MTguMDk3IDE2OS4zNTVDNDEzLjgyMSAxNjYuODI2IDQwNi43NzYgMTYzLjE3OCA0MDIuNDQyIDE2MS4yNDlDMzk4LjEwNyAxNTkuMzIgMzk0LjY2NCAxNTcuNjM5IDM5NC43ODkgMTU3LjUxNEMzOTUuMjY3IDE1Ny4wMzggNDExLjcyNyAxNjEuODQyIDQxOC4zNTIgMTY0LjM5QzQyOC4yMDYgMTY4LjE4MSA0MjkuODMzIDE2OC42NzIgNDMxLjAzIDE2OC4yMTVDNDMxLjgzMiAxNjcuOTA5IDQzMi4yMiAxNjUuNTcyIDQzMi42MSAxNTguNzA0WiIgZmlsbD0iI0ZGMDA3QSIvPgo8cGF0aCBkPSJNMjM1Ljg4MyAyMDAuMTc1QzIyNC4wMjIgMTgzLjg0NiAyMTYuNjg0IDE1OC44MDkgMjE4LjI3MiAxNDAuMDkzTDIxOC43NjQgMTM0LjMwMUwyMjEuNDYzIDEzNC43OTRDMjI2LjUzNCAxMzUuNzE5IDIzNS4yNzUgMTM4Ljk3MyAyMzkuMzY5IDE0MS40NTlDMjUwLjYwMiAxNDguMjgxIDI1NS40NjUgMTU3LjI2MyAyNjAuNDEzIDE4MC4zMjhDMjYxLjg2MiAxODcuMDgzIDI2My43NjMgMTk0LjcyOCAyNjQuNjM4IDE5Ny4zMTdDMjY2LjA0NyAyMDEuNDgzIDI3MS4zNjkgMjExLjIxNCAyNzUuNjk2IDIxNy41MzRDMjc4LjgxMyAyMjIuMDg1IDI3Ni43NDMgMjI0LjI0MiAyNjkuODUzIDIyMy42MkMyNTkuMzMxIDIyMi42NyAyNDUuMDc4IDIxMi44MzQgMjM1Ljg4MyAyMDAuMTc1WiIgZmlsbD0iI0ZGMDA3QSIvPgo8cGF0aCBkPSJNNDE4LjIyMyAzMjEuNzA3QzM2Mi43OTMgMjk5LjM4OSAzNDMuMjcxIDI4MC4wMTcgMzQzLjI3MSAyNDcuMzMxQzM0My4yNzEgMjQyLjUyMSAzNDMuNDM3IDIzOC41ODUgMzQzLjYzOCAyMzguNTg1QzM0My44NCAyMzguNTg1IDM0NS45ODUgMjQwLjE3MyAzNDguNDA0IDI0Mi4xMTNDMzU5LjY0NCAyNTEuMTI4IDM3Mi4yMzEgMjU0Ljk3OSA0MDcuMDc2IDI2MC4wNjJDNDI3LjU4IDI2My4wNTQgNDM5LjExOSAyNjUuNDcgNDQ5Ljc2MyAyNjlDNDgzLjU5NSAyODAuMjIgNTA0LjUyNyAzMDIuOTkgNTA5LjUxOCAzMzQuMDA0QzUxMC45NjkgMzQzLjAxNiA1MTAuMTE4IDM1OS45MTUgNTA3Ljc2NiAzNjguODIyQzUwNS45MSAzNzUuODU3IDUwMC4yNDUgMzg4LjUzNyA0OTguNzQyIDM4OS4wMjNDNDk4LjMyNSAzODkuMTU4IDQ5Ny45MTcgMzg3LjU2MiA0OTcuODEgMzg1LjM4OUM0OTcuMjQgMzczLjc0NCA0OTEuMzU1IDM2Mi40MDYgNDgxLjQ3MiAzNTMuOTEzQzQ3MC4yMzUgMzQ0LjI1NyA0NTUuMTM3IDMzNi41NjkgNDE4LjIyMyAzMjEuNzA3WiIgZmlsbD0iI0ZGMDA3QSIvPgo8cGF0aCBkPSJNMzc5LjMxIDMzMC45NzhDMzc4LjYxNSAzMjYuODQ2IDM3Ny40MTEgMzIxLjU2OCAzNzYuNjMzIDMxOS4yNUwzNzUuMjE5IDMxNS4wMzZMMzc3Ljg0NiAzMTcuOTg1QzM4MS40ODEgMzIyLjA2NSAzODQuMzU0IDMyNy4yODcgMzg2Ljc4OSAzMzQuMjQxQzM4OC42NDcgMzM5LjU0OSAzODguODU2IDM0MS4xMjcgMzg4Ljg0MiAzNDkuNzUzQzM4OC44MjggMzU4LjIyMSAzODguNTk2IDM1OS45OTYgMzg2Ljg4IDM2NC43NzNDMzg0LjE3NCAzNzIuMzA3IDM4MC44MTYgMzc3LjY0OSAzNzUuMTgxIDM4My4zODNDMzY1LjA1NiAzOTMuNjg4IDM1Mi4wMzggMzk5LjM5MyAzMzMuMjUzIDQwMS43NkMzMjkuOTg3IDQwMi4xNzEgMzIwLjQ3IDQwMi44NjQgMzEyLjEwMyA0MDMuMjk5QzI5MS4wMTYgNDA0LjM5NSAyNzcuMTM4IDQwNi42NjEgMjY0LjY2OCA0MTEuMDRDMjYyLjg3NSA0MTEuNjcgMjYxLjI3NCA0MTIuMDUyIDI2MS4xMTIgNDExLjg5QzI2MC42MDcgNDExLjM4OCAyNjkuMDk4IDQwNi4zMjYgMjc2LjExMSA0MDIuOTQ4QzI4NS45OTkgMzk4LjE4NSAyOTUuODQyIDM5NS41ODYgMzE3Ljg5NyAzOTEuOTEzQzMyOC43OTIgMzkwLjA5OCAzNDAuMDQzIDM4Ny44OTcgMzQyLjkgMzg3LjAyMUMzNjkuODggMzc4Ljc0OSAzODMuNzQ4IDM1Ny40MDIgMzc5LjMxIDMzMC45NzhaIiBmaWxsPSIjRkYwMDdBIi8+CjxwYXRoIGQ9Ik00MDQuNzE5IDM3Ni4xMDVDMzk3LjM1NSAzNjAuMjczIDM5NS42NjQgMzQ0Ljk4OCAzOTkuNjk4IDMzMC43MzJDNDAwLjEzIDMyOS4yMDkgNDAwLjgyNCAzMjcuOTYyIDQwMS4yNDIgMzI3Ljk2MkM0MDEuNjU5IDMyNy45NjIgNDAzLjM5NyAzMjguOTAyIDQwNS4xMDMgMzMwLjA1QzQwOC40OTcgMzMyLjMzNSA0MTUuMzAzIDMzNi4xODIgNDMzLjQzNyAzNDYuMDY5QzQ1Ni4wNjUgMzU4LjQwNiA0NjguOTY2IDM2Ny45NTkgNDc3Ljc0IDM3OC44NzNDNDg1LjQyMyAzODguNDMyIDQ5MC4xNzggMzk5LjMxOCA0OTIuNDY3IDQxMi41OTNDNDkzLjc2MiA0MjAuMTEzIDQ5My4wMDMgNDM4LjIwNiA0OTEuMDc0IDQ0NS43NzhDNDg0Ljk5IDQ2OS42NTMgNDcwLjg1IDQ4OC40MDYgNDUwLjY4MiA0OTkuMzQ5QzQ0Ny43MjcgNTAwLjk1MiA0NDUuMDc1IDUwMi4yNjkgNDQ0Ljc4OCA1MDIuMjc1QzQ0NC41MDEgNTAyLjI4IDQ0NS41NzcgNDk5LjU0MyA0NDcuMTggNDk2LjE5MUM0NTMuOTY1IDQ4Mi4wMDkgNDU0LjczNyA0NjguMjE0IDQ0OS42MDggNDUyLjg1OUM0NDYuNDY3IDQ0My40NTcgNDQwLjA2NCA0MzEuOTg1IDQyNy4xMzUgNDEyLjU5NkM0MTIuMTAzIDM5MC4wNTQgNDA4LjQxNyAzODQuMDU0IDQwNC43MTkgMzc2LjEwNVoiIGZpbGw9IiNGRjAwN0EiLz4KPHBhdGggZD0iTTE5Ni41MTkgNDYxLjUyNUMyMTcuMDg5IDQ0NC4xNTcgMjQyLjY4MiA0MzEuODE5IDI2NS45OTYgNDI4LjAzMkMyNzYuMDQzIDQyNi4zOTkgMjkyLjc4IDQyNy4wNDcgMzAyLjA4NCA0MjkuNDI4QzMxNi45OTggNDMzLjI0NSAzMzAuMzM4IDQ0MS43OTMgMzM3LjI3NiA0NTEuOTc4QzM0NC4wNTcgNDYxLjkzMiAzNDYuOTY2IDQ3MC42MDYgMzQ5Ljk5NSA0ODkuOTA2QzM1MS4xODkgNDk3LjUxOSAzNTIuNDg5IDUwNS4xNjQgMzUyLjg4MiA1MDYuODk1QzM1NS4xNTYgNTE2Ljg5NyAzNTkuNTgzIDUyNC44OTIgMzY1LjA2NyA1MjguOTA3QzM3My43NzkgNTM1LjI4MyAzODguNzggNTM1LjY4IDQwMy41MzYgNTI5LjkyNEM0MDYuMDQxIDUyOC45NDcgNDA4LjIxNSA1MjguMjcxIDQwOC4zNjggNTI4LjQyNEM0MDguOTAzIDUyOC45NTUgNDAxLjQ3MyA1MzMuOTMgMzk2LjIzIDUzNi41NDhDMzg5LjE3NyA1NDAuMDcxIDM4My41NjggNTQxLjQzNCAzNzYuMTE1IDU0MS40MzRDMzYyLjYgNTQxLjQzNCAzNTEuMzc5IDUzNC41NTggMzQyLjAxNiA1MjAuNTM5QzM0MC4xNzQgNTE3Ljc4IDMzNi4wMzIgNTA5LjUxNiAzMzIuODEzIDUwMi4xNzZDMzIyLjkyOCA0NzkuNjI4IDMxOC4wNDYgNDcyLjc1OSAzMDYuNTY4IDQ2NS4yNDJDMjk2LjU3OSA0NTguNzAxIDI4My42OTcgNDU3LjUzIDI3NC4wMDYgNDYyLjI4MkMyNjEuMjc2IDQ2OC41MjMgMjU3LjcyNCA0ODQuNzkxIDI2Ni44NDIgNDk1LjEwMUMyNzAuNDY1IDQ5OS4xOTggMjc3LjIyMyA1MDIuNzMyIDI4Mi43NDkgNTAzLjQxOUMyOTMuMDg2IDUwNC43MDUgMzAxLjk3IDQ5Ni44NDEgMzAxLjk3IDQ4Ni40MDRDMzAxLjk3IDQ3OS42MjcgMjk5LjM2NSA0NzUuNzYgMjkyLjgwOCA0NzIuODAxQzI4My44NTIgNDY4Ljc2IDI3NC4yMjYgNDczLjQ4MyAyNzQuMjcyIDQ4MS44OTdDMjc0LjI5MiA0ODUuNDg0IDI3NS44NTQgNDg3LjczNyAyNzkuNDUgNDg5LjM2NEMyODEuNzU3IDQ5MC40MDggMjgxLjgxMSA0OTAuNDkxIDI3OS45MjkgNDkwLjFDMjcxLjcxMiA0ODguMzk2IDI2OS43ODcgNDc4LjQ5IDI3Ni4zOTQgNDcxLjkxM0MyODQuMzI2IDQ2NC4wMTggMzAwLjcyOSA0NjcuNTAyIDMwNi4zNjIgNDc4LjI3OUMzMDguNzI4IDQ4Mi44MDUgMzA5LjAwMyA0OTEuODIgMzA2Ljk0IDQ5Ny4yNjRDMzAyLjMyMiA1MDkuNDQ4IDI4OC44NTkgNTE1Ljg1NSAyNzUuMjAxIDUxMi4zNjhDMjY1LjkwMyA1MDkuOTk0IDI2Mi4xMTcgNTA3LjQyNCAyNTAuOTA2IDQ5NS44NzZDMjMxLjQyNSA0NzUuODA5IDIyMy44NjIgNDcxLjkyIDE5NS43NzcgNDY3LjUzNkwxOTAuMzk1IDQ2Ni42OTZMMTk2LjUxOSA0NjEuNTI1WiIgZmlsbD0iI0ZGMDA3QSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ5LjYyMDIgMTIuMDAzMUMxMTQuNjc4IDkwLjk2MzggMjE0Ljk3NyAyMTMuOTAxIDIxOS45NTcgMjIwLjc4NEMyMjQuMDY4IDIyNi40NjcgMjIyLjUyMSAyMzEuNTc2IDIxNS40NzggMjM1LjU4QzIxMS41NjEgMjM3LjgwNyAyMDMuNTA4IDI0MC4wNjMgMTk5LjQ3NiAyNDAuMDYzQzE5NC45MTYgMjQwLjA2MyAxODkuNzc5IDIzNy44NjcgMTg2LjAzOCAyMzQuMzE4QzE4My4zOTMgMjMxLjgxIDE3Mi43MjEgMjE1Ljg3NCAxNDguMDg0IDE3Ny42NDZDMTI5LjIzMyAxNDguMzk2IDExMy40NTcgMTI0LjEzMSAxMTMuMDI3IDEyMy43MjVDMTEyLjAzMiAxMjIuNzg1IDExMi4wNDkgMTIyLjgxNyAxNDYuMTYyIDE4My44NTRDMTY3LjU4MiAyMjIuMTgxIDE3NC44MTMgMjM1LjczMSAxNzQuODEzIDIzNy41NDNDMTc0LjgxMyAyNDEuMjI5IDE3My44MDggMjQzLjE2NiAxNjkuMjYxIDI0OC4yMzhDMTYxLjY4MSAyNTYuNjk0IDE1OC4yOTMgMjY2LjE5NSAxNTUuODQ3IDI4NS44NTlDMTUzLjEwNCAzMDcuOTAyIDE0NS4zOTQgMzIzLjQ3MyAxMjQuMDI2IDM1MC4xMjJDMTExLjUxOCAzNjUuNzIyIDEwOS40NzEgMzY4LjU4MSAxMDYuMzE1IDM3NC44NjlDMTAyLjMzOSAzODIuNzg2IDEwMS4yNDYgMzg3LjIyMSAxMDAuODAzIDM5Ny4yMTlDMTAwLjMzNSA0MDcuNzkgMTAxLjI0NyA0MTQuNjE5IDEwNC40NzcgNDI0LjcyNkMxMDcuMzA0IDQzMy41NzUgMTEwLjI1NSA0MzkuNDE3IDExNy44IDQ1MS4xMDRDMTI0LjMxMSA0NjEuMTg4IDEyOC4wNjEgNDY4LjY4MyAxMjguMDYxIDQ3MS42MTRDMTI4LjA2MSA0NzMuOTQ3IDEyOC41MDYgNDczLjk1IDEzOC41OTYgNDcxLjY3MkMxNjIuNzQxIDQ2Ni4yMTkgMTgyLjM0OCA0NTYuNjI5IDE5My4zNzUgNDQ0Ljg3N0MyMDAuMTk5IDQzNy42MDMgMjAxLjgwMSA0MzMuNTg2IDIwMS44NTMgNDIzLjYxOEMyMDEuODg3IDQxNy4wOTggMjAxLjY1OCA0MTUuNzMzIDE5OS44OTYgNDExLjk4MkMxOTcuMDI3IDQwNS44NzcgMTkxLjgwNCA0MDAuODAxIDE4MC4yOTIgMzkyLjkzMkMxNjUuMjA5IDM4Mi42MjEgMTU4Ljc2NyAzNzQuMzIgMTU2Ljk4NyAzNjIuOTA0QzE1NS41MjcgMzUzLjUzNyAxNTcuMjIxIDM0Ni45MjggMTY1LjU2NSAzMjkuNDRDMTc0LjIwMiAzMTEuMzM4IDE3Ni4zNDIgMzAzLjYyNCAxNzcuNzkgMjg1LjM3OEMxNzguNzI1IDI3My41ODkgMTgwLjAyIDI2OC45NCAxODMuNDA3IDI2NS4yMDlDMTg2LjkzOSAyNjEuMzE3IDE5MC4xMTkgMjYwIDE5OC44NjEgMjU4LjgwNUMyMTMuMTEzIDI1Ni44NTggMjIyLjE4OCAyNTMuMTcxIDIyOS42NDggMjQ2LjI5N0MyMzYuMTE5IDI0MC4zMzQgMjM4LjgyNyAyMzQuNTg4IDIzOS4yNDMgMjI1LjkzOEwyMzkuNTU4IDIxOS4zODJMMjM1Ljk0MiAyMTUuMTY2QzIyMi44NDYgMTk5Ljg5NiA0MC44NSAwIDQwLjA0NCAwQzM5Ljg3MTkgMCA0NC4xODEzIDUuNDAxNzggNDkuNjIwMiAxMi4wMDMxWk0xMzUuNDEyIDQwOS4xOEMxMzguMzczIDQwMy45MzcgMTM2LjggMzk3LjE5NSAxMzEuODQ3IDM5My45MDJDMTI3LjE2NyAzOTAuNzkgMTE5Ljg5NyAzOTIuMjU2IDExOS44OTcgMzk2LjMxMUMxMTkuODk3IDM5Ny41NDggMTIwLjU4MiAzOTguNDQ5IDEyMi4xMjQgMzk5LjI0M0MxMjQuNzIgNDAwLjU3OSAxMjQuOTA5IDQwMi4wODEgMTIyLjg2NiA0MDUuMTUyQzEyMC43OTcgNDA4LjI2MiAxMjAuOTY0IDQxMC45OTYgMTIzLjMzNyA0MTIuODU0QzEyNy4xNjIgNDE1Ljg0OSAxMzIuNTc2IDQxNC4yMDIgMTM1LjQxMiA0MDkuMThaIiBmaWxsPSIjRkYwMDdBIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjQ4LjU1MiAyNjIuMjQ0QzI0MS44NjIgMjY0LjI5OSAyMzUuMzU4IDI3MS4zOSAyMzMuMzQ0IDI3OC44MjZDMjMyLjExNiAyODMuMzYyIDIzMi44MTMgMjkxLjMxOSAyMzQuNjUzIDI5My43NzZDMjM3LjYyNSAyOTcuNzQ1IDI0MC40OTkgMjk4Ljc5MSAyNDguMjgyIDI5OC43MzZDMjYzLjUxOCAyOTguNjMgMjc2Ljc2NCAyOTIuMDk1IDI3OC4zMDQgMjgzLjkyNUMyNzkuNTY3IDI3Ny4yMjkgMjczLjc0OSAyNjcuOTQ4IDI2NS43MzYgMjYzLjg3NEMyNjEuNjAxIDI2MS43NzIgMjUyLjgwNyAyNjAuOTM4IDI0OC41NTIgMjYyLjI0NFpNMjY2LjM2NCAyNzYuMTcyQzI2OC43MTQgMjcyLjgzNCAyNjcuNjg2IDI2OS4yMjUgMjYzLjY5IDI2Ni43ODVDMjU2LjA4IDI2Mi4xMzggMjQ0LjU3MSAyNjUuOTgzIDI0NC41NzEgMjczLjE3M0MyNDQuNTcxIDI3Ni43NTIgMjUwLjU3MiAyODAuNjU2IDI1Ni4wNzQgMjgwLjY1NkMyNTkuNzM1IDI4MC42NTYgMjY0Ljc0NiAyNzguNDczIDI2Ni4zNjQgMjc2LjE3MloiIGZpbGw9IiNGRjAwN0EiLz4KPC9zdmc+Cg==",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.getEip6963Provider = ()=>{
      return window['_eip6963Providers'] ? Object.values(window['_eip6963Providers']).find((provider)=>{
        return _optionalChain$6([provider, 'optionalAccess', _4 => _4.isUniswapWallet])
      }) : undefined
    };}

    static __initStatic3() {this.isAvailable = async()=>{
      return(
        Uniswap.getEip6963Provider() ||
        _optionalChain$6([window, 'optionalAccess', _5 => _5.ethereum, 'optionalAccess', _6 => _6.isUniswapWallet])
      )
    };}

    getProvider() {
      return Uniswap.getEip6963Provider() || (_optionalChain$6([window, 'optionalAccess', _7 => _7.ethereum, 'optionalAccess', _8 => _8.isUniswapWallet]) && _optionalChain$6([window, 'optionalAccess', _9 => _9.ethereum]))
    }
  } Uniswap.__initStatic(); Uniswap.__initStatic2(); Uniswap.__initStatic3();

  const transactionApiBlockchainNames = {
    'ethereum': 'mainnet',
    'bsc': 'bsc',
    'polygon': 'polygon',
    'arbitrum': 'arbitrum',
    'base': 'base',
    'avalanche': 'avalanche',
    'gnosis': 'gnosis-chain',
    'optimism': 'optimism',
    'worldchain': 'optimism',
  };

  const explorerBlockchainNames = {
    'ethereum': 'eth',
    'bsc': 'bnb',
    'polygon': 'matic',
    'arbitrum': 'arb1',
    'base': 'base',
    'avalanche': 'avax',
    'gnosis': 'gno',
    'optimism': 'oeth',
    'worldchain': 'oeth',
  };

  class Safe {

    constructor ({ address, blockchain }) {
      this.address = address;
      this.blockchain = blockchain;
    }

    async transactionCount() {
      let transactionCount;
      let jsonResult = await fetch(`https://safe-transaction-${transactionApiBlockchainNames[this.blockchain]}.safe.global/api/v1/safes/${this.address}/all-transactions/`)
        .then((response) => response.json())
        .catch((error) => { console.error('Error:', error); });
      if(jsonResult && jsonResult.results && jsonResult.results.length) {
        transactionCount = jsonResult.results[0].nonce + 1;
      } else {
        transactionCount = parseInt((await web3ClientEvm.request({
          blockchain: this.blockchain,
          address: this.address,
          api: [{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
          method: 'nonce',
        })).toString(), 10);
      }
      return transactionCount
    }

    async retrieveTransaction({ blockchain, tx }) {
      const provider = await web3ClientEvm.getProvider(blockchain);
      let jsonResult = await fetch(`https://safe-transaction-${transactionApiBlockchainNames[blockchain]}.safe.global/api/v1/multisig-transactions/${tx}/`)
        .then((response) => response.json())
        .catch((error) => { console.error('Error:', error); });
      if(jsonResult && jsonResult.isExecuted && jsonResult.transactionHash) {
        return await provider.getTransaction(jsonResult.transactionHash)
      } else {
        return undefined
      }
    }

    explorerUrlFor({ transaction }) {
      if(transaction) {
        return `https://app.safe.global/${explorerBlockchainNames[transaction.blockchain]}:${transaction.from}/transactions/tx?id=multisig_${transaction.from}_${transaction.id}`
      }
    }
  }

  const isSmartContractWallet = async(blockchain, address)=>{
    const provider = await web3ClientEvm.getProvider(blockchain);
    const code = await provider.getCode(address);
    return (code != '0x')
  };

  const identifySmartContractWallet = async (blockchain, address)=>{
    let name; 
    try {
      name = await web3ClientEvm.request({
        blockchain,
        address,
        api: [{ "constant": true, "inputs": [], "name": "NAME", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function"}],
        method: 'NAME'
      });
    } catch (e) {}
    if(name == 'Default Callback Handler') { return 'Safe' }
    
  };

  const getSmartContractWallet = async(blockchain, address)=> {
    if(!await isSmartContractWallet(blockchain, address)){ return }

    const type = await identifySmartContractWallet(blockchain, address);
    if(type == 'Safe') {
      return new Safe({ blockchain, address })
    } else if(type == 'Argent') {
      return new Argent({ blockchain, address })
    } else {
      if(smartContractWallet){ throw({ message: 'Unrecognized smart contract wallet not supported!', code: "SMART_CONTRACT_WALLET_NOT_SUPPORTED" }) }
    }
  };

  function _optionalChain$5(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const sendTransaction$1 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    await transaction.prepare({ wallet });
    let transactionCount = await web3ClientEvm.request({ blockchain: transaction.blockchain, method: 'transactionCount', address: transaction.from });
    transaction.nonce = transactionCount;
    await submit$1({ transaction, wallet }).then(async (response)=>{
      if(typeof response == 'string') {
        let blockchain = Blockchains__default['default'][transaction.blockchain];
        transaction.id = response;
        transaction.url = blockchain.explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        let sentTransaction = await retrieveTransaction(transaction.id, transaction.blockchain);
        transaction.nonce = sentTransaction.nonce || transactionCount;
        if(!sentTransaction) {
          transaction._failed = true;
          if(transaction.failed) transaction.failed(transaction, 'Error retrieving transaction');
        } else {
          retrieveConfirmedTransaction$1(sentTransaction).then(() => {
            transaction._succeeded = true;
            if (transaction.succeeded) transaction.succeeded(transaction);
          }).catch((error)=>{
            if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
              if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 1) {
                transaction.id = error.replacement.hash;
                transaction._succeeded = true;
                if (transaction.succeeded) transaction.succeeded(transaction);
              } else if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 0) {
                transaction.id = error.replacement.hash;
                transaction._failed = true;
                if(transaction.failed) transaction.failed(transaction, error);  
              }
            } else {
              transaction._failed = true;
              if(transaction.failed) transaction.failed(transaction, error);
            }
          });
        }
      } else {
        throw(response)
      }
    });
    return transaction
  };

  const retrieveConfirmedTransaction$1 = (sentTransaction)=>{
    return new Promise((resolve, reject)=>{
      try {
        sentTransaction.wait(1).then(resolve).catch((error)=>{
          if(
            (error && _optionalChain$5([error, 'optionalAccess', _ => _.stack, 'optionalAccess', _2 => _2.match, 'call', _3 => _3('JSON-RPC error')])) ||
            (error && error.toString().match('undefined'))
          ) {
            setTimeout(()=>{
              retrieveConfirmedTransaction$1(sentTransaction)
                .then(resolve)
                .catch(reject);
            }, 500);
          } else {
            reject(error);
          }
        });
      } catch (error) {
        if(
          (error && _optionalChain$5([error, 'optionalAccess', _4 => _4.stack, 'optionalAccess', _5 => _5.match, 'call', _6 => _6('JSON-RPC error')])) ||
          (error && error.toString().match('undefined'))
        ) {
          setTimeout(()=>{
              retrieveConfirmedTransaction$1(sentTransaction)
                .then(resolve)
                .catch(reject);
            }, 500);
        } else {
          reject(error);
        }
      } 
    })
  };

  const retrieveTransaction = (tx, blockchain)=>{
    return new Promise(async(resolve, reject)=>{
      try {
        let sentTransaction;
        const provider = await web3ClientEvm.getProvider(blockchain);
        sentTransaction = await provider.getTransaction(tx);
        const maxRetries = 120;
        let attempt = 1;
        while (attempt <= maxRetries && !sentTransaction) {
          sentTransaction = await provider.getTransaction(tx);
          await (new Promise((resolve)=>setTimeout(resolve, 5000)));
          attempt++;
        }
        resolve(sentTransaction);
      } catch (error) {
        if(
          (error && _optionalChain$5([error, 'optionalAccess', _7 => _7.stack, 'optionalAccess', _8 => _8.match, 'call', _9 => _9('JSON-RPC error')])) ||
          (error && error.toString().match('undefined'))
        ) {
          setTimeout(()=>{
            retrieveTransaction(tx, blockchain)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      }
    })
  };

  const submit$1 = ({ transaction, wallet }) => {
    if(transaction.method) {
      return submitContractInteraction$1({ transaction, wallet })
    } else {
      return submitSimpleTransfer$1({ transaction, wallet })
    }
  };

  const submitContractInteraction$1 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    const blockchain = Blockchains__default['default'][transaction.blockchain];
    let gas;
    try {
      gas = await web3ClientEvm.estimate(transaction);
      gas = gas.add(gas.div(10));
    } catch (e2) {}
    const gasPrice = await provider.getGasPrice();
    return wallet.signClient.request({
      topic: wallet.session.topic,
      chainId: `${blockchain.namespace}:${blockchain.networkId}`,
      request: {
        method: 'eth_sendTransaction',
        params: [{
          from: transaction.from,
          to: transaction.to,
          value: transaction.value ? ethers.ethers.BigNumber.from(transaction.value.toString()).toHexString() : undefined,
          data: await transaction.getData(),
          gas: _optionalChain$5([gas, 'optionalAccess', _10 => _10.toHexString, 'call', _11 => _11()]),
          gasLimit: _optionalChain$5([gas, 'optionalAccess', _12 => _12.toHexString, 'call', _13 => _13()]),
          gasPrice: gasPrice.toHexString(),
          nonce: ethers.ethers.utils.hexlify(transaction.nonce),
        }]
      }
    }).catch((e)=>{console.log('ERROR', e);})
  };

  const submitSimpleTransfer$1 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    let blockchain = Blockchains__default['default'][transaction.blockchain];
    let gas;
    try {
      gas = await web3ClientEvm.estimate(transaction);
      gas = gas.add(gas.div(10));
    } catch (e3) {}
    const gasPrice = await provider.getGasPrice();
    return wallet.signClient.request({
      topic: wallet.session.topic,
      chainId: `${blockchain.namespace}:${blockchain.networkId}`,
      request: {
        method: 'eth_sendTransaction',
        params: [{
          from: transaction.from,
          to: transaction.to,
          value: transaction.value ? ethers.ethers.BigNumber.from(transaction.value.toString()).toHexString() : undefined,
          data: '0x0',
          gas: _optionalChain$5([gas, 'optionalAccess', _14 => _14.toHexString, 'call', _15 => _15()]),
          gasLimit: _optionalChain$5([gas, 'optionalAccess', _16 => _16.toHexString, 'call', _17 => _17()]),
          gasPrice: _optionalChain$5([gasPrice, 'optionalAccess', _18 => _18.toHexString, 'call', _19 => _19()]),
          nonce: ethers.ethers.utils.hexlify(transaction.nonce)
        }]
      }
    }).catch((e)=>{console.log('ERROR', e);})
  };

  function _optionalChain$4(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const KEY = 'depay:wallets:wc2';

  const DEFAULT_CONFIGURATION = {
    events: ['accountsChanged'],
    methods: [
      "eth_sendTransaction",
      "personal_sign",
      "eth_signTypedData",
      "eth_signTypedData_v4",
    ]
  };

  const getConnectedInstance$1 = async()=>{
    if(await WalletConnectV2.isAvailable()) { return new WalletConnectV2() }
  };

  const getLastSession = async(walletName)=>{
    if(!localStorage[KEY+":projectId"]) { return }
    if(walletName !== localStorage[KEY+":lastSessionWalletName"]) { return }
    let signClient = await getSignClient();
    let existingSessions;
    try { existingSessions = signClient.find(getWalletConnectV2Config(walletName)); } catch (e) {}
    const lastSession = existingSessions ? existingSessions[existingSessions.length-1] : undefined;
    if(lastSession && localStorage[KEY+":lastExpiredSessionTopic"] !== lastSession.topic && lastSession.expiry > Math.ceil(Date.now()/1000)) {
      const result = await Promise.race([signClient.ping({ topic: lastSession.topic }), new Promise((resolve)=>setTimeout(resolve, 1500))]);
      if(result) {
        return lastSession
      } else {
        localStorage[KEY+":lastExpiredSessionTopic"] = lastSession.topic;
        return
      }
    }
  };

  const getWalletConnectV2Config = (walletName)=>{
    const methods = DEFAULT_CONFIGURATION.methods;
    const events = DEFAULT_CONFIGURATION.events;

    let requiredNamespaces = {};
    requiredNamespaces['eip155'] = {
      chains: [`eip155:1`],
    };
    if(requiredNamespaces['eip155']) {
      requiredNamespaces['eip155'].methods = methods;
      requiredNamespaces['eip155'].events = events;
    }

    let optionalNamespaces = {};
    optionalNamespaces['eip155'] = {
      chains: supported$1.evm.map((blockchain)=>`${Blockchains__default['default'][blockchain].namespace}:${Blockchains__default['default'][blockchain].networkId}`),
    };
    if(_optionalChain$4([optionalNamespaces, 'optionalAccess', _ => _.eip155]) && _optionalChain$4([optionalNamespaces, 'optionalAccess', _2 => _2.eip155, 'optionalAccess', _3 => _3.chains, 'optionalAccess', _4 => _4.length])) {
      optionalNamespaces['eip155'].methods = methods;
      optionalNamespaces['eip155'].events = events;
    }

    return { requiredNamespaces, optionalNamespaces }
  };

  const getSignClient = ()=>{
    if(window.getSignClientPromise) { return window.getSignClientPromise }
    window.getSignClientPromise = new Promise(async(resolve)=>{
      const signClient = await walletconnectV2.SignClient.init({
        projectId: localStorage[KEY+":projectId"],
        metadata: {
          name: document.title || 'dApp',
          description: _optionalChain$4([document, 'access', _5 => _5.querySelector, 'call', _6 => _6('meta[name="description"]'), 'optionalAccess', _7 => _7.getAttribute, 'call', _8 => _8('content')]) || document.title || 'dApp',
          url: location.href,
          icons: [_optionalChain$4([document, 'access', _9 => _9.querySelector, 'call', _10 => _10("link[rel~='icon'], link[rel~='shortcut icon']"), 'optionalAccess', _11 => _11.href]) || `${location.origin}/favicon.ico`]
        }
      });
      resolve(signClient);
    });

    return window.getSignClientPromise
  };

  class WalletConnectV2 {

    static __initStatic() {this.info = {
      name: 'WalletConnect V2',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async(options)=>{ 
      return !! await getLastSession(_optionalChain$4([options, 'optionalAccess', _13 => _13.walletName]))
    };}

    constructor() {
      this.name = (localStorage[KEY+':name'] && localStorage[KEY+':name'] != undefined) ? localStorage[KEY+':name'] : this.constructor.info.name;
      this.logo = (localStorage[KEY+':logo'] && localStorage[KEY+':logo'] != undefined) ? localStorage[KEY+':logo'] : this.constructor.info.logo;
      this.sendTransaction = (transaction)=>{
        return sendTransaction$1({
          wallet: this,
          transaction
        })
      };
    }

    async account() {
      if(_optionalChain$4([this, 'access', _14 => _14.session, 'optionalAccess', _15 => _15.namespaces, 'optionalAccess', _16 => _16.eip155, 'optionalAccess', _17 => _17.accounts, 'optionalAccess', _18 => _18.length])) {
        return this.session.namespaces.eip155.accounts[0].split(':')[2]
      }
    }

    async setSessionBlockchains() {
      if(!this.session || (!_optionalChain$4([this, 'access', _19 => _19.session, 'optionalAccess', _20 => _20.namespaces, 'optionalAccess', _21 => _21.eip155]) && !_optionalChain$4([this, 'access', _22 => _22.session, 'optionalAccess', _23 => _23.optionalNamespaces, 'optionalAccess', _24 => _24.eip155]))) { return }
      if(this.session.namespaces.eip155.chains) {
        this.blockchains = this.session.namespaces.eip155.chains.map((chainIdentifier)=>_optionalChain$4([Blockchains__default['default'], 'access', _25 => _25.findByNetworkId, 'call', _26 => _26(chainIdentifier.split(':')[1]), 'optionalAccess', _27 => _27.name])).filter(Boolean);
      } else if(this.session.namespaces.eip155.accounts) {
        this.blockchains = this.session.namespaces.eip155.accounts.map((accountIdentifier)=>_optionalChain$4([Blockchains__default['default'], 'access', _28 => _28.findByNetworkId, 'call', _29 => _29(accountIdentifier.split(':')[1]), 'optionalAccess', _30 => _30.name])).filter(Boolean);
      }
    }

    async connect(options) {
      
      let connect = (options && options.connect) ? options.connect : ({uri})=>{};
      
      try {

        this.walletName = _optionalChain$4([options, 'optionalAccess', _31 => _31.name]);

        // delete localStorage[`wc@2:client:0.3//session`] // DELETE WC SESSIONS
        this.signClient = await getSignClient();

        this.signClient.on("session_delete", (session)=> {
          if(_optionalChain$4([session, 'optionalAccess', _32 => _32.topic]) === _optionalChain$4([this, 'access', _33 => _33.session, 'optionalAccess', _34 => _34.topic])) {
            localStorage[KEY+':name'] = undefined;
            localStorage[KEY+':logo'] = undefined;
            this.signClient = undefined;
            this.session = undefined;
          }
        });

        this.signClient.on("session_update", async(session)=> {
          if(_optionalChain$4([session, 'optionalAccess', _35 => _35.topic]) === _optionalChain$4([this, 'access', _36 => _36.session, 'optionalAccess', _37 => _37.topic])) {
            this.session = this.signClient.session.get(session.topic);
            await this.setSessionBlockchains();
          }
        });

        this.signClient.on("session_event", (event)=> {
          if(_optionalChain$4([event, 'optionalAccess', _38 => _38.topic]) === _optionalChain$4([this, 'access', _39 => _39.session, 'optionalAccess', _40 => _40.topic])) {}
        });

        const connectWallet = async()=>{
          const { uri, approval } = await this.signClient.connect(getWalletConnectV2Config(this.walletName));
          await connect({ uri });
          this.session = await approval();
          localStorage[KEY+":lastSessionWalletName"] = this.walletName;
          await new Promise(resolve=>setTimeout(resolve, 500)); // to prevent race condition within WalletConnect
        };

        const lastSession = _optionalChain$4([this, 'optionalAccess', _41 => _41.walletName, 'optionalAccess', _42 => _42.length]) ? await getLastSession(this.walletName) : undefined;
        if(lastSession) {
          this.session = lastSession;
        } else {
          await connectWallet();
        }

        let meta = _optionalChain$4([this, 'access', _43 => _43.session, 'optionalAccess', _44 => _44.peer, 'optionalAccess', _45 => _45.metadata]);
        if(meta && meta.name) {
          this.name = meta.name;
          localStorage[KEY+':name'] = meta.name;
          if(_optionalChain$4([meta, 'optionalAccess', _46 => _46.icons]) && meta.icons.length) {
            this.logo = meta.icons[0];
            localStorage[KEY+':logo'] = this.logo;
          }
        }
        if(_optionalChain$4([options, 'optionalAccess', _47 => _47.name])) { localStorage[KEY+':name'] = this.name = options.name; }
        if(_optionalChain$4([options, 'optionalAccess', _48 => _48.logo])) { localStorage[KEY+':logo'] = this.logo = options.logo; }

        await this.setSessionBlockchains();

        return await this.account()

      } catch (error) {
        console.log('WALLETCONNECT ERROR', error);
      }
    }

    async connectedTo(input) {
      if(input) {
        return this.blockchains.indexOf(input) > -1
      } else {
        return this.blockchains
      }
    }

    getValidChainId() {
      return `eip155:${Blockchains__default['default'][this.blockchains[0]].networkId}`
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        reject({ code: 'NOT_SUPPORTED' });
      })
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        reject({ code: 'NOT_SUPPORTED' });
      })
    }

    on(event, callback) {
      let internalCallback;
      switch (event) {
        case 'account':
          internalCallback = async(event)=> {
            if(_optionalChain$4([event, 'optionalAccess', _49 => _49.topic]) === _optionalChain$4([this, 'access', _50 => _50.session, 'optionalAccess', _51 => _51.topic]) && event.params.event.name === 'accountsChanged') {
              callback(await this.account());
            }
          };
          this.signClient.on("session_event", internalCallback);
          break
      }
      return internalCallback
    }

    off(event, callback) {
      switch (event) {
        case 'account':
          this.signClient.off("session_event", callback);
          break
      }
    }

    async transactionCount({ blockchain, address }) {
      const smartContractWallet = await getSmartContractWallet(blockchain, address);
      if(smartContractWallet) {
        return await smartContractWallet.transactionCount()
      } else {
        return await web3ClientEvm.request({ blockchain, method: 'transactionCount', address })
      }
    }

    async sign(message) {
      if(typeof message === 'object') {
        let account = await this.account();
        let signature = await this.signClient.request({
          topic: this.session.topic,
          chainId: this.getValidChainId(),
          request:{
            method: 'eth_signTypedData_v4',
            params: [account, JSON.stringify(message)],
          }
        });
        return signature
      } else if (typeof message === 'string') {
        const address = await this.account();
        const params = [ethers.ethers.utils.hexlify(ethers.ethers.utils.toUtf8Bytes(message)), address];
        let signature = await this.signClient.request({
          topic: this.session.topic,
          chainId: this.getValidChainId(),
          request:{
            method: 'personal_sign',
            params
          }
        });
        if(typeof signature == 'object') {
          signature = ethers.ethers.utils.hexlify(signature);
        }
        return signature
      }
    }
  } WalletConnectV2.__initStatic(); WalletConnectV2.__initStatic2();

  WalletConnectV2.getConnectedInstance = getConnectedInstance$1;

  function _optionalChain$3(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  const sendTransaction = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      await wallet.switchTo(transaction.blockchain);
    }
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
    await transaction.prepare({ wallet });
    let provider = new ethers.ethers.providers.Web3Provider(wallet.connector, 'any');
    let signer = provider.getSigner(0);
    await submit({ transaction, provider, signer }).then((sentTransaction)=>{
      if (sentTransaction) {
        transaction.id = sentTransaction.hash;
        transaction.nonce = sentTransaction.nonce;
        transaction.url = Blockchains__default['default'].findByName(transaction.blockchain).explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        retrieveConfirmedTransaction(sentTransaction).then(() => {
          transaction._succeeded = true;
          if (transaction.succeeded) transaction.succeeded(transaction);
        }).catch((error)=>{
          if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
            if(error.replacement && error.replacement.hash) {
              transaction.id = error.replacement.hash;
              transaction.url = Blockchains__default['default'].findByName(transaction.blockchain).explorerUrlFor({ transaction });
            }
            if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 1) {
              transaction._succeeded = true;
              if (transaction.succeeded) transaction.succeeded(transaction);
            } else if(error.replacement && error.replacement.hash && error.receipt && error.receipt.status == 0) {
              transaction._failed = true;
              if(transaction.failed) transaction.failed(transaction, error);  
            }
          } else {
            transaction._failed = true;
            if(transaction.failed) transaction.failed(transaction, error);
          }
        });
      } else {
        throw('Submitting transaction failed!')
      }
    });
    return transaction
  };

  const retrieveConfirmedTransaction = (sentTransaction)=>{
    return new Promise((resolve, reject)=>{
      try {

        sentTransaction.wait(1).then(resolve).catch((error)=>{
          if(
            (error && _optionalChain$3([error, 'optionalAccess', _ => _.stack, 'optionalAccess', _2 => _2.match, 'call', _3 => _3('JSON-RPC error')])) ||
            (error && error.toString().match('undefined'))
          ) {
            setTimeout(()=>{
              retrieveConfirmedTransaction(sentTransaction)
                .then(resolve)
                .catch(reject);
            }, 500);
          } else {
            reject(error);
          }
        });
      } catch(error) {
        if(
          (error && _optionalChain$3([error, 'optionalAccess', _4 => _4.stack, 'optionalAccess', _5 => _5.match, 'call', _6 => _6('JSON-RPC error')])) ||
          (error && error.toString().match('undefined'))
        ) {
          setTimeout(()=>{
            retrieveConfirmedTransaction(sentTransaction)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      }
    })
  };

  const submit = ({ transaction, provider, signer }) => {
    if(transaction.method) {
      return submitContractInteraction({ transaction, signer, provider })
    } else {
      return submitSimpleTransfer({ transaction, signer })
    }
  };

  const submitContractInteraction = ({ transaction, signer, provider })=>{
    let contract = new ethers.ethers.Contract(transaction.to, transaction.api, provider);
    let contractArguments = transaction.getContractArguments({ contract });
    let method = contract.connect(signer)[transaction.getMethodNameWithSignature()];
    if(contractArguments) {
      return method(...contractArguments, {
        value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
      })
    } else {
      return method({
        value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
      })
    }
  };

  const submitSimpleTransfer = ({ transaction, signer })=>{
    return signer.sendTransaction({
      to: transaction.to,
      value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
    })
  };

  function _optionalChain$2(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const getConnectedInstance = ()=>{
    return window._connectedWalletLinkInstance
  };

  const setConnectedInstance = (value)=>{
    window._connectedWalletLinkInstance = value;
  };

  class WalletLink {

    static __initStatic() {this.info = {
      name: 'Coinbase',
      logo: logos.coinbase,
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return getConnectedInstance() != undefined };}

    constructor() {
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      // RESET WalletLink (do not recover connections!)
      Object.keys(localStorage).forEach((key)=>{
        if(key.match("-walletlink:https://www.walletlink.org")) {
          delete localStorage[key];  
        }
      });
      this.connector = WalletLink.instance || this.newWalletLinkInstance();
      this.sendTransaction = (transaction)=>{
        return sendTransaction({
          wallet: this,
          transaction
        })
      };
    }

    newWalletLinkInstance() {
      let instance = new coinbaseWalletSdk.CoinbaseWalletSDK({}).makeWeb3Provider();
      return instance
    }

    async account() {
      if(this.connectedAccounts == undefined) { return }
      return ethers.ethers.utils.getAddress(this.connectedAccounts[0])
    }

    async connect(options) {

      let connect = (options && options.connect) ? options.connect : ({uri})=>{};
      await connect({ uri: this.connector.qrUrl });
      
      _optionalChain$2([document, 'access', _ => _.querySelector, 'call', _2 => _2('.-cbwsdk-css-reset'), 'optionalAccess', _3 => _3.setAttribute, 'call', _4 => _4('style', 'display: none;')]);
      _optionalChain$2([document, 'access', _5 => _5.querySelector, 'call', _6 => _6('.-cbwsdk-extension-dialog-container'), 'optionalAccess', _7 => _7.setAttribute, 'call', _8 => _8('style', 'display: none;')]);
      setTimeout(()=>{
        if(_optionalChain$2([this, 'optionalAccess', _9 => _9.connector, 'optionalAccess', _10 => _10._relay, 'optionalAccess', _11 => _11.ui, 'optionalAccess', _12 => _12.linkFlow, 'optionalAccess', _13 => _13.isOpen])){
          this.connector._relay.ui.linkFlow.isOpen = false;
        }
      }, 10);

      let relay = await this.connector._relayProvider();
      relay.setConnectDisabled(false);

      let accounts = await this.connector.enable();
      if(accounts instanceof Array && accounts.length) {
        setConnectedInstance(this);
      }
      accounts = accounts.map((account)=>ethers.ethers.utils.getAddress(account));
      this.connectedAccounts = accounts;
      this.connectedChainId = await this.connector.getChainId();
      return accounts[0]
    }

    async connectedTo(input) {
      let chainId = await this.connector.getChainId();
      const blockchain = Blockchains__default['default'].findByNetworkId(chainId);
      if(!blockchain) { return false }
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        this.connector.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: blockchain.id }],
        }).then(resolve).catch((error)=> {
          if(error.code === 4902){ // chain not yet added
            this.addNetwork(blockchainName)
              .then(()=>this.switchTo(blockchainName).then(resolve))
              .catch(reject);
          } else {
            reject(error);
          }
        });
      })
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        this.connector.request({
          method: 'wallet_addEthereumChain',
          params: [{
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
          }],
        }).then(resolve).catch(reject);
      })
    }

    on(event, callback) {
      let internalCallback;
      switch (event) {
        case 'account':
          internalCallback = (accounts) => callback(ethers.ethers.utils.getAddress(accounts[0]));
          this.connector.on('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    off(event, internalCallback) {
      switch (event) {
        case 'account':
          this.connector.removeListener('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    transactionCount({ blockchain, address }) {
      return web3ClientEvm.request({ blockchain, method: 'transactionCount', address })
    }

    async sign(message) {
      if(typeof message === 'object') {
        let provider = this.connector;
        let account = await this.account();
        if((await this.connectedTo(Blockchains__default['default'].findByNetworkId(message.domain.chainId).name)) === false) {
          throw({ code: 'WRONG_NETWORK' })
        }
        let signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [account, message],
          from: account,
        });
        return signature
      } else if (typeof message === 'string') {
        await this.account();
        let provider = new ethers.ethers.providers.Web3Provider(this.connector, 'any');
        let signer = provider.getSigner(0);
        let signature = await signer.signMessage(message);
        return signature
      }
    }
  } WalletLink.__initStatic(); WalletLink.__initStatic2();

  WalletLink.getConnectedInstance = getConnectedInstance;
  WalletLink.setConnectedInstance = setConnectedInstance;

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c),
        u = i.value;
    } catch (n) {
      return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function () {
      var t = this,
        e = arguments;
      return new Promise(function (r, o) {
        var a = n.apply(t, e);
        function _next(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
        }
        function _throw(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
        }
        _next(void 0);
      });
    };
  }
  function _callSuper(t, o, e) {
    return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _construct(t, e, r) {
    if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
    var o = [null];
    o.push.apply(o, e);
    var p = new (t.bind.apply(t, o))();
    return r && _setPrototypeOf(p, r.prototype), p;
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _get() {
    return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) {
      var p = _superPropBase(e, t);
      if (p) {
        var n = Object.getOwnPropertyDescriptor(p, t);
        return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
      }
    }, _get.apply(null, arguments);
  }
  function _getPrototypeOf(t) {
    return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
      return t.__proto__ || Object.getPrototypeOf(t);
    }, _getPrototypeOf(t);
  }
  function _inherits(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
    t.prototype = Object.create(e && e.prototype, {
      constructor: {
        value: t,
        writable: !0,
        configurable: !0
      }
    }), Object.defineProperty(t, "prototype", {
      writable: !1
    }), e && _setPrototypeOf(t, e);
  }
  function _isNativeFunction(t) {
    try {
      return -1 !== Function.toString.call(t).indexOf("[native code]");
    } catch (n) {
      return "function" == typeof t;
    }
  }
  function _isNativeReflectConstruct() {
    try {
      var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (t) {}
    return (_isNativeReflectConstruct = function () {
      return !!t;
    })();
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = !0,
        o = !1;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = !1;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = !0, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _possibleConstructorReturn(t, e) {
    if (e && ("object" == typeof e || "function" == typeof e)) return e;
    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
    return _assertThisInitialized(t);
  }
  function _regeneratorRuntime() {
    _regeneratorRuntime = function () {
      return e;
    };
    var t,
      e = {},
      r = Object.prototype,
      n = r.hasOwnProperty,
      o = Object.defineProperty || function (t, e, r) {
        t[e] = r.value;
      },
      i = "function" == typeof Symbol ? Symbol : {},
      a = i.iterator || "@@iterator",
      c = i.asyncIterator || "@@asyncIterator",
      u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
      return Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), t[e];
    }
    try {
      define({}, "");
    } catch (t) {
      define = function (t, e, r) {
        return t[e] = r;
      };
    }
    function wrap(t, e, r, n) {
      var i = e && e.prototype instanceof Generator ? e : Generator,
        a = Object.create(i.prototype),
        c = new Context(n || []);
      return o(a, "_invoke", {
        value: makeInvokeMethod(t, r, c)
      }), a;
    }
    function tryCatch(t, e, r) {
      try {
        return {
          type: "normal",
          arg: t.call(e, r)
        };
      } catch (t) {
        return {
          type: "throw",
          arg: t
        };
      }
    }
    e.wrap = wrap;
    var h = "suspendedStart",
      l = "suspendedYield",
      f = "executing",
      s = "completed",
      y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function () {
      return this;
    });
    var d = Object.getPrototypeOf,
      v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
      ["next", "throw", "return"].forEach(function (e) {
        define(t, e, function (t) {
          return this._invoke(e, t);
        });
      });
    }
    function AsyncIterator(t, e) {
      function invoke(r, o, i, a) {
        var c = tryCatch(t[r], t, o);
        if ("throw" !== c.type) {
          var u = c.arg,
            h = u.value;
          return h && "object" == typeof h && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
            invoke("next", t, i, a);
          }, function (t) {
            invoke("throw", t, i, a);
          }) : e.resolve(h).then(function (t) {
            u.value = t, i(u);
          }, function (t) {
            return invoke("throw", t, i, a);
          });
        }
        a(c.arg);
      }
      var r;
      o(this, "_invoke", {
        value: function (t, n) {
          function callInvokeWithMethodAndArg() {
            return new e(function (e, r) {
              invoke(t, n, e, r);
            });
          }
          return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(e, r, n) {
      var o = h;
      return function (i, a) {
        if (o === f) throw Error("Generator is already running");
        if (o === s) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var c = n.delegate;
          if (c) {
            var u = maybeInvokeDelegate(c, n);
            if (u) {
              if (u === y) continue;
              return u;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (o === h) throw o = s, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = f;
          var p = tryCatch(e, r, n);
          if ("normal" === p.type) {
            if (o = n.done ? s : l, p.arg === y) continue;
            return {
              value: p.arg,
              done: n.done
            };
          }
          "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
        }
      };
    }
    function maybeInvokeDelegate(e, r) {
      var n = r.method,
        o = e.iterator[n];
      if (o === t) return r.delegate = null, "throw" === n && e.iterator.return && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
      var i = tryCatch(o, e.iterator, r.arg);
      if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
      var a = i.arg;
      return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
      var e = {
        tryLoc: t[0]
      };
      1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
      var e = t.completion || {};
      e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
      this.tryEntries = [{
        tryLoc: "root"
      }], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
      if (e || "" === e) {
        var r = e[a];
        if (r) return r.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) {
          var o = -1,
            i = function next() {
              for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
              return next.value = t, next.done = !0, next;
            };
          return i.next = i;
        }
      }
      throw new TypeError(typeof e + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function (t) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function (t) {
      return {
        __await: t
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
      return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
        return t.done ? t.value : a.next();
      });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
      return this;
    }), define(g, "toString", function () {
      return "[object Generator]";
    }), e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return r.reverse(), function next() {
        for (; r.length;) {
          var t = r.pop();
          if (t in e) return next.value = t, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, e.values = values, Context.prototype = {
      constructor: Context,
      reset: function (e) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      },
      stop: function () {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function (e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function (t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
            var i = o;
            break;
          }
        }
        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
        var a = i ? i.completion : {};
        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
      },
      complete: function (t, e) {
        if ("throw" === t.type) throw t.arg;
        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
      },
      finish: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      catch: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function (e, r, n) {
        return this.delegate = {
          iterator: values(e),
          resultName: r,
          nextLoc: n
        }, "next" === this.method && (this.arg = t), y;
      }
    }, e;
  }
  function _setPrototypeOf(t, e) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
      return t.__proto__ = e, t;
    }, _setPrototypeOf(t, e);
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _superPropBase(t, o) {
    for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t)););
    return t;
  }
  function _superPropGet(t, e, o, r) {
    var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), e, o);
    return 2 & r && "function" == typeof p ? function (t) {
      return p.apply(o, t);
    } : p;
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _wrapNativeSuper(t) {
    var r = "function" == typeof Map ? new Map() : void 0;
    return _wrapNativeSuper = function (t) {
      if (null === t || !_isNativeFunction(t)) return t;
      if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== r) {
        if (r.has(t)) return r.get(t);
        r.set(t, Wrapper);
      }
      function Wrapper() {
        return _construct(t, arguments, _getPrototypeOf(this).constructor);
      }
      return Wrapper.prototype = Object.create(t.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), _setPrototypeOf(Wrapper, t);
    }, _wrapNativeSuper(t);
  }

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function getAugmentedNamespace(n) {
    var f = n.default;
  	if (typeof f == "function") {
  		var a = function () {
  			return f.apply(this, arguments);
  		};
  		a.prototype = f.prototype;
    } else a = {};
    Object.defineProperty(a, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var buffer = {};

  var base64Js = {};

  base64Js.byteLength = byteLength;
  base64Js.toByteArray = toByteArray;
  base64Js.fromByteArray = fromByteArray;
  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  // Support decoding URL-safe base64 strings, as Node.js does.
  // See: https://en.wikipedia.org/wiki/Base64#URL_applications
  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
  function getLens(b64) {
    var len = b64.length;
    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    }

    // Trim off extra bytes after placeholder bytes are found
    // See: https://github.com/beatgammit/base64-js/issues/42
    var validLen = b64.indexOf('=');
    if (validLen === -1) validLen = len;
    var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
    return [validLen, placeHoldersLen];
  }

  // base64 is 4/3 + up to two characters of the original data
  function byteLength(b64) {
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function _byteLength(b64, validLen, placeHoldersLen) {
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function toByteArray(b64) {
    var tmp;
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
    var curByte = 0;

    // if there are placeholders, only get up to the last complete 4 chars
    var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
    var i;
    for (i = 0; i < len; i += 4) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[curByte++] = tmp >> 16 & 0xFF;
      arr[curByte++] = tmp >> 8 & 0xFF;
      arr[curByte++] = tmp & 0xFF;
    }
    if (placeHoldersLen === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[curByte++] = tmp & 0xFF;
    }
    if (placeHoldersLen === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[curByte++] = tmp >> 8 & 0xFF;
      arr[curByte++] = tmp & 0xFF;
    }
    return arr;
  }
  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }
  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
      output.push(tripletToBase64(tmp));
    }
    return output.join('');
  }
  function fromByteArray(uint8) {
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
    }
    return parts.join('');
  }

  var ieee754 = {};

  /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
  ieee754.read = function (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  };
  ieee754.write = function (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);
    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }
      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }
    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    e = e << mLen | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    buffer[offset + i - d] |= s * 128;
  };

  (function (exports) {

    var base64 = base64Js;
    var ieee754$1 = ieee754;
    var customInspectSymbol = typeof Symbol === 'function' && typeof Symbol['for'] === 'function' // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null;
    exports.Buffer = Buffer;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 0x7fffffff;
    exports.kMaxLength = K_MAX_LENGTH;

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
     *               implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * We report that the browser does not support typed arrays if the are not subclassable
     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
     * for __proto__ and has a buggy typed array implementation.
     */
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
    }
    function typedArraySupport() {
      // Can typed array instances can be augmented?
      try {
        var arr = new Uint8Array(1);
        var proto = {
          foo: function foo() {
            return 42;
          }
        };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer.prototype, 'parent', {
      enumerable: true,
      get: function get() {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer.prototype, 'offset', {
      enumerable: true,
      get: function get() {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      // Return an augmented `Uint8Array` instance
      var buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer.prototype);
      return buf;
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer(arg, encodingOrOffset, length) {
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new TypeError('The "string" argument must be of type string. Received type number');
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer.poolSize = 8192; // not used by this implementation

    function from(value, encodingOrOffset, length) {
      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === 'number') {
        throw new TypeError('The "value" argument must not be of type number. Received type number');
      }
      var valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer.from(valueOf, encodingOrOffset, length);
      }
      var b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
        return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
      }
      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };

    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
    // https://github.com/feross/buffer/pull/148
    Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer, Uint8Array);
    function assertSize(size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpreted as a start offset.
        return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(size);
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }
      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }
      var length = byteLength(string, encoding) | 0;
      var buf = createBuffer(length);
      var actual = buf.write(string, encoding);
      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0;
      var buf = createBuffer(length);
      for (var i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        var copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      var buf;
      if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array);
      } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }

      // Return an augmented `Uint8Array` instance
      Object.setPrototypeOf(buf, Buffer.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer.isBuffer(obj)) {
        var len = checked(obj.length) | 0;
        var buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== undefined) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        // eslint-disable-line eqeqeq
        length = 0;
      }
      return Buffer.alloc(+length);
    }
    Buffer.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
    };
    Buffer.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
      }
      if (a === b) return 0;
      var x = a.length;
      var y = b.length;
      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true;
        default:
          return false;
      }
    };
    Buffer.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer.alloc(0);
      }
      var i;
      if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }
      var buffer = Buffer.allocUnsafe(length);
      var pos = 0;
      for (i = 0; i < list.length; ++i) {
        var buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(buffer, buf, pos);
          }
        } else if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== 'string') {
        throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + _typeof(string));
      }
      var len = string.length;
      var mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;

      // Use a for loop to avoid recursion
      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len;
          case 'utf8':
          case 'utf-8':
            return utf8ToBytes(string).length;
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2;
          case 'hex':
            return len >>> 1;
          case 'base64':
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
            }
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      var loweredCase = false;

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0;
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return '';
      }
      if (end === undefined || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return '';
      }

      // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return '';
      }
      if (!encoding) encoding = 'utf8';
      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end);
          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end);
          case 'ascii':
            return asciiSlice(this, start, end);
          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end);
          case 'base64':
            return base64Slice(this, start, end);
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
            encoding = (encoding + '').toLowerCase();
            loweredCase = true;
        }
      }
    }

    // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
    // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
    // reliably in a browserify context because there could be multiple different
    // copies of the 'buffer' package in use. This method works even for Buffer
    // instances that were created from another copy of the `buffer` package.
    // See: https://github.com/feross/buffer/issues/154
    Buffer.prototype._isBuffer = true;
    function swap(b, n, m) {
      var i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer.prototype.swap16 = function swap16() {
      var len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits');
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer.prototype.swap32 = function swap32() {
      var len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits');
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer.prototype.swap64 = function swap64() {
      var len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits');
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer.prototype.toString = function toString() {
      var length = this.length;
      if (length === 0) return '';
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer.prototype.toLocaleString = Buffer.prototype.toString;
    Buffer.prototype.equals = function equals(b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
      if (this === b) return true;
      return Buffer.compare(this, b) === 0;
    };
    Buffer.prototype.inspect = function inspect() {
      var str = '';
      var max = exports.INSPECT_MAX_BYTES;
      str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
      if (this.length > max) str += ' ... ';
      return '<Buffer ' + str + '>';
    };
    if (customInspectSymbol) {
      Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
    }
    Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength);
      }
      if (!Buffer.isBuffer(target)) {
        throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + _typeof(target));
      }
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = target ? target.length : 0;
      }
      if (thisStart === undefined) {
        thisStart = 0;
      }
      if (thisEnd === undefined) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index');
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      var x = thisEnd - thisStart;
      var y = end - start;
      var len = Math.min(x, y);
      var thisCopy = this.slice(thisStart, thisEnd);
      var targetCopy = target.slice(start, end);
      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1;

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
      }
      byteOffset = +byteOffset; // Coerce to Number.
      if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : buffer.length - 1;
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;else return -1;
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError('val must be string, number or Buffer');
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      var indexSize = 1;
      var arrLength = arr.length;
      var valLength = val.length;
      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf, i) {
        if (indexSize === 1) {
          return buf[i];
        } else {
          return buf.readUInt16BE(i * indexSize);
        }
      }
      var i;
      if (dir) {
        var foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          var found = true;
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      var remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      var strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      var i;
      for (i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
    }
    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }
    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }
    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }
    Buffer.prototype.write = function write(string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
        // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
        // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === undefined) encoding = 'utf8';
        } else {
          encoding = length;
          length = undefined;
        }
      } else {
        throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
      }
      var remaining = this.length - offset;
      if (length === undefined || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds');
      }
      if (!encoding) encoding = 'utf8';
      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length);
          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length);
          case 'ascii':
          case 'latin1':
          case 'binary':
            return asciiWrite(this, string, offset, length);
          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length);
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer.prototype.toJSON = function toJSON() {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      var res = [];
      var i = start;
      while (i < end) {
        var firstByte = buf[i];
        var codePoint = null;
        var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          var secondByte = void 0,
            thirdByte = void 0,
            fourthByte = void 0,
            tempCodePoint = void 0;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD;
          bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000;
          res.push(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000;
    function decodeCodePointsArray(codePoints) {
      var len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = '';
      var i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      var len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      var out = '';
      for (var i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      var bytes = buf.slice(start, end);
      var res = '';
      // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
      for (var i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer.prototype.slice = function slice(start, end) {
      var len = this.length;
      start = ~~start;
      end = end === undefined ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      var newBuf = this.subarray(start, end);
      // Return an augmented `Uint8Array` instance
      Object.setPrototypeOf(newBuf, Buffer.prototype);
      return newBuf;
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
    }
    Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);
      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
      }
      var val = this[offset + --byteLength];
      var mul = 1;
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul;
      }
      return val;
    };
    Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
    };
    Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, 'offset');
      var first = this[offset];
      var last = this[offset + 7];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
      }
      var lo = first + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 24);
      var hi = this[++offset] + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + last * Math.pow(2, 24);
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, 'offset');
      var first = this[offset];
      var last = this[offset + 7];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
      }
      var hi = first * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + this[++offset];
      var lo = this[++offset] * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);
      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      mul *= 0x80;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength);
      return val;
    };
    Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);
      var i = byteLength;
      var mul = 1;
      var val = this[offset + --i];
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
      }
      mul *= 0x80;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength);
      return val;
    };
    Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 0x80)) return this[offset];
      return (0xff - this[offset] + 1) * -1;
    };
    Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset] | this[offset + 1] << 8;
      return val & 0x8000 ? val | 0xFFFF0000 : val;
    };
    Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset + 1] | this[offset] << 8;
      return val & 0x8000 ? val | 0xFFFF0000 : val;
    };
    Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, 'offset');
      var first = this[offset];
      var last = this[offset + 7];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
      }
      var val = this[offset + 4] + this[offset + 5] * Math.pow(2, 8) + this[offset + 6] * Math.pow(2, 16) + (last << 24); // Overflow

      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 24));
    });
    Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, 'offset');
      var first = this[offset];
      var last = this[offset + 7];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
      }
      var val = (first << 24) +
      // Overflow
      this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + last);
    });
    Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754$1.read(this, offset, true, 23, 4);
    };
    Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754$1.read(this, offset, false, 23, 4);
    };
    Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754$1.read(this, offset, true, 52, 8);
    };
    Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754$1.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError('Index out of range');
    }
    Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }
      var mul = 1;
      var i = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = value / mul & 0xFF;
      }
      return offset + byteLength;
    };
    Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }
      var i = byteLength - 1;
      var mul = 1;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = value / mul & 0xFF;
      }
      return offset + byteLength;
    };
    Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
      this[offset] = value & 0xff;
      return offset + 1;
    };
    Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
      return offset + 2;
    };
    Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
      return offset + 4;
    };
    Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      var lo = Number(value & BigInt(0xffffffff));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      var hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      var lo = Number(value & BigInt(0xffffffff));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      var hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
    });
    Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
    });
    Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);
        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }
      var i = 0;
      var mul = 1;
      var sub = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 0xFF;
      }
      return offset + byteLength;
    };
    Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);
        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }
      var i = byteLength - 1;
      var mul = 1;
      var sub = 0;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 0xFF;
      }
      return offset + byteLength;
    };
    Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
      if (value < 0) value = 0xff + value + 1;
      this[offset] = value & 0xff;
      return offset + 1;
    };
    Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
      return offset + 2;
    };
    Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (value < 0) value = 0xffffffff + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
      return offset + 4;
    };
    Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
    });
    Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range');
      if (offset < 0) throw new RangeError('Index out of range');
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4);
      }
      ieee754$1.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8);
      }
      ieee754$1.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;

      // Copy 0 bytes; we're done
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds');
      }
      if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
      if (end < 0) throw new RangeError('sourceEnd out of bounds');

      // Are we oob?
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      var len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
      }
      return len;
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill(val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === 'string') {
          encoding = end;
          end = this.length;
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string');
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding);
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0);
          if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
            // Fast path: If `val` fits into a single byte, use that numeric value.
            val = code;
          }
        }
      } else if (typeof val === 'number') {
        val = val & 255;
      } else if (typeof val === 'boolean') {
        val = Number(val);
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index');
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === undefined ? this.length : end >>> 0;
      if (!val) val = 0;
      var i;
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
        var len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };

    // CUSTOM ERRORS
    // =============

    // Simplified versions from Node, changed for Buffer-only usage
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = /*#__PURE__*/function (_Base) {
        function NodeError() {
          var _this;
          _classCallCheck(this, NodeError);
          _this = _callSuper(this, NodeError);
          Object.defineProperty(_this, 'message', {
            value: getMessage.apply(_this, arguments),
            writable: true,
            configurable: true
          });

          // Add the error code to the name to include it in the stack trace.
          _this.name = "".concat(_this.name, " [").concat(sym, "]");
          // Access the stack to generate the error message including the error code
          // from the name.
          _this.stack; // eslint-disable-line no-unused-expressions
          // Reset the name to the actual name.
          delete _this.name;
          return _this;
        }
        _inherits(NodeError, _Base);
        return _createClass(NodeError, [{
          key: "code",
          get: function get() {
            return sym;
          },
          set: function set(value) {
            Object.defineProperty(this, 'code', {
              configurable: true,
              enumerable: true,
              value: value,
              writable: true
            });
          }
        }, {
          key: "toString",
          value: function toString() {
            return "".concat(this.name, " [").concat(sym, "]: ").concat(this.message);
          }
        }]);
      }(Base);
    }
    E('ERR_BUFFER_OUT_OF_BOUNDS', function (name) {
      if (name) {
        return "".concat(name, " is outside of buffer bounds");
      }
      return 'Attempt to access memory outside buffer bounds';
    }, RangeError);
    E('ERR_INVALID_ARG_TYPE', function (name, actual) {
      return "The \"".concat(name, "\" argument must be of type number. Received type ").concat(_typeof(actual));
    }, TypeError);
    E('ERR_OUT_OF_RANGE', function (str, range, input) {
      var msg = "The value of \"".concat(str, "\" is out of range.");
      var received = input;
      if (Number.isInteger(input) && Math.abs(input) > Math.pow(2, 32)) {
        received = addNumericalSeparator(String(input));
      } else if (typeof input === 'bigint') {
        received = String(input);
        if (input > Math.pow(BigInt(2), BigInt(32)) || input < -Math.pow(BigInt(2), BigInt(32))) {
          received = addNumericalSeparator(received);
        }
        received += 'n';
      }
      msg += " It must be ".concat(range, ". Received ").concat(received);
      return msg;
    }, RangeError);
    function addNumericalSeparator(val) {
      var res = '';
      var i = val.length;
      var start = val[0] === '-' ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = "_".concat(val.slice(i - 3, i)).concat(res);
      }
      return "".concat(val.slice(0, i)).concat(res);
    }

    // CHECK FUNCTIONS
    // ===============

    function checkBounds(buf, offset, byteLength) {
      validateNumber(offset, 'offset');
      if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength) {
      if (value > max || value < min) {
        var n = typeof min === 'bigint' ? 'n' : '';
        var range;
        if (byteLength > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = ">= 0".concat(n, " and < 2").concat(n, " ** ").concat((byteLength + 1) * 8).concat(n);
          } else {
            range = ">= -(2".concat(n, " ** ").concat((byteLength + 1) * 8 - 1).concat(n, ") and < 2 ** ") + "".concat((byteLength + 1) * 8 - 1).concat(n);
          }
        } else {
          range = ">= ".concat(min).concat(n, " and <= ").concat(max).concat(n);
        }
        throw new errors.ERR_OUT_OF_RANGE('value', range, value);
      }
      checkBounds(buf, offset, byteLength);
    }
    function validateNumber(value, name) {
      if (typeof value !== 'number') {
        throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(type || 'offset', ">= ".concat(type ? 1 : 0, " and <= ").concat(length), value);
    }

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      // Node takes equal signs as end of the Base64 encoding
      str = str.split('=')[0];
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = str.trim().replace(INVALID_BASE64_RE, '');
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return '';
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '=';
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      var codePoint;
      var length = string.length;
      var leadSurrogate = null;
      var bytes = [];
      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue;
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue;
            }

            // valid lead
            leadSurrogate = codePoint;
            continue;
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            leadSurrogate = codePoint;
            continue;
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }
        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break;
          bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break;
          bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break;
          bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else {
          throw new Error('Invalid code point');
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      var c, hi, lo;
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      var i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }

    // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
    // the `instanceof` check but they should be treated as of that type.
    // See: https://github.com/feross/buffer/issues/166
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      // For IE11 support
      return obj !== obj; // eslint-disable-line no-self-compare
    }

    // Create lookup table for `toString('hex')`
    // See: https://github.com/feross/buffer/issues/219
    var hexSliceLookupTable = function () {
      var alphabet = '0123456789abcdef';
      var table = new Array(256);
      for (var i = 0; i < 16; ++i) {
        var i16 = i * 16;
        for (var j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    }();

    // Return not function with Error if BigInt not supported
    function defineBigIntMethod(fn) {
      return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error('BigInt not supported');
    }
  })(buffer);

  function isHex(value) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$strict = _ref.strict,
      strict = _ref$strict === void 0 ? true : _ref$strict;
    if (!value) return false;
    if (typeof value !== 'string') return false;
    return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith('0x');
  }

  /**
   * @description Retrieves the size of the value (in bytes).
   *
   * @param value The value (hex or byte array) to retrieve the size of.
   * @returns The size of the value (in bytes).
   */
  function size(value) {
    if (isHex(value, {
      strict: false
    })) return Math.ceil((value.length - 2) / 2);
    return value.length;
  }

  var version = '2.21.7';

  var errorConfig = {
    getDocsUrl: function getDocsUrl(_ref) {
      var docsBaseUrl = _ref.docsBaseUrl,
        _ref$docsPath = _ref.docsPath,
        docsPath = _ref$docsPath === void 0 ? '' : _ref$docsPath,
        docsSlug = _ref.docsSlug;
      return docsPath ? "".concat(docsBaseUrl !== null && docsBaseUrl !== void 0 ? docsBaseUrl : 'https://viem.sh').concat(docsPath).concat(docsSlug ? "#".concat(docsSlug) : '') : undefined;
    },
    version: version
  };
  var BaseError = /*#__PURE__*/function (_Error) {
    function BaseError(shortMessage) {
      var _errorConfig$getDocsU, _errorConfig, _args$name;
      var _this;
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      _classCallCheck(this, BaseError);
      var details = function (_args$cause) {
        if (args.cause instanceof BaseError) return args.cause.details;
        if ((_args$cause = args.cause) !== null && _args$cause !== void 0 && _args$cause.message) return args.cause.message;
        return args.details;
      }();
      var docsPath = function () {
        if (args.cause instanceof BaseError) return args.cause.docsPath || args.docsPath;
        return args.docsPath;
      }();
      var docsUrl = (_errorConfig$getDocsU = (_errorConfig = errorConfig).getDocsUrl) === null || _errorConfig$getDocsU === void 0 ? void 0 : _errorConfig$getDocsU.call(_errorConfig, _objectSpread2(_objectSpread2({}, args), {}, {
        docsPath: docsPath
      }));
      var message = [shortMessage || 'An error occurred.', ''].concat(_toConsumableArray(args.metaMessages ? [].concat(_toConsumableArray(args.metaMessages), ['']) : []), _toConsumableArray(docsUrl ? ["Docs: ".concat(docsUrl)] : []), _toConsumableArray(details ? ["Details: ".concat(details)] : []), _toConsumableArray(errorConfig.version ? ["Version: ".concat(errorConfig.version)] : [])).join('\n');
      _this = _callSuper(this, BaseError, [message, args.cause ? {
        cause: args.cause
      } : undefined]);
      Object.defineProperty(_this, "details", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "docsPath", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "metaMessages", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "shortMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "version", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "name", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 'BaseError'
      });
      _this.details = details;
      _this.docsPath = docsPath;
      _this.metaMessages = args.metaMessages;
      _this.name = (_args$name = args.name) !== null && _args$name !== void 0 ? _args$name : _this.name;
      _this.shortMessage = shortMessage;
      _this.version = version;
      return _this;
    }
    _inherits(BaseError, _Error);
    return _createClass(BaseError, [{
      key: "walk",
      value: function walk(fn) {
        return _walk(this, fn);
      }
    }]);
  }(/*#__PURE__*/_wrapNativeSuper(Error));
  function _walk(err, fn) {
    if (fn !== null && fn !== void 0 && fn(err)) return err;
    if (err && _typeof(err) === 'object' && 'cause' in err) return _walk(err.cause, fn);
    return fn ? null : err;
  }

  var AbiEncodingLengthMismatchError = /*#__PURE__*/function (_BaseError8) {
    function AbiEncodingLengthMismatchError(_ref7) {
      var expectedLength = _ref7.expectedLength,
        givenLength = _ref7.givenLength;
      _classCallCheck(this, AbiEncodingLengthMismatchError);
      return _callSuper(this, AbiEncodingLengthMismatchError, [['ABI encoding params/values length mismatch.', "Expected length (params): ".concat(expectedLength), "Given length (values): ".concat(givenLength)].join('\n'), {
        name: 'AbiEncodingLengthMismatchError'
      }]);
    }
    _inherits(AbiEncodingLengthMismatchError, _BaseError8);
    return _createClass(AbiEncodingLengthMismatchError);
  }(BaseError);
  var BytesSizeMismatchError = /*#__PURE__*/function (_BaseError19) {
    function BytesSizeMismatchError(_ref17) {
      var expectedSize = _ref17.expectedSize,
        givenSize = _ref17.givenSize;
      _classCallCheck(this, BytesSizeMismatchError);
      return _callSuper(this, BytesSizeMismatchError, ["Expected bytes".concat(expectedSize, ", got bytes").concat(givenSize, "."), {
        name: 'BytesSizeMismatchError'
      }]);
    }
    _inherits(BytesSizeMismatchError, _BaseError19);
    return _createClass(BytesSizeMismatchError);
  }(BaseError);
  var UnsupportedPackedAbiType = /*#__PURE__*/function (_BaseError26) {
    function UnsupportedPackedAbiType(type) {
      _classCallCheck(this, UnsupportedPackedAbiType);
      return _callSuper(this, UnsupportedPackedAbiType, ["Type \"".concat(type, "\" is not supported for packed encoding."), {
        name: 'UnsupportedPackedAbiType'
      }]);
    }
    _inherits(UnsupportedPackedAbiType, _BaseError26);
    return _createClass(UnsupportedPackedAbiType);
  }(BaseError);

  var SizeExceedsPaddingSizeError = /*#__PURE__*/function (_BaseError2) {
    function SizeExceedsPaddingSizeError(_ref2) {
      var size = _ref2.size,
        targetSize = _ref2.targetSize,
        type = _ref2.type;
      _classCallCheck(this, SizeExceedsPaddingSizeError);
      return _callSuper(this, SizeExceedsPaddingSizeError, ["".concat(type.charAt(0).toUpperCase()).concat(type.slice(1).toLowerCase(), " size (").concat(size, ") exceeds padding size (").concat(targetSize, ")."), {
        name: 'SizeExceedsPaddingSizeError'
      }]);
    }
    _inherits(SizeExceedsPaddingSizeError, _BaseError2);
    return _createClass(SizeExceedsPaddingSizeError);
  }(BaseError);

  function pad(hexOrBytes) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      dir = _ref.dir,
      _ref$size = _ref.size,
      size = _ref$size === void 0 ? 32 : _ref$size;
    if (typeof hexOrBytes === 'string') return padHex(hexOrBytes, {
      dir: dir,
      size: size
    });
    return padBytes(hexOrBytes, {
      dir: dir,
      size: size
    });
  }
  function padHex(hex_) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      dir = _ref2.dir,
      _ref2$size = _ref2.size,
      size = _ref2$size === void 0 ? 32 : _ref2$size;
    if (size === null) return hex_;
    var hex = hex_.replace('0x', '');
    if (hex.length > size * 2) throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'hex'
    });
    return "0x".concat(hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0'));
  }
  function padBytes(bytes) {
    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      dir = _ref3.dir,
      _ref3$size = _ref3.size,
      size = _ref3$size === void 0 ? 32 : _ref3$size;
    if (size === null) return bytes;
    if (bytes.length > size) throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size,
      type: 'bytes'
    });
    var paddedBytes = new Uint8Array(size);
    for (var i = 0; i < size; i++) {
      var padEnd = dir === 'right';
      paddedBytes[padEnd ? i : size - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
    }
    return paddedBytes;
  }

  var IntegerOutOfRangeError = /*#__PURE__*/function (_BaseError) {
    function IntegerOutOfRangeError(_ref) {
      var max = _ref.max,
        min = _ref.min,
        signed = _ref.signed,
        size = _ref.size,
        value = _ref.value;
      _classCallCheck(this, IntegerOutOfRangeError);
      return _callSuper(this, IntegerOutOfRangeError, ["Number \"".concat(value, "\" is not in safe ").concat(size ? "".concat(size * 8, "-bit ").concat(signed ? 'signed' : 'unsigned', " ") : '', "integer range ").concat(max ? "(".concat(min, " to ").concat(max, ")") : "(above ".concat(min, ")")), {
        name: 'IntegerOutOfRangeError'
      }]);
    }
    _inherits(IntegerOutOfRangeError, _BaseError);
    return _createClass(IntegerOutOfRangeError);
  }(BaseError);
  var SizeOverflowError = /*#__PURE__*/function (_BaseError5) {
    function SizeOverflowError(_ref2) {
      var givenSize = _ref2.givenSize,
        maxSize = _ref2.maxSize;
      _classCallCheck(this, SizeOverflowError);
      return _callSuper(this, SizeOverflowError, ["Size cannot exceed ".concat(maxSize, " bytes. Given size: ").concat(givenSize, " bytes."), {
        name: 'SizeOverflowError'
      }]);
    }
    _inherits(SizeOverflowError, _BaseError5);
    return _createClass(SizeOverflowError);
  }(BaseError);

  function assertSize(hexOrBytes, _ref) {
    var size$1 = _ref.size;
    if (size(hexOrBytes) > size$1) throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size$1
    });
  }

  var hexes = /*#__PURE__*/Array.from({
    length: 256
  }, function (_v, i) {
    return i.toString(16).padStart(2, '0');
  });
  /**
   * Encodes a string, number, bigint, or ByteArray into a hex string
   *
   * - Docs: https://viem.sh/docs/utilities/toHex
   * - Example: https://viem.sh/docs/utilities/toHex#usage
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Hex value.
   *
   * @example
   * import { toHex } from 'viem'
   * const data = toHex('Hello world')
   * // '0x48656c6c6f20776f726c6421'
   *
   * @example
   * import { toHex } from 'viem'
   * const data = toHex(420)
   * // '0x1a4'
   *
   * @example
   * import { toHex } from 'viem'
   * const data = toHex('Hello world', { size: 32 })
   * // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
   */
  function toHex(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (typeof value === 'number' || typeof value === 'bigint') return numberToHex(value, opts);
    if (typeof value === 'string') {
      return stringToHex(value, opts);
    }
    if (typeof value === 'boolean') return boolToHex(value, opts);
    return bytesToHex(value, opts);
  }
  /**
   * Encodes a boolean into a hex string
   *
   * - Docs: https://viem.sh/docs/utilities/toHex#booltohex
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Hex value.
   *
   * @example
   * import { boolToHex } from 'viem'
   * const data = boolToHex(true)
   * // '0x1'
   *
   * @example
   * import { boolToHex } from 'viem'
   * const data = boolToHex(false)
   * // '0x0'
   *
   * @example
   * import { boolToHex } from 'viem'
   * const data = boolToHex(true, { size: 32 })
   * // '0x0000000000000000000000000000000000000000000000000000000000000001'
   */
  function boolToHex(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var hex = "0x".concat(Number(value));
    if (typeof opts.size === 'number') {
      assertSize(hex, {
        size: opts.size
      });
      return pad(hex, {
        size: opts.size
      });
    }
    return hex;
  }
  /**
   * Encodes a bytes array into a hex string
   *
   * - Docs: https://viem.sh/docs/utilities/toHex#bytestohex
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Hex value.
   *
   * @example
   * import { bytesToHex } from 'viem'
   * const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
   * // '0x48656c6c6f20576f726c6421'
   *
   * @example
   * import { bytesToHex } from 'viem'
   * const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
   * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
   */
  function bytesToHex(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var string = '';
    for (var i = 0; i < value.length; i++) {
      string += hexes[value[i]];
    }
    var hex = "0x".concat(string);
    if (typeof opts.size === 'number') {
      assertSize(hex, {
        size: opts.size
      });
      return pad(hex, {
        dir: 'right',
        size: opts.size
      });
    }
    return hex;
  }
  /**
   * Encodes a number or bigint into a hex string
   *
   * - Docs: https://viem.sh/docs/utilities/toHex#numbertohex
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Hex value.
   *
   * @example
   * import { numberToHex } from 'viem'
   * const data = numberToHex(420)
   * // '0x1a4'
   *
   * @example
   * import { numberToHex } from 'viem'
   * const data = numberToHex(420, { size: 32 })
   * // '0x00000000000000000000000000000000000000000000000000000000000001a4'
   */
  function numberToHex(value_) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var signed = opts.signed,
      size = opts.size;
    var value = BigInt(value_);
    var maxValue;
    if (size) {
      if (signed) maxValue = (1n << BigInt(size) * 8n - 1n) - 1n;else maxValue = Math.pow(2n, BigInt(size) * 8n) - 1n;
    } else if (typeof value_ === 'number') {
      maxValue = BigInt(Number.MAX_SAFE_INTEGER);
    }
    var minValue = typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0;
    if (maxValue && value > maxValue || value < minValue) {
      var suffix = typeof value_ === 'bigint' ? 'n' : '';
      throw new IntegerOutOfRangeError({
        max: maxValue ? "".concat(maxValue).concat(suffix) : undefined,
        min: "".concat(minValue).concat(suffix),
        signed: signed,
        size: size,
        value: "".concat(value_).concat(suffix)
      });
    }
    var hex = "0x".concat((signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value).toString(16));
    if (size) return pad(hex, {
      size: size
    });
    return hex;
  }
  var encoder$2 = /*#__PURE__*/new TextEncoder();
  /**
   * Encodes a UTF-8 string into a hex string
   *
   * - Docs: https://viem.sh/docs/utilities/toHex#stringtohex
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Hex value.
   *
   * @example
   * import { stringToHex } from 'viem'
   * const data = stringToHex('Hello World!')
   * // '0x48656c6c6f20576f726c6421'
   *
   * @example
   * import { stringToHex } from 'viem'
   * const data = stringToHex('Hello World!', { size: 32 })
   * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
   */
  function stringToHex(value_) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var value = encoder$2.encode(value_);
    return bytesToHex(value, opts);
  }

  var encoder$1 = /*#__PURE__*/new TextEncoder();
  /**
   * Encodes a UTF-8 string, hex value, bigint, number or boolean to a byte array.
   *
   * - Docs: https://viem.sh/docs/utilities/toBytes
   * - Example: https://viem.sh/docs/utilities/toBytes#usage
   *
   * @param value Value to encode.
   * @param opts Options.
   * @returns Byte array value.
   *
   * @example
   * import { toBytes } from 'viem'
   * const data = toBytes('Hello world')
   * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
   *
   * @example
   * import { toBytes } from 'viem'
   * const data = toBytes(420)
   * // Uint8Array([1, 164])
   *
   * @example
   * import { toBytes } from 'viem'
   * const data = toBytes(420, { size: 4 })
   * // Uint8Array([0, 0, 1, 164])
   */
  function toBytes$1(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (typeof value === 'number' || typeof value === 'bigint') return numberToBytes(value, opts);
    if (typeof value === 'boolean') return boolToBytes(value, opts);
    if (isHex(value)) return hexToBytes(value, opts);
    return stringToBytes(value, opts);
  }
  /**
   * Encodes a boolean into a byte array.
   *
   * - Docs: https://viem.sh/docs/utilities/toBytes#booltobytes
   *
   * @param value Boolean value to encode.
   * @param opts Options.
   * @returns Byte array value.
   *
   * @example
   * import { boolToBytes } from 'viem'
   * const data = boolToBytes(true)
   * // Uint8Array([1])
   *
   * @example
   * import { boolToBytes } from 'viem'
   * const data = boolToBytes(true, { size: 32 })
   * // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
   */
  function boolToBytes(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var bytes = new Uint8Array(1);
    bytes[0] = Number(value);
    if (typeof opts.size === 'number') {
      assertSize(bytes, {
        size: opts.size
      });
      return pad(bytes, {
        size: opts.size
      });
    }
    return bytes;
  }
  // We use very optimized technique to convert hex string to byte array
  var charCodeMap = {
    zero: 48,
    nine: 57,
    A: 65,
    F: 70,
    a: 97,
    f: 102
  };
  function charCodeToBase16(_char) {
    if (_char >= charCodeMap.zero && _char <= charCodeMap.nine) return _char - charCodeMap.zero;
    if (_char >= charCodeMap.A && _char <= charCodeMap.F) return _char - (charCodeMap.A - 10);
    if (_char >= charCodeMap.a && _char <= charCodeMap.f) return _char - (charCodeMap.a - 10);
    return undefined;
  }
  /**
   * Encodes a hex string into a byte array.
   *
   * - Docs: https://viem.sh/docs/utilities/toBytes#hextobytes
   *
   * @param hex Hex string to encode.
   * @param opts Options.
   * @returns Byte array value.
   *
   * @example
   * import { hexToBytes } from 'viem'
   * const data = hexToBytes('0x48656c6c6f20776f726c6421')
   * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
   *
   * @example
   * import { hexToBytes } from 'viem'
   * const data = hexToBytes('0x48656c6c6f20776f726c6421', { size: 32 })
   * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
   */
  function hexToBytes(hex_) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var hex = hex_;
    if (opts.size) {
      assertSize(hex, {
        size: opts.size
      });
      hex = pad(hex, {
        dir: 'right',
        size: opts.size
      });
    }
    var hexString = hex.slice(2);
    if (hexString.length % 2) hexString = "0".concat(hexString);
    var length = hexString.length / 2;
    var bytes = new Uint8Array(length);
    for (var index = 0, j = 0; index < length; index++) {
      var nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
      var nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
      if (nibbleLeft === undefined || nibbleRight === undefined) {
        throw new BaseError("Invalid byte sequence (\"".concat(hexString[j - 2]).concat(hexString[j - 1], "\" in \"").concat(hexString, "\")."));
      }
      bytes[index] = nibbleLeft * 16 + nibbleRight;
    }
    return bytes;
  }
  /**
   * Encodes a number into a byte array.
   *
   * - Docs: https://viem.sh/docs/utilities/toBytes#numbertobytes
   *
   * @param value Number to encode.
   * @param opts Options.
   * @returns Byte array value.
   *
   * @example
   * import { numberToBytes } from 'viem'
   * const data = numberToBytes(420)
   * // Uint8Array([1, 164])
   *
   * @example
   * import { numberToBytes } from 'viem'
   * const data = numberToBytes(420, { size: 4 })
   * // Uint8Array([0, 0, 1, 164])
   */
  function numberToBytes(value, opts) {
    var hex = numberToHex(value, opts);
    return hexToBytes(hex);
  }
  /**
   * Encodes a UTF-8 string into a byte array.
   *
   * - Docs: https://viem.sh/docs/utilities/toBytes#stringtobytes
   *
   * @param value String to encode.
   * @param opts Options.
   * @returns Byte array value.
   *
   * @example
   * import { stringToBytes } from 'viem'
   * const data = stringToBytes('Hello world!')
   * // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
   *
   * @example
   * import { stringToBytes } from 'viem'
   * const data = stringToBytes('Hello world!', { size: 32 })
   * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
   */
  function stringToBytes(value) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var bytes = encoder$1.encode(value);
    if (typeof opts.size === 'number') {
      assertSize(bytes, {
        size: opts.size
      });
      return pad(bytes, {
        dir: 'right',
        size: opts.size
      });
    }
    return bytes;
  }

  function number(n) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("positive integer expected, not ".concat(n));
  }
  // copied from utils
  function isBytes$1(a) {
    return a instanceof Uint8Array || a != null && _typeof(a) === 'object' && a.constructor.name === 'Uint8Array';
  }
  function bytes(b) {
    if (!isBytes$1(b)) throw new Error('Uint8Array expected');
    for (var _len = arguments.length, lengths = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      lengths[_key - 1] = arguments[_key];
    }
    if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length ".concat(lengths, ", not of length=").concat(b.length));
  }
  function exists(instance) {
    var checkFinished = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    if (instance.destroyed) throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished) throw new Error('Hash#digest() has already been called');
  }
  function output(out, instance) {
    bytes(out);
    var min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least ".concat(min));
    }
  }

  var U32_MASK64 = /* @__PURE__ */BigInt(Math.pow(2, 32) - 1);
  var _32n = /* @__PURE__ */BigInt(32);
  // We are not using BigUint64Array, because they are extremely slow as per 2022
  function fromBig(n) {
    var le = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (le) return {
      h: Number(n & U32_MASK64),
      l: Number(n >> _32n & U32_MASK64)
    };
    return {
      h: Number(n >> _32n & U32_MASK64) | 0,
      l: Number(n & U32_MASK64) | 0
    };
  }
  function split(lst) {
    var le = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var Ah = new Uint32Array(lst.length);
    var Al = new Uint32Array(lst.length);
    for (var i = 0; i < lst.length; i++) {
      var _fromBig = fromBig(lst[i], le),
        h = _fromBig.h,
        l = _fromBig.l;
      var _ref = [h, l];
      Ah[i] = _ref[0];
      Al[i] = _ref[1];
    }
    return [Ah, Al];
  }
  // Left rotate for Shift in [1, 32)
  var rotlSH = function rotlSH(h, l, s) {
    return h << s | l >>> 32 - s;
  };
  var rotlSL = function rotlSL(h, l, s) {
    return l << s | h >>> 32 - s;
  };
  // Left rotate for Shift in (32, 64), NOTE: 32 is special case.
  var rotlBH = function rotlBH(h, l, s) {
    return l << s - 32 | h >>> 64 - s;
  };
  var rotlBL = function rotlBL(h, l, s) {
    return h << s - 32 | l >>> 64 - s;
  };

  var u32 = function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  };
  var isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
  // The byte swap operation for uint32
  var byteSwap = function byteSwap(word) {
    return word << 24 & 0xff000000 | word << 8 & 0xff0000 | word >>> 8 & 0xff00 | word >>> 24 & 0xff;
  };
  // In place byte swap for Uint32Array
  function byteSwap32(arr) {
    for (var i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
  }
  function utf8ToBytes(str) {
    if (typeof str !== 'string') throw new Error("utf8ToBytes expected string, got ".concat(_typeof(str)));
    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
  }
  /**
   * Normalizes (non-hex) string or Uint8Array to Uint8Array.
   * Warning: when Uint8Array is passed, it would NOT get copied.
   * Keep in mind for future mutable operations.
   */
  function toBytes(data) {
    if (typeof data === 'string') data = utf8ToBytes(data);
    bytes(data);
    return data;
  }
  // For runtime check if class implements interface
  var Hash = /*#__PURE__*/function () {
    function Hash() {
      _classCallCheck(this, Hash);
    }
    return _createClass(Hash, [{
      key: "clone",
      value:
      // Safe version that clones internal state
      function clone() {
        return this._cloneInto();
      }
    }]);
  }();
  function wrapConstructor(hashCons) {
    var hashC = function hashC(msg) {
      return hashCons().update(toBytes(msg)).digest();
    };
    var tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = function () {
      return hashCons();
    };
    return hashC;
  }

  // SHA3 (keccak) is based on a new design: basically, the internal state is bigger than output size.
  // It's called a sponge function.
  // Various per round constants calculations
  var SHA3_PI = [];
  var SHA3_ROTL = [];
  var _SHA3_IOTA = [];
  var _0n = /* @__PURE__ */BigInt(0);
  var _1n = /* @__PURE__ */BigInt(1);
  var _2n = /* @__PURE__ */BigInt(2);
  var _7n = /* @__PURE__ */BigInt(7);
  var _256n = /* @__PURE__ */BigInt(256);
  var _0x71n = /* @__PURE__ */BigInt(0x71);
  for (var round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    var _ref = [y, (2 * x + 3 * y) % 5];
    x = _ref[0];
    y = _ref[1];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
    // Iota
    var t = _0n;
    for (var j = 0; j < 7; j++) {
      R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
      if (R & _2n) t ^= _1n << (_1n << /* @__PURE__ */BigInt(j)) - _1n;
    }
    _SHA3_IOTA.push(t);
  }
  var _split = /* @__PURE__ */split(_SHA3_IOTA, true),
    _split2 = _slicedToArray(_split, 2),
    SHA3_IOTA_H = _split2[0],
    SHA3_IOTA_L = _split2[1];
  // Left rotation (without 0, 32, 64)
  var rotlH = function rotlH(h, l, s) {
    return s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
  };
  var rotlL = function rotlL(h, l, s) {
    return s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
  };
  // Same as keccakf1600, but allows to skip some rounds
  function keccakP(s) {
    var rounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 24;
    var B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (var _round = 24 - rounds; _round < 24; _round++) {
      // Theta θ
      for (var _x = 0; _x < 10; _x++) B[_x] = s[_x] ^ s[_x + 10] ^ s[_x + 20] ^ s[_x + 30] ^ s[_x + 40];
      for (var _x2 = 0; _x2 < 10; _x2 += 2) {
        var idx1 = (_x2 + 8) % 10;
        var idx0 = (_x2 + 2) % 10;
        var B0 = B[idx0];
        var B1 = B[idx0 + 1];
        var Th = rotlH(B0, B1, 1) ^ B[idx1];
        var Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (var _y = 0; _y < 50; _y += 10) {
          s[_x2 + _y] ^= Th;
          s[_x2 + _y + 1] ^= Tl;
        }
      }
      // Rho (ρ) and Pi (π)
      var curH = s[2];
      var curL = s[3];
      for (var _t = 0; _t < 24; _t++) {
        var shift = SHA3_ROTL[_t];
        var _Th = rotlH(curH, curL, shift);
        var _Tl = rotlL(curH, curL, shift);
        var PI = SHA3_PI[_t];
        curH = s[PI];
        curL = s[PI + 1];
        s[PI] = _Th;
        s[PI + 1] = _Tl;
      }
      // Chi (χ)
      for (var _y2 = 0; _y2 < 50; _y2 += 10) {
        for (var _x3 = 0; _x3 < 10; _x3++) B[_x3] = s[_y2 + _x3];
        for (var _x4 = 0; _x4 < 10; _x4++) s[_y2 + _x4] ^= ~B[(_x4 + 2) % 10] & B[(_x4 + 4) % 10];
      }
      // Iota (ι)
      s[0] ^= SHA3_IOTA_H[_round];
      s[1] ^= SHA3_IOTA_L[_round];
    }
    B.fill(0);
  }
  var Keccak = /*#__PURE__*/function (_Hash) {
    // NOTE: we accept arguments in bytes instead of bits here.
    function Keccak(blockLen, suffix, outputLen) {
      var _this;
      var enableXOF = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var rounds = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 24;
      _classCallCheck(this, Keccak);
      _this = _callSuper(this, Keccak);
      _this.blockLen = blockLen;
      _this.suffix = suffix;
      _this.outputLen = outputLen;
      _this.enableXOF = enableXOF;
      _this.rounds = rounds;
      _this.pos = 0;
      _this.posOut = 0;
      _this.finished = false;
      _this.destroyed = false;
      // Can be passed from user as dkLen
      number(outputLen);
      // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
      if (0 >= _this.blockLen || _this.blockLen >= 200) throw new Error('Sha3 supports only keccak-f1600 function');
      _this.state = new Uint8Array(200);
      _this.state32 = u32(_this.state);
      return _this;
    }
    _inherits(Keccak, _Hash);
    return _createClass(Keccak, [{
      key: "keccak",
      value: function keccak() {
        if (!isLE) byteSwap32(this.state32);
        keccakP(this.state32, this.rounds);
        if (!isLE) byteSwap32(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
    }, {
      key: "update",
      value: function update(data) {
        exists(this);
        var blockLen = this.blockLen,
          state = this.state;
        data = toBytes(data);
        var len = data.length;
        for (var pos = 0; pos < len;) {
          var take = Math.min(blockLen - this.pos, len - pos);
          for (var i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen) this.keccak();
        }
        return this;
      }
    }, {
      key: "finish",
      value: function finish() {
        if (this.finished) return;
        this.finished = true;
        var state = this.state,
          suffix = this.suffix,
          pos = this.pos,
          blockLen = this.blockLen;
        // Do the padding
        state[pos] ^= suffix;
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1) this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
      }
    }, {
      key: "writeInto",
      value: function writeInto(out) {
        exists(this, false);
        bytes(out);
        this.finish();
        var bufferOut = this.state;
        var blockLen = this.blockLen;
        for (var pos = 0, len = out.length; pos < len;) {
          if (this.posOut >= blockLen) this.keccak();
          var take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
    }, {
      key: "xofInto",
      value: function xofInto(out) {
        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
        if (!this.enableXOF) throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
      }
    }, {
      key: "xof",
      value: function xof(bytes) {
        number(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
    }, {
      key: "digestInto",
      value: function digestInto(out) {
        output(out, this);
        if (this.finished) throw new Error('digest() was already called');
        this.writeInto(out);
        this.destroy();
        return out;
      }
    }, {
      key: "digest",
      value: function digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.destroyed = true;
        this.state.fill(0);
      }
    }, {
      key: "_cloneInto",
      value: function _cloneInto(to) {
        var blockLen = this.blockLen,
          suffix = this.suffix,
          outputLen = this.outputLen,
          rounds = this.rounds,
          enableXOF = this.enableXOF;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    }]);
  }(Hash);
  var gen = function gen(suffix, blockLen, outputLen) {
    return wrapConstructor(function () {
      return new Keccak(blockLen, suffix, outputLen);
    });
  };
  /**
   * keccak-256 hash function. Different from SHA3-256.
   * @param message - that would be hashed
   */
  var keccak_256 = /* @__PURE__ */gen(0x01, 136, 256 / 8);

  function keccak256(value, to_) {
    var to = to_ || 'hex';
    var bytes = keccak_256(isHex(value, {
      strict: false
    }) ? toBytes$1(value) : value);
    if (to === 'bytes') return bytes;
    return toHex(bytes);
  }

  var InvalidAddressError = /*#__PURE__*/function (_BaseError) {
    function InvalidAddressError(_ref) {
      var address = _ref.address;
      _classCallCheck(this, InvalidAddressError);
      return _callSuper(this, InvalidAddressError, ["Address \"".concat(address, "\" is invalid."), {
        metaMessages: ['- Address must be a hex value of 20 bytes (40 hex characters).', '- Address must match its checksum counterpart.'],
        name: 'InvalidAddressError'
      }]);
    }
    _inherits(InvalidAddressError, _BaseError);
    return _createClass(InvalidAddressError);
  }(BaseError);

  /**
   * Map with a LRU (Least recently used) policy.
   *
   * @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
   */
  var LruMap = /*#__PURE__*/function (_Map) {
    function LruMap(size) {
      var _this;
      _classCallCheck(this, LruMap);
      _this = _callSuper(this, LruMap);
      Object.defineProperty(_this, "maxSize", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this.maxSize = size;
      return _this;
    }
    _inherits(LruMap, _Map);
    return _createClass(LruMap, [{
      key: "get",
      value: function get(key) {
        var value = _superPropGet(LruMap, "get", this, 3)([key]);
        if (_superPropGet(LruMap, "has", this, 3)([key]) && value !== undefined) {
          this["delete"](key);
          _superPropGet(LruMap, "set", this, 3)([key, value]);
        }
        return value;
      }
    }, {
      key: "set",
      value: function set(key, value) {
        _superPropGet(LruMap, "set", this, 3)([key, value]);
        if (this.maxSize && this.size > this.maxSize) {
          var firstKey = this.keys().next().value;
          if (firstKey) this["delete"](firstKey);
        }
        return this;
      }
    }]);
  }(/*#__PURE__*/_wrapNativeSuper(Map));

  var checksumAddressCache = /*#__PURE__*/new LruMap(8192);
  function checksumAddress(address_,
  /**
   * Warning: EIP-1191 checksum addresses are generally not backwards compatible with the
   * wider Ethereum ecosystem, meaning it will break when validated against an application/tool
   * that relies on EIP-55 checksum encoding (checksum without chainId).
   *
   * It is highly recommended to not use this feature unless you
   * know what you are doing.
   *
   * See more: https://github.com/ethereum/EIPs/issues/1121
   */
  chainId) {
    if (checksumAddressCache.has("".concat(address_, ".").concat(chainId))) return checksumAddressCache.get("".concat(address_, ".").concat(chainId));
    var hexAddress = chainId ? "".concat(chainId).concat(address_.toLowerCase()) : address_.substring(2).toLowerCase();
    var hash = keccak256(stringToBytes(hexAddress), 'bytes');
    var address = (chainId ? hexAddress.substring("".concat(chainId, "0x").length) : hexAddress).split('');
    for (var i = 0; i < 40; i += 2) {
      if (hash[i >> 1] >> 4 >= 8 && address[i]) {
        address[i] = address[i].toUpperCase();
      }
      if ((hash[i >> 1] & 0x0f) >= 8 && address[i + 1]) {
        address[i + 1] = address[i + 1].toUpperCase();
      }
    }
    var result = "0x".concat(address.join(''));
    checksumAddressCache.set("".concat(address_, ".").concat(chainId), result);
    return result;
  }

  var addressRegex = /^0x[a-fA-F0-9]{40}$/;
  /** @internal */
  var isAddressCache = /*#__PURE__*/new LruMap(8192);
  function isAddress(address, options) {
    var _ref = options !== null && options !== void 0 ? options : {},
      _ref$strict = _ref.strict,
      strict = _ref$strict === void 0 ? true : _ref$strict;
    var cacheKey = "".concat(address, ".").concat(strict);
    if (isAddressCache.has(cacheKey)) return isAddressCache.get(cacheKey);
    var result = function () {
      if (!addressRegex.test(address)) return false;
      if (address.toLowerCase() === address) return true;
      if (strict) return checksumAddress(address) === address;
      return true;
    }();
    isAddressCache.set(cacheKey, result);
    return result;
  }

  function concatHex(values) {
    return "0x".concat(values.reduce(function (acc, x) {
      return acc + x.replace('0x', '');
    }, ''));
  }

  var arrayRegex = /^(.*)\[([0-9]*)\]$/;
  // `bytes<M>`: binary type of `M` bytes, `0 < M <= 32`
  // https://regexr.com/6va55
  var bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
  // `(u)int<M>`: (un)signed integer type of `M` bits, `0 < M <= 256`, `M % 8 == 0`
  // https://regexr.com/6v8hp
  var integerRegex = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;

  function encodePacked(types, values) {
    if (types.length !== values.length) throw new AbiEncodingLengthMismatchError({
      expectedLength: types.length,
      givenLength: values.length
    });
    var data = [];
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var value = values[i];
      data.push(encode(type, value));
    }
    return concatHex(data);
  }
  function encode(type, value) {
    var isArray = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (type === 'address') {
      var address = value;
      if (!isAddress(address)) throw new InvalidAddressError({
        address: address
      });
      return pad(address.toLowerCase(), {
        size: isArray ? 32 : null
      });
    }
    if (type === 'string') return stringToHex(value);
    if (type === 'bytes') return value;
    if (type === 'bool') return pad(boolToHex(value), {
      size: isArray ? 32 : 1
    });
    var intMatch = type.match(integerRegex);
    if (intMatch) {
      var _intMatch = _slicedToArray(intMatch, 3);
        _intMatch[0];
        var baseType = _intMatch[1],
        _intMatch$ = _intMatch[2],
        bits = _intMatch$ === void 0 ? '256' : _intMatch$;
      var size = Number.parseInt(bits) / 8;
      return numberToHex(value, {
        size: isArray ? 32 : size,
        signed: baseType === 'int'
      });
    }
    var bytesMatch = type.match(bytesRegex);
    if (bytesMatch) {
      var _bytesMatch = _slicedToArray(bytesMatch, 2);
        _bytesMatch[0];
        var _size = _bytesMatch[1];
      if (Number.parseInt(_size) !== (value.length - 2) / 2) throw new BytesSizeMismatchError({
        expectedSize: Number.parseInt(_size),
        givenSize: (value.length - 2) / 2
      });
      return pad(value, {
        dir: 'right',
        size: isArray ? 32 : null
      });
    }
    var arrayMatch = type.match(arrayRegex);
    if (arrayMatch && Array.isArray(value)) {
      var _arrayMatch = _slicedToArray(arrayMatch, 2);
        _arrayMatch[0];
        var childType = _arrayMatch[1];
      var data = [];
      for (var i = 0; i < value.length; i++) {
        data.push(encode(childType, value[i], true));
      }
      if (data.length === 0) return '0x';
      return concatHex(data);
    }
    throw new UnsupportedPackedAbiType(type);
  }

  function isBytes(value) {
    if (!value) return false;
    if (_typeof(value) !== 'object') return false;
    if (!('BYTES_PER_ELEMENT' in value)) return false;
    return value.BYTES_PER_ELEMENT === 1 && value.constructor.name === 'Uint8Array';
  }

  function hashToField(input) {
    if (isBytes(input) || isHex(input)) return hashEncodedBytes(input);
    return hashString(input);
  }
  function packAndEncode(input) {
    var _input$reduce = input.reduce(function (_ref, _ref2) {
        var _ref3 = _slicedToArray(_ref, 2),
          types2 = _ref3[0],
          values2 = _ref3[1];
        var _ref4 = _slicedToArray(_ref2, 2),
          type = _ref4[0],
          value = _ref4[1];
        types2.push(type);
        values2.push(value);
        return [types2, values2];
      }, [[], []]),
      _input$reduce2 = _slicedToArray(_input$reduce, 2),
      types = _input$reduce2[0],
      values = _input$reduce2[1];
    return hashEncodedBytes(encodePacked(types, values));
  }
  function hashString(input) {
    var bytesInput = buffer.Buffer.from(input);
    return hashEncodedBytes(bytesInput);
  }
  function hashEncodedBytes(input) {
    var hash = BigInt(keccak256(input)) >> 8n;
    var rawDigest = hash.toString(16);
    return {
      hash: hash,
      digest: "0x".concat(rawDigest.padStart(64, "0"))
    };
  }
  var generateSignal = function generateSignal(signal) {
    if (!signal || typeof signal === "string") return hashToField(signal !== null && signal !== void 0 ? signal : "");
    return packAndEncode(signal.types.map(function (type, index) {
      return [type, signal.values[index]];
    }));
  };
  var encodeAction = function encodeAction(action) {
    if (!action) return "";
    if (typeof action === "string") return action;
    return action.types.map(function (type, index) {
      return "".concat(type, "(").concat(action.values[index], ")");
    }).join(",");
  };

  var createStoreImpl = function createStoreImpl(createState) {
    var state;
    var listeners = /* @__PURE__ */new Set();
    var setState = function setState(partial, replace) {
      var nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        var previousState = state;
        state = (replace != null ? replace : _typeof(nextState) !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach(function (listener) {
          return listener(state, previousState);
        });
      }
    };
    var getState = function getState() {
      return state;
    };
    var getInitialState = function getInitialState() {
      return initialState;
    };
    var subscribe = function subscribe(listener) {
      listeners.add(listener);
      return function () {
        return listeners["delete"](listener);
      };
    };
    var destroy = function destroy() {
      if ((_objectSpread2(_objectSpread2({}, Object.fromEntries(Object.entries({}).filter(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 1),
          k = _ref2[0];
        return /^VITE_/.test(k);
      }))), {}, {
        NODE_ENV: "product" ,
        MODE: "product" ,
        BASE_URL: '/',
        DEV: "product" !== 'production',
        PROD: "product" === 'production'
      }) ? "product"  : void 0) !== "production") {
        console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.");
      }
      listeners.clear();
    };
    var api = {
      setState: setState,
      getState: getState,
      getInitialState: getInitialState,
      subscribe: subscribe,
      destroy: destroy
    };
    var initialState = state = createState(setState, getState, api);
    return api;
  };
  var createStore = function createStore(createState) {
    return createState ? createStoreImpl(createState) : createStoreImpl;
  };

  var ReactExports = {};

  var emptyModule = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': ReactExports
  });

  var withSelector = {exports: {}};

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(emptyModule);

  var shim = {exports: {}};

  var useSyncExternalStoreShim_development = {};

  var hasRequiredUseSyncExternalStoreShim_development;
  function requireUseSyncExternalStoreShim_development() {
    if (hasRequiredUseSyncExternalStoreShim_development) return useSyncExternalStoreShim_development;
    hasRequiredUseSyncExternalStoreShim_development = 1;
    {
      (function () {

        /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === 'function') {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var React = require$$0;
        var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning('error', format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          // When changing this logic, you might want to also
          // update consoleWithStackDev.www.js as well.
          {
            var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame.getStackAddendum();
            if (stack !== '') {
              format += '%s';
              args = args.concat([stack]);
            } // eslint-disable-next-line react-internal/safe-string-coercion

            var argsWithFormat = args.map(function (item) {
              return String(item);
            }); // Careful: RN currently depends on this prefix

            argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
            // breaks IE9: https://github.com/facebook/react/issues/13610
            // eslint-disable-next-line react-internal/no-production-logging

            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }

        /**
         * inlined Object.is polyfill to avoid requiring consumers ship their own
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
         */
        function is(x, y) {
          return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
          ;
        }
        var objectIs = typeof Object.is === 'function' ? Object.is : is;

        // dispatch for CommonJS interop named imports.

        var useState = React.useState,
          useEffect = React.useEffect,
          useLayoutEffect = React.useLayoutEffect,
          useDebugValue = React.useDebugValue;
        var didWarnOld18Alpha = false;
        var didWarnUncachedGetSnapshot = false; // Disclaimer: This shim breaks many of the rules of React, and only works
        // because of a very particular set of implementation details and assumptions
        // -- change any one of them and it will break. The most important assumption
        // is that updates are always synchronous, because concurrent rendering is
        // only available in versions of React that also have a built-in
        // useSyncExternalStore API. And we only use this shim when the built-in API
        // does not exist.
        //
        // Do not assume that the clever hacks used by this hook also work in general.
        // The point of this shim is to replace the need for hacks by other libraries.

        function useSyncExternalStore(subscribe, getSnapshot,
        // Note: The shim does not use getServerSnapshot, because pre-18 versions of
        // React do not expose a way to check if we're hydrating. So users of the shim
        // will need to track that themselves and return the correct value
        // from `getSnapshot`.
        getServerSnapshot) {
          {
            if (!didWarnOld18Alpha) {
              if (React.startTransition !== undefined) {
                didWarnOld18Alpha = true;
                error('You are using an outdated, pre-release alpha of React 18 that ' + 'does not support useSyncExternalStore. The ' + 'use-sync-external-store shim will not work correctly. Upgrade ' + 'to a newer pre-release.');
              }
            }
          } // Read the current snapshot from the store on every render. Again, this
          // breaks the rules of React, and only works here because of specific
          // implementation details, most importantly that updates are
          // always synchronous.

          var value = getSnapshot();
          {
            if (!didWarnUncachedGetSnapshot) {
              var cachedValue = getSnapshot();
              if (!objectIs(value, cachedValue)) {
                error('The result of getSnapshot should be cached to avoid an infinite loop');
                didWarnUncachedGetSnapshot = true;
              }
            }
          } // Because updates are synchronous, we don't queue them. Instead we force a
          // re-render whenever the subscribed state changes by updating an some
          // arbitrary useState hook. Then, during render, we call getSnapshot to read
          // the current value.
          //
          // Because we don't actually use the state returned by the useState hook, we
          // can save a bit of memory by storing other stuff in that slot.
          //
          // To implement the early bailout, we need to track some things on a mutable
          // object. Usually, we would put that in a useRef hook, but we can stash it in
          // our useState hook instead.
          //
          // To force a re-render, we call forceUpdate({inst}). That works because the
          // new object always fails an equality check.

          var _useState = useState({
              inst: {
                value: value,
                getSnapshot: getSnapshot
              }
            }),
            inst = _useState[0].inst,
            forceUpdate = _useState[1]; // Track the latest getSnapshot function with a ref. This needs to be updated
          // in the layout phase so we can access it during the tearing check that
          // happens on subscribe.

          useLayoutEffect(function () {
            inst.value = value;
            inst.getSnapshot = getSnapshot; // Whenever getSnapshot or subscribe changes, we need to check in the
            // commit phase if there was an interleaved mutation. In concurrent mode
            // this can happen all the time, but even in synchronous mode, an earlier
            // effect may have mutated the store.

            if (checkIfSnapshotChanged(inst)) {
              // Force a re-render.
              forceUpdate({
                inst: inst
              });
            }
          }, [subscribe, value, getSnapshot]);
          useEffect(function () {
            // Check for changes right before subscribing. Subsequent changes will be
            // detected in the subscription handler.
            if (checkIfSnapshotChanged(inst)) {
              // Force a re-render.
              forceUpdate({
                inst: inst
              });
            }
            var handleStoreChange = function handleStoreChange() {
              // TODO: Because there is no cross-renderer API for batching updates, it's
              // up to the consumer of this library to wrap their subscription event
              // with unstable_batchedUpdates. Should we try to detect when this isn't
              // the case and print a warning in development?
              // The store changed. Check if the snapshot changed since the last time we
              // read from the store.
              if (checkIfSnapshotChanged(inst)) {
                // Force a re-render.
                forceUpdate({
                  inst: inst
                });
              }
            }; // Subscribe to the store and return a clean-up function.

            return subscribe(handleStoreChange);
          }, [subscribe]);
          useDebugValue(value);
          return value;
        }
        function checkIfSnapshotChanged(inst) {
          var latestGetSnapshot = inst.getSnapshot;
          var prevValue = inst.value;
          try {
            var nextValue = latestGetSnapshot();
            return !objectIs(prevValue, nextValue);
          } catch (error) {
            return true;
          }
        }
        function useSyncExternalStore$1(subscribe, getSnapshot, getServerSnapshot) {
          // Note: The shim does not use getServerSnapshot, because pre-18 versions of
          // React do not expose a way to check if we're hydrating. So users of the shim
          // will need to track that themselves and return the correct value
          // from `getSnapshot`.
          return getSnapshot();
        }
        var canUseDOM = !!(typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined');
        var isServerEnvironment = !canUseDOM;
        var shim = isServerEnvironment ? useSyncExternalStore$1 : useSyncExternalStore;
        var useSyncExternalStore$2 = React.useSyncExternalStore !== undefined ? React.useSyncExternalStore : shim;
        useSyncExternalStoreShim_development.useSyncExternalStore = useSyncExternalStore$2;
        /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === 'function') {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
    return useSyncExternalStoreShim_development;
  }

  var hasRequiredShim;
  function requireShim() {
    if (hasRequiredShim) return shim.exports;
    hasRequiredShim = 1;
    (function (module) {

      {
        module.exports = requireUseSyncExternalStoreShim_development();
      }
    })(shim);
    return shim.exports;
  }

  var withSelector_development = {};

  var hasRequiredWithSelector_development;
  function requireWithSelector_development() {
    if (hasRequiredWithSelector_development) return withSelector_development;
    hasRequiredWithSelector_development = 1;
    {
      (function () {

        /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === 'function') {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var React = require$$0;
        var shim = requireShim();

        /**
         * inlined Object.is polyfill to avoid requiring consumers ship their own
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
         */
        function is(x, y) {
          return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
          ;
        }
        var objectIs = typeof Object.is === 'function' ? Object.is : is;
        var useSyncExternalStore = shim.useSyncExternalStore;

        // for CommonJS interop.

        var useRef = React.useRef,
          useEffect = React.useEffect,
          useMemo = React.useMemo,
          useDebugValue = React.useDebugValue; // Same as useSyncExternalStore, but supports selector and isEqual arguments.

        function useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
          // Use this to track the rendered snapshot.
          var instRef = useRef(null);
          var inst;
          if (instRef.current === null) {
            inst = {
              hasValue: false,
              value: null
            };
            instRef.current = inst;
          } else {
            inst = instRef.current;
          }
          var _useMemo = useMemo(function () {
              // Track the memoized state using closure variables that are local to this
              // memoized instance of a getSnapshot function. Intentionally not using a
              // useRef hook, because that state would be shared across all concurrent
              // copies of the hook/component.
              var hasMemo = false;
              var memoizedSnapshot;
              var memoizedSelection;
              var memoizedSelector = function memoizedSelector(nextSnapshot) {
                if (!hasMemo) {
                  // The first time the hook is called, there is no memoized result.
                  hasMemo = true;
                  memoizedSnapshot = nextSnapshot;
                  var _nextSelection = selector(nextSnapshot);
                  if (isEqual !== undefined) {
                    // Even if the selector has changed, the currently rendered selection
                    // may be equal to the new selection. We should attempt to reuse the
                    // current value if possible, to preserve downstream memoizations.
                    if (inst.hasValue) {
                      var currentSelection = inst.value;
                      if (isEqual(currentSelection, _nextSelection)) {
                        memoizedSelection = currentSelection;
                        return currentSelection;
                      }
                    }
                  }
                  memoizedSelection = _nextSelection;
                  return _nextSelection;
                } // We may be able to reuse the previous invocation's result.

                // We may be able to reuse the previous invocation's result.
                var prevSnapshot = memoizedSnapshot;
                var prevSelection = memoizedSelection;
                if (objectIs(prevSnapshot, nextSnapshot)) {
                  // The snapshot is the same as last time. Reuse the previous selection.
                  return prevSelection;
                } // The snapshot has changed, so we need to compute a new selection.

                // The snapshot has changed, so we need to compute a new selection.
                var nextSelection = selector(nextSnapshot); // If a custom isEqual function is provided, use that to check if the data
                // has changed. If it hasn't, return the previous selection. That signals
                // to React that the selections are conceptually equal, and we can bail
                // out of rendering.

                // If a custom isEqual function is provided, use that to check if the data
                // has changed. If it hasn't, return the previous selection. That signals
                // to React that the selections are conceptually equal, and we can bail
                // out of rendering.
                if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
                  return prevSelection;
                }
                memoizedSnapshot = nextSnapshot;
                memoizedSelection = nextSelection;
                return nextSelection;
              }; // Assigning this to a constant so that Flow knows it can't change.

              // Assigning this to a constant so that Flow knows it can't change.
              var maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;
              var getSnapshotWithSelector = function getSnapshotWithSelector() {
                return memoizedSelector(getSnapshot());
              };
              var getServerSnapshotWithSelector = maybeGetServerSnapshot === null ? undefined : function () {
                return memoizedSelector(maybeGetServerSnapshot());
              };
              return [getSnapshotWithSelector, getServerSnapshotWithSelector];
            }, [getSnapshot, getServerSnapshot, selector, isEqual]),
            getSelection = _useMemo[0],
            getServerSelection = _useMemo[1];
          var value = useSyncExternalStore(subscribe, getSelection, getServerSelection);
          useEffect(function () {
            inst.hasValue = true;
            inst.value = value;
          }, [value]);
          useDebugValue(value);
          return value;
        }
        withSelector_development.useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector;
        /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === 'function') {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
    return withSelector_development;
  }

  (function (module) {

    {
      module.exports = requireWithSelector_development();
    }
  })(withSelector);
  var useSyncExternalStoreExports = /*@__PURE__*/getDefaultExportFromCjs(withSelector.exports);

  var useDebugValue = ReactExports.useDebugValue;
  var useSyncExternalStoreWithSelector = useSyncExternalStoreExports.useSyncExternalStoreWithSelector;
  var didWarnAboutEqualityFn = false;
  var identity = function identity(arg) {
    return arg;
  };
  function useStore(api) {
    var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identity;
    var equalityFn = arguments.length > 2 ? arguments[2] : undefined;
    if ((_objectSpread2(_objectSpread2({}, Object.fromEntries(Object.entries({}).filter(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
        k = _ref2[0];
      return /^VITE_/.test(k);
    }))), {}, {
      NODE_ENV: "product" ,
      MODE: "product" ,
      BASE_URL: '/',
      DEV: "product" !== 'production',
      PROD: "product" === 'production'
    }) ? "product"  : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
      console.warn("[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937");
      didWarnAboutEqualityFn = true;
    }
    var slice = useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getInitialState, selector, equalityFn);
    useDebugValue(slice);
    return slice;
  }
  var createImpl = function createImpl(createState) {
    if ((_objectSpread2(_objectSpread2({}, Object.fromEntries(Object.entries({}).filter(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 1),
        k = _ref4[0];
      return /^VITE_/.test(k);
    }))), {}, {
      NODE_ENV: "product" ,
      MODE: "product" ,
      BASE_URL: '/',
      DEV: "product" !== 'production',
      PROD: "product" === 'production'
    }) ? "product"  : void 0) !== "production" && typeof createState !== "function") {
      console.warn("[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.");
    }
    var api = typeof createState === "function" ? createStore(createState) : createState;
    var useBoundStore = function useBoundStore(selector, equalityFn) {
      return useStore(api, selector, equalityFn);
    };
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  var create = function create(createState) {
    return createState ? createImpl(createState) : createImpl;
  };

  // src/types/bridge.ts
  var AppErrorCodes = /* @__PURE__ */function (AppErrorCodes2) {
    AppErrorCodes2["ConnectionFailed"] = "connection_failed";
    AppErrorCodes2["VerificationRejected"] = "verification_rejected";
    AppErrorCodes2["MaxVerificationsReached"] = "max_verifications_reached";
    AppErrorCodes2["CredentialUnavailable"] = "credential_unavailable";
    AppErrorCodes2["MalformedRequest"] = "malformed_request";
    AppErrorCodes2["InvalidNetwork"] = "invalid_network";
    AppErrorCodes2["InclusionProofFailed"] = "inclusion_proof_failed";
    AppErrorCodes2["InclusionProofPending"] = "inclusion_proof_pending";
    AppErrorCodes2["UnexpectedResponse"] = "unexpected_response";
    AppErrorCodes2["FailedByHostApp"] = "failed_by_host_app";
    AppErrorCodes2["GenericError"] = "generic_error";
    return AppErrorCodes2;
  }(AppErrorCodes || {});
  var VerificationLevel = /* @__PURE__ */function (VerificationLevel2) {
    VerificationLevel2["Orb"] = "orb";
    VerificationLevel2["Device"] = "device";
    return VerificationLevel2;
  }(VerificationLevel || {});

  // src/lib/validation.ts
  function validate_bridge_url(bridge_url, is_staging) {
    try {
      new URL(bridge_url);
    } catch (e) {
      return {
        valid: false,
        errors: ["Failed to parse Bridge URL."]
      };
    }
    var test_url = new URL(bridge_url);
    var errors = [];
    if (is_staging && ["localhost", "127.0.0.1"].includes(test_url.hostname)) {
      console.log("Using staging app_id with localhost bridge_url. Skipping validation.");
      return {
        valid: true
      };
    }
    if (test_url.protocol !== "https:") {
      errors.push("Bridge URL must use HTTPS.");
    }
    if (test_url.port) {
      errors.push("Bridge URL must use the default port (443).");
    }
    if (test_url.pathname !== "/") {
      errors.push("Bridge URL must not have a path.");
    }
    if (test_url.search) {
      errors.push("Bridge URL must not have query parameters.");
    }
    if (test_url.hash) {
      errors.push("Bridge URL must not have a fragment.");
    }
    if (!test_url.hostname.endsWith(".worldcoin.org") && !test_url.hostname.endsWith(".toolsforhumanity.com")) {
      console.warn("Bridge URL should be a subdomain of worldcoin.org or toolsforhumanity.com. The user's identity wallet may refuse to connect. This is a temporary measure and may be removed in the future.");
    }
    if (errors.length) {
      return {
        valid: false,
        errors: errors
      };
    }
    return {
      valid: true
    };
  }
  var DEFAULT_VERIFICATION_LEVEL = "orb" /* Orb */;
  var buffer_encode = function buffer_encode(buffer$1) {
    return buffer.Buffer.from(buffer$1).toString("base64");
  };
  var buffer_decode = function buffer_decode(encoded) {
    return buffer.Buffer.from(encoded, "base64");
  };
  var verification_level_to_credential_types = function verification_level_to_credential_types(verification_level) {
    switch (verification_level) {
      case "device" /* Device */:
        return ["orb" /* Orb */, "device" /* Device */];
      case "orb" /* Orb */:
        return ["orb" /* Orb */];
      default:
        throw new Error("Unknown verification level: ".concat(verification_level));
    }
  };
  var credential_type_to_verification_level = function credential_type_to_verification_level(credential_type) {
    switch (credential_type) {
      case "orb" /* Orb */:
        return "orb" /* Orb */;
      case "device" /* Device */:
        return "device" /* Device */;
      default:
        throw new Error("Unknown credential_type: ".concat(credential_type));
    }
  };

  // src/lib/crypto.ts
  var encoder = new TextEncoder();
  var decoder = new TextDecoder();
  var generateKey = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.t0 = window.crypto.getRandomValues(new Uint8Array(12));
            _context.next = 3;
            return window.crypto.subtle.generateKey({
              name: "AES-GCM",
              length: 256
            }, true, ["encrypt", "decrypt"]);
          case 3:
            _context.t1 = _context.sent;
            return _context.abrupt("return", {
              iv: _context.t0,
              key: _context.t1
            });
          case 5:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function generateKey() {
      return _ref.apply(this, arguments);
    };
  }();
  var exportKey = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(key) {
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.t0 = buffer_encode;
            _context2.next = 3;
            return window.crypto.subtle.exportKey("raw", key);
          case 3:
            _context2.t1 = _context2.sent;
            return _context2.abrupt("return", (0, _context2.t0)(_context2.t1));
          case 5:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return function exportKey(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var encryptRequest = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(key, iv, request) {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.t0 = buffer_encode(iv);
            _context3.t1 = buffer_encode;
            _context3.next = 4;
            return window.crypto.subtle.encrypt({
              name: "AES-GCM",
              iv: iv
            }, key, encoder.encode(request));
          case 4:
            _context3.t2 = _context3.sent;
            _context3.t3 = (0, _context3.t1)(_context3.t2);
            return _context3.abrupt("return", {
              iv: _context3.t0,
              payload: _context3.t3
            });
          case 7:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    return function encryptRequest(_x2, _x3, _x4) {
      return _ref3.apply(this, arguments);
    };
  }();
  var decryptResponse = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(key, iv, payload) {
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            _context4.t0 = decoder;
            _context4.next = 3;
            return window.crypto.subtle.decrypt({
              name: "AES-GCM",
              iv: iv
            }, key, buffer_decode(payload));
          case 3:
            _context4.t1 = _context4.sent;
            return _context4.abrupt("return", _context4.t0.decode.call(_context4.t0, _context4.t1));
          case 5:
          case "end":
            return _context4.stop();
        }
      }, _callee4);
    }));
    return function decryptResponse(_x5, _x6, _x7) {
      return _ref4.apply(this, arguments);
    };
  }();

  // src/bridge.ts
  var DEFAULT_BRIDGE_URL = "https://bridge.worldcoin.org";
  create(function (set, get) {
    return {
      iv: null,
      key: null,
      result: null,
      errorCode: null,
      requestId: null,
      connectorURI: null,
      bridge_url: DEFAULT_BRIDGE_URL,
      verificationState: "loading_widget" /* PreparingClient */,
      createClient: function () {
        var _createClient = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(_ref5) {
          var bridge_url, app_id, verification_level, action_description, action, signal, _yield$generateKey, key, iv, validation, res, _yield$res$json, request_id;
          return _regeneratorRuntime().wrap(function _callee5$(_context5) {
            while (1) switch (_context5.prev = _context5.next) {
              case 0:
                bridge_url = _ref5.bridge_url, app_id = _ref5.app_id, verification_level = _ref5.verification_level, action_description = _ref5.action_description, action = _ref5.action, signal = _ref5.signal;
                _context5.next = 3;
                return generateKey();
              case 3:
                _yield$generateKey = _context5.sent;
                key = _yield$generateKey.key;
                iv = _yield$generateKey.iv;
                if (!bridge_url) {
                  _context5.next = 12;
                  break;
                }
                validation = validate_bridge_url(bridge_url, app_id.includes("staging"));
                if (validation.valid) {
                  _context5.next = 12;
                  break;
                }
                console.error(validation.errors.join("\n"));
                set({
                  verificationState: "failed" /* Failed */
                });
                throw new Error("Invalid bridge_url. Please check the console for more details.");
              case 12:
                _context5.t0 = fetch;
                _context5.t1 = new URL("/request", bridge_url !== null && bridge_url !== void 0 ? bridge_url : DEFAULT_BRIDGE_URL);
                _context5.t2 = {
                  "Content-Type": "application/json"
                };
                _context5.t3 = JSON;
                _context5.next = 18;
                return encryptRequest(key, iv, JSON.stringify({
                  app_id: app_id,
                  action_description: action_description,
                  action: encodeAction(action),
                  signal: generateSignal(signal).digest,
                  credential_types: verification_level_to_credential_types(verification_level !== null && verification_level !== void 0 ? verification_level : DEFAULT_VERIFICATION_LEVEL),
                  verification_level: verification_level !== null && verification_level !== void 0 ? verification_level : DEFAULT_VERIFICATION_LEVEL
                }));
              case 18:
                _context5.t4 = _context5.sent;
                _context5.t5 = _context5.t3.stringify.call(_context5.t3, _context5.t4);
                _context5.t6 = {
                  method: "POST",
                  headers: _context5.t2,
                  body: _context5.t5
                };
                _context5.next = 23;
                return (0, _context5.t0)(_context5.t1, _context5.t6);
              case 23:
                res = _context5.sent;
                if (res.ok) {
                  _context5.next = 27;
                  break;
                }
                set({
                  verificationState: "failed" /* Failed */
                });
                throw new Error("Failed to create client");
              case 27:
                _context5.next = 29;
                return res.json();
              case 29:
                _yield$res$json = _context5.sent;
                request_id = _yield$res$json.request_id;
                _context5.t7 = set;
                _context5.t8 = iv;
                _context5.t9 = key;
                _context5.t10 = request_id;
                _context5.t11 = bridge_url !== null && bridge_url !== void 0 ? bridge_url : DEFAULT_BRIDGE_URL;
                _context5.t12 = "https://worldcoin.org/verify?t=wld&i=".concat(request_id, "&k=");
                _context5.t13 = encodeURIComponent;
                _context5.next = 40;
                return exportKey(key);
              case 40:
                _context5.t14 = _context5.sent;
                _context5.t15 = (0, _context5.t13)(_context5.t14);
                _context5.t16 = _context5.t12.concat.call(_context5.t12, _context5.t15).concat(bridge_url && bridge_url !== DEFAULT_BRIDGE_URL ? "&b=".concat(encodeURIComponent(bridge_url)) : "");
                _context5.t17 = {
                  iv: _context5.t8,
                  key: _context5.t9,
                  requestId: _context5.t10,
                  bridge_url: _context5.t11,
                  verificationState: "awaiting_connection",
                  connectorURI: _context5.t16
                };
                (0, _context5.t7)(_context5.t17);
              case 45:
              case "end":
                return _context5.stop();
            }
          }, _callee5);
        }));
        function createClient(_x8) {
          return _createClient.apply(this, arguments);
        }
        return createClient;
      }(),
      pollForUpdates: function () {
        var _pollForUpdates = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
          var key, res, _yield$res$json2, response, status, result;
          return _regeneratorRuntime().wrap(function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                key = get().key;
                if (key) {
                  _context6.next = 3;
                  break;
                }
                throw new Error("No keypair found. Please call `createClient` first.");
              case 3:
                _context6.next = 5;
                return fetch(new URL("/response/".concat(get().requestId), get().bridge_url));
              case 5:
                res = _context6.sent;
                if (res.ok) {
                  _context6.next = 8;
                  break;
                }
                return _context6.abrupt("return", set({
                  errorCode: "connection_failed" /* ConnectionFailed */,
                  verificationState: "failed" /* Failed */
                }));
              case 8:
                _context6.next = 10;
                return res.json();
              case 10:
                _yield$res$json2 = _context6.sent;
                response = _yield$res$json2.response;
                status = _yield$res$json2.status;
                if (!(status != "completed" /* Completed */)) {
                  _context6.next = 15;
                  break;
                }
                return _context6.abrupt("return", set({
                  verificationState: status == "retrieved" /* Retrieved */ ? "awaiting_app" /* WaitingForApp */ : "awaiting_connection" /* WaitingForConnection */
                }));
              case 15:
                _context6.t0 = JSON;
                _context6.next = 18;
                return decryptResponse(key, buffer_decode(response.iv), response.payload);
              case 18:
                _context6.t1 = _context6.sent;
                result = _context6.t0.parse.call(_context6.t0, _context6.t1);
                if (!("error_code" in result)) {
                  _context6.next = 22;
                  break;
                }
                return _context6.abrupt("return", set({
                  errorCode: result.error_code,
                  verificationState: "failed" /* Failed */
                }));
              case 22:
                if ("credential_type" in result) {
                  result = _objectSpread2({
                    verification_level: credential_type_to_verification_level(result.credential_type)
                  }, result);
                }
                set({
                  result: result,
                  key: null,
                  requestId: null,
                  connectorURI: null,
                  verificationState: "confirmed" /* Confirmed */
                });
              case 24:
              case "end":
                return _context6.stop();
            }
          }, _callee6);
        }));
        function pollForUpdates() {
          return _pollForUpdates.apply(this, arguments);
        }
        return pollForUpdates;
      }(),
      reset: function reset() {
        set({
          iv: null,
          key: null,
          result: null,
          errorCode: null,
          requestId: null,
          connectorURI: null,
          verificationState: "loading_widget" /* PreparingClient */
        });
      }
    };
  });

  var _VerificationErrorMes;
  (_VerificationErrorMes = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_VerificationErrorMes, AppErrorCodes.VerificationRejected, "You\u2019ve cancelled the request in World App."), AppErrorCodes.MaxVerificationsReached, "You have already verified the maximum number of times for this action."), AppErrorCodes.CredentialUnavailable, "It seems you do not have the verification level required by this app."), AppErrorCodes.MalformedRequest, "There was a problem with this request. Please try again or contact the app owner."), AppErrorCodes.InvalidNetwork, "Invalid network. If you are the app owner, visit docs.worldcoin.org/test for details."), AppErrorCodes.InclusionProofFailed, "There was an issue fetching your credential. Please try again."), AppErrorCodes.InclusionProofPending, "Your identity is still being registered. Please wait a few minutes and try again."), AppErrorCodes.UnexpectedResponse, "Unexpected response from your wallet. Please try again."), AppErrorCodes.FailedByHostApp, "Verification failed by the app. Please contact the app owner for details."), AppErrorCodes.GenericError, "Something unexpected went wrong. Please try again."), _defineProperty(_VerificationErrorMes, AppErrorCodes.ConnectionFailed, "Connection to your wallet failed. Please try again."));
  _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "input_error" /* InputError */, "There was a problem with this request. Please try again or contact the app owner."), "payment_rejected" /* PaymentRejected */, "You\u2019ve cancelled the payment in World App."), "invalid_receiver" /* InvalidReceiver */, "The receiver address is invalid. Please contact the app owner."), "insufficient_balance" /* InsufficientBalance */, "You do not have enough balance to complete this transaction."), "transaction_failed" /* TransactionFailed */, "The transaction failed. Please try again."), "generic_error" /* GenericError */, "Something unexpected went wrong. Please try again."), "user_blocked" /* UserBlocked */, "User's region is blocked from making payments.");
  _defineProperty(_defineProperty(_defineProperty({}, "malformed_request" /* MalformedRequest */, "Provided parameters in the request are invalid."), "user_rejected" /* UserRejected */, "User rejected the request."), "generic_error" /* GenericError */, "Something unexpected went wrong.");
  _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "invalid_operation" /* InvalidOperation */, "Transaction included an operation that was invalid"), "user_rejected" /* UserRejected */, "User rejected the request."), "input_error" /* InputError */, "Invalid payload."), "simulation_failed" /* SimulationFailed */, "The transaction simulation failed."), "transaction_failed" /* TransactionFailed */, "The transaction failed. Please try again later."), "generic_error" /* GenericError */, "Something unexpected went wrong. Please try again."), "disallowed_operation" /* DisallowedOperation */, "The operation requested is not allowed. Please refer to the docs."), "invalid_contract" /* InvalidContract */, "The contract address is not allowed for your application. Please check your developer portal configurations"), "malicious_operation" /* MaliciousOperation */, "The operation requested is considered malicious.");
  _defineProperty(_defineProperty(_defineProperty({}, "invalid_message" /* InvalidMessage */, "Invalid message requested"), "user_rejected" /* UserRejected */, "User rejected the request."), "generic_error" /* GenericError */, "Something unexpected went wrong.");
  var MiniKitInstallErrorMessage = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "unknown" /* Unknown */, "Failed to install MiniKit."), "already_installed" /* AlreadyInstalled */, "MiniKit is already installed."), "outside_of_worldapp" /* OutsideOfWorldApp */, "MiniApp launched outside of WorldApp."), "not_on_client" /* NotOnClient */, "Window object is not available."), "app_out_of_date" /* AppOutOfDate */, "WorldApp is out of date. Please update the app.");

  // helpers/send-webview-event.ts
  var sendWebviewEvent = function sendWebviewEvent(payload) {
    if (window.webkit) {
      var _window$webkit, _window$webkit$postMe;
      (_window$webkit = window.webkit) === null || _window$webkit === void 0 || (_window$webkit = _window$webkit.messageHandlers) === null || _window$webkit === void 0 || (_window$webkit = _window$webkit.minikit) === null || _window$webkit === void 0 || (_window$webkit$postMe = _window$webkit.postMessage) === null || _window$webkit$postMe === void 0 || _window$webkit$postMe.call(_window$webkit, payload);
    } else if (window.Android) {
      var _window$Android$postM, _window$Android;
      (_window$Android$postM = (_window$Android = window.Android).postMessage) === null || _window$Android$postM === void 0 || _window$Android$postM.call(_window$Android, JSON.stringify(payload));
    }
  };

  // types/responses.ts
  var ResponseEvent = /* @__PURE__ */function (ResponseEvent2) {
    ResponseEvent2["MiniAppVerifyAction"] = "miniapp-verify-action";
    ResponseEvent2["MiniAppPayment"] = "miniapp-payment";
    ResponseEvent2["MiniAppWalletAuth"] = "miniapp-wallet-auth";
    ResponseEvent2["MiniAppSendTransaction"] = "miniapp-send-transaction";
    ResponseEvent2["MiniAppSignMessage"] = "miniapp-sign-message";
    ResponseEvent2["MiniAppSignTypedData"] = "miniapp-sign-typed-data";
    return ResponseEvent2;
  }(ResponseEvent || {});
  _defineProperty(_defineProperty({}, "USDCE" /* USDCE */, 6), "WLD" /* WLD */, 18);

  // helpers/siwe/validate-wallet-auth-command-input.ts
  var validateWalletAuthCommandInput = function validateWalletAuthCommandInput(params) {
    if (!params.nonce) {
      return {
        valid: false,
        message: "'nonce' is required"
      };
    }
    if (params.nonce.length < 8) {
      return {
        valid: false,
        message: "'nonce' must be at least 8 characters"
      };
    }
    if (params.statement && params.statement.includes("\n")) {
      return {
        valid: false,
        message: "'statement' must not contain newlines"
      };
    }
    if (params.expirationTime && new Date(params.expirationTime) < /* @__PURE__ */new Date()) {
      return {
        valid: false,
        message: "'expirationTime' must be in the future"
      };
    }
    if (params.expirationTime && new Date(params.expirationTime) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)) {
      return {
        valid: false,
        message: "'expirationTime' must be within 7 days"
      };
    }
    if (params.notBefore && new Date(params.notBefore) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)) {
      return {
        valid: false,
        message: "'notBefore' must be within 7 days"
      };
    }
    return {
      valid: true
    };
  };
  var generateSiweMessage = function generateSiweMessage(siweMessageData) {
    var siweMessage = "";
    if (siweMessageData.scheme) {
      siweMessage += "".concat(siweMessageData.scheme, "://").concat(siweMessageData.domain, " wants you to sign in with your Ethereum account:\n");
    } else {
      siweMessage += "".concat(siweMessageData.domain, " wants you to sign in with your Ethereum account:\n");
    }
    if (siweMessageData.address) {
      siweMessage += "".concat(siweMessageData.address, "\n");
    } else {
      siweMessage += "{address}\n";
    }
    siweMessage += "\n";
    if (siweMessageData.statement) {
      siweMessage += "".concat(siweMessageData.statement, "\n");
    }
    siweMessage += "\n";
    siweMessage += "URI: ".concat(siweMessageData.uri, "\n");
    siweMessage += "Version: ".concat(siweMessageData.version, "\n");
    siweMessage += "Chain ID: ".concat(siweMessageData.chain_id, "\n");
    siweMessage += "Nonce: ".concat(siweMessageData.nonce, "\n");
    siweMessage += "Issued At: ".concat(siweMessageData.issued_at, "\n");
    if (siweMessageData.expiration_time) {
      siweMessage += "Expiration Time: ".concat(siweMessageData.expiration_time, "\n");
    }
    if (siweMessageData.not_before) {
      siweMessage += "Not Before: ".concat(siweMessageData.not_before, "\n");
    }
    if (siweMessageData.request_id) {
      siweMessage += "Request ID: ".concat(siweMessageData.request_id, "\n");
    }
    return siweMessage;
  };
  var validatePaymentPayload = function validatePaymentPayload(payload) {
    if (payload.tokens.some(function (token) {
      return token.symbol == "USDCE" && parseFloat(token.token_amount) < 0.1;
    })) {
      console.error("USDCE amount should be greater than $0.1");
      return false;
    }
    if (payload.reference.length > 36) {
      console.error("Reference must not exceed 36 characters");
      return false;
    }
    return true;
  };

  // minikit.ts
  var sendMiniKitEvent = function sendMiniKitEvent(payload) {
    sendWebviewEvent(payload);
  };
  var _MiniKit = /*#__PURE__*/function () {
    function _MiniKit() {
      _classCallCheck(this, _MiniKit);
    }
    return _createClass(_MiniKit, null, [{
      key: "sendInit",
      value: function sendInit() {
        sendWebviewEvent({
          command: "init",
          payload: {
            version: this.MINIKIT_VERSION
          }
        });
      }
    }, {
      key: "subscribe",
      value: function subscribe(event, handler) {
        if (event === "miniapp-wallet-auth" /* MiniAppWalletAuth */) {
          var originalHandler = handler;
          var wrappedHandler = function wrappedHandler(payload) {
            if (payload.status === "success") {
              _MiniKit.walletAddress = payload.address;
            }
            originalHandler(payload);
          };
          this.listeners[event] = wrappedHandler;
        } else {
          this.listeners[event] = handler;
        }
      }
    }, {
      key: "unsubscribe",
      value: function unsubscribe(event) {
        delete this.listeners[event];
      }
    }, {
      key: "trigger",
      value: function trigger(event, payload) {
        if (!this.listeners[event]) {
          console.error("No handler for event ".concat(event));
          return;
        }
        this.listeners[event](payload);
      }
    }, {
      key: "commandsValid",
      value: function commandsValid(input) {
        var _this = this;
        return input.every(function (command) {
          return command.supported_versions.includes(_this.commandVersion[command.name]);
        });
      }
    }, {
      key: "install",
      value: function install() {
        if (typeof window === "undefined" || Boolean(window.MiniKit)) {
          return {
            success: false,
            errorCode: "already_installed" /* AlreadyInstalled */,
            errorMessage: MiniKitInstallErrorMessage["already_installed" /* AlreadyInstalled */]
          };
        }
        if (!window.WorldApp) {
          return {
            success: false,
            errorCode: "outside_of_worldapp" /* OutsideOfWorldApp */,
            errorMessage: MiniKitInstallErrorMessage["outside_of_worldapp" /* OutsideOfWorldApp */]
          };
        }
        if (!this.commandsValid(window.WorldApp.supported_commands)) {
          return {
            success: false,
            errorCode: "app_out_of_date" /* AppOutOfDate */,
            errorMessage: MiniKitInstallErrorMessage["app_out_of_date" /* AppOutOfDate */]
          };
        }
        try {
          window.MiniKit = _MiniKit;
          this.sendInit();
        } catch (error) {
          console.error(MiniKitInstallErrorMessage["unknown" /* Unknown */], error);
          return {
            success: false,
            errorCode: "unknown" /* Unknown */,
            errorMessage: MiniKitInstallErrorMessage["unknown" /* Unknown */]
          };
        }
        return {
          success: true
        };
      }
    }, {
      key: "isInstalled",
      value: function isInstalled(debug) {
        if (debug) console.log("MiniKit is alive!");
        return Boolean(window.MiniKit);
      }
    }]);
  }();
  _MiniKit.MINIKIT_VERSION = 1;
  _MiniKit.commandVersion = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "verify" /* Verify */, 1), "pay" /* Pay */, 1), "wallet-auth" /* WalletAuth */, 1), "send-transaction" /* SendTransaction */, 1), "sign-message" /* SignMessage */, 1), "sign-typed-data" /* SignTypedData */, 1);
  _MiniKit.listeners = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "miniapp-verify-action" /* MiniAppVerifyAction */, function miniappVerifyAction() {}), "miniapp-payment" /* MiniAppPayment */, function miniappPayment() {}), "miniapp-wallet-auth" /* MiniAppWalletAuth */, function miniappWalletAuth() {}), "miniapp-send-transaction" /* MiniAppSendTransaction */, function miniappSendTransaction() {}), "miniapp-sign-message" /* MiniAppSignMessage */, function miniappSignMessage() {}), "miniapp-sign-typed-data" /* MiniAppSignTypedData */, function miniappSignTypedData() {});
  _MiniKit.walletAddress = null;
  _MiniKit.commands = {
    verify: function verify(payload) {
      var timestamp = (/* @__PURE__ */new Date()).toISOString();
      var eventPayload = _objectSpread2(_objectSpread2({}, payload), {}, {
        signal: payload.signal || "",
        verification_level: payload.verification_level || VerificationLevel.Orb,
        timestamp: timestamp
      });
      sendMiniKitEvent({
        command: "verify" /* Verify */,
        version: _MiniKit.commandVersion["verify" /* Verify */],
        payload: eventPayload
      });
      return eventPayload;
    },
    pay: function pay(payload) {
      if (typeof window === "undefined") {
        console.error("'pay' method is only available in a browser environment.");
        return null;
      }
      if (!validatePaymentPayload(payload)) {
        return null;
      }
      var network = "optimism" /* Optimism */;
      var eventPayload = _objectSpread2(_objectSpread2({}, payload), {}, {
        network: network
      });
      sendMiniKitEvent({
        command: "pay" /* Pay */,
        version: _MiniKit.commandVersion["pay" /* Pay */],
        payload: eventPayload
      });
      return eventPayload;
    },
    walletAuth: function walletAuth(payload) {
      var _payload$statement, _payload$expirationTi, _payload$expirationTi2, _payload$notBefore$to, _payload$notBefore, _payload$requestId;
      if (typeof window === "undefined") {
        console.error("'walletAuth' method is only available in a browser environment.");
        return null;
      }
      var validationResult = validateWalletAuthCommandInput(payload);
      if (!validationResult.valid) {
        console.error("Failed to validate wallet auth input:\n\n -->", validationResult.message);
        return null;
      }
      var protocol = null;
      try {
        var currentUrl = new URL(window.location.href);
        protocol = currentUrl.protocol.split(":")[0];
      } catch (error) {
        console.error("Failed to get current URL", error);
        return null;
      }
      var siweMessage = generateSiweMessage({
        scheme: protocol,
        domain: window.location.host,
        statement: (_payload$statement = payload.statement) !== null && _payload$statement !== void 0 ? _payload$statement : void 0,
        uri: window.location.href,
        version: 1,
        chain_id: 10,
        nonce: payload.nonce,
        issued_at: (/* @__PURE__ */new Date()).toISOString(),
        expiration_time: (_payload$expirationTi = (_payload$expirationTi2 = payload.expirationTime) === null || _payload$expirationTi2 === void 0 ? void 0 : _payload$expirationTi2.toISOString()) !== null && _payload$expirationTi !== void 0 ? _payload$expirationTi : void 0,
        not_before: (_payload$notBefore$to = (_payload$notBefore = payload.notBefore) === null || _payload$notBefore === void 0 ? void 0 : _payload$notBefore.toISOString()) !== null && _payload$notBefore$to !== void 0 ? _payload$notBefore$to : void 0,
        request_id: (_payload$requestId = payload.requestId) !== null && _payload$requestId !== void 0 ? _payload$requestId : void 0
      });
      var walletAuthPayload = {
        siweMessage: siweMessage
      };
      sendMiniKitEvent({
        command: "wallet-auth" /* WalletAuth */,
        version: _MiniKit.commandVersion["wallet-auth" /* WalletAuth */],
        payload: walletAuthPayload
      });
      return walletAuthPayload;
    },
    sendTransaction: function sendTransaction(payload) {
      sendMiniKitEvent({
        command: "send-transaction" /* SendTransaction */,
        version: 1,
        payload: payload
      });
      return payload;
    },
    signMessage: function signMessage(payload) {
      sendMiniKitEvent({
        command: "sign-message" /* SignMessage */,
        version: 1,
        payload: payload
      });
      return payload;
    },
    signTypedData: function signTypedData(payload) {
      sendMiniKitEvent({
        command: "sign-typed-data" /* SignTypedData */,
        version: 1,
        payload: payload
      });
      return payload;
    }
  };
  var MiniKit = _MiniKit;

  function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  class Worldapp {

    static __initStatic() {this.info = {
      name: 'Worldapp',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMzIDMyIj4KICA8Zz4KICAgIDxnPgogICAgICA8cmVjdCBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iMzMiIGhlaWdodD0iMzIiLz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMjQuNywxMi41Yy0uNS0xLjEtMS4xLTItMS45LTIuOHMtMS44LTEuNS0yLjgtMS45Yy0xLjEtLjUtMi4zLS43LTMuNS0uN3MtMi40LjItMy41LjdjLTEuMS41LTIsMS4xLTIuOCwxLjlzLTEuNSwxLjgtMS45LDIuOGMtLjUsMS4xLS43LDIuMy0uNywzLjVzLjIsMi40LjcsMy41LDEuMSwyLDEuOSwyLjhjLjguOCwxLjgsMS41LDIuOCwxLjksMS4xLjUsMi4zLjcsMy41LjdzMi40LS4yLDMuNS0uNywyLTEuMSwyLjgtMS45LDEuNS0xLjgsMS45LTIuOGMuNS0xLjEuNy0yLjMuNy0zLjVzLS4yLTIuNC0uNy0zLjVaTTEzLjUsMTUuMmMuNC0xLjQsMS43LTIuNSwzLjItMi41aDYuMmMuNC44LjcsMS42LjcsMi41aC0xMC4xWk0yMy43LDE2LjhjMCwuOS0uNCwxLjctLjcsMi41aC02LjJjLTEuNSwwLTIuOC0xLjEtMy4yLTIuNWgxMC4xWk0xMS40LDEwLjljMS40LTEuNCwzLjItMi4xLDUuMS0yLjFzMy44LjcsNS4xLDIuMWguMWMwLC4xLTUsLjEtNSwuMS0xLjMsMC0yLjYuNS0zLjUsMS41LS43LjctMS4yLDEuNy0xLjQsMi43aC0yLjVjLjItMS42LjktMy4xLDIuMS00LjNaTTE2LjUsMjMuMmMtMS45LDAtMy44LS43LTUuMS0yLjEtMS4yLTEuMi0xLjktMi43LTIuMS00LjNoMi41Yy4yLDEsLjcsMS45LDEuNCwyLjcuOS45LDIuMiwxLjUsMy41LDEuNWg1LS4xYy0xLjQsMS41LTMuMiwyLjItNS4xLDIuMloiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
      blockchains: ["worldchain"]
    };}

    static __initStatic2() {this.isAvailable = async()=>{ 
      return Boolean(
        _optionalChain$1([window, 'optionalAccess', _2 => _2.WorldApp])
      )
    };}
    
    constructor () {
      MiniKit.install();
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      this.sendTransaction = (transaction)=>{
        console.log('sendTransaction');
      };
    }

    getProvider() {
      return this
    }

    async account() {
      if(!this.getProvider()) { return undefined }
      return MiniKit.walletAddress
    }

    connect() {

      return new Promise((resolve, reject)=>{

        if(MiniKit.walletAddress) {
          return resolve(MiniKit.walletAddress)
        }

        MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
          if (payload.status === "error") {
            return reject()
          } else {
            return resolve()
          }
        });

        WorldcoinPrecompiled.MiniKit.commands.walletAuth({
          nonce: crypto.randomUUID().replace(/-/g, ""),
          expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          statement: "Connect your WorldApp to continue..."
        });
      })
    }

    on(event, callback) {}

    off(event, internalCallback) {}

    async connectedTo(input) {
      const blockchain = Blockchains.findById(await this.getProvider().request({ method: 'eth_chainId' }));
      if(!blockchain) { return false }
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        reject({ code: 'NOT_SUPPORTED' });
      })
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        reject({ code: 'NOT_SUPPORTED' });
      })
    }

    async transactionCount({ blockchain, address }) {
      // return (await request({
        
      // })).toString()
    }

    async sign(message) {
      
    }
  } Worldapp.__initStatic(); Worldapp.__initStatic2();

  var wallets = {
    MetaMask,
    CoinbaseEVM,
    Binance,
    TrustEVM,
    Rabby,
    Uniswap,
    Rainbow,
    BraveEVM,
    Opera,
    MagicEdenEVM,
    OKXEVM,
    Coin98EVM,
    CryptoCom,
    HyperPay,
    TokenPocket,
    ExodusEVM,
    PhantomEVM,
    Worldapp,

    // standards
    WindowEthereum,
    WalletConnectV2,
    WalletLink
  };

  function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  const getWallets = async(args)=>{

    let drip = (args && typeof args.drip === 'function') ? args.drip : undefined;

    // eip6963
    window['_eip6963Providers'] = {};
    const announceProvider = (event)=>{
      if(_optionalChain([event, 'optionalAccess', _ => _.detail, 'optionalAccess', _2 => _2.info, 'optionalAccess', _3 => _3.uuid])) {
        window['_eip6963Providers'][_optionalChain([event, 'optionalAccess', _4 => _4.detail, 'optionalAccess', _5 => _5.info, 'optionalAccess', _6 => _6.uuid])] = event.detail.provider;
      }
    };
    window.addEventListener("eip6963:announceProvider", announceProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.removeEventListener("eip6963:announceProvider", announceProvider);

    let availableWallets = await Promise.all(
      
      Object.keys(wallets).map(
        
        async(key)=>{
        
          let wallet = wallets[key];

          if(await wallet.isAvailable()) {
            let instance;
            
            if(wallet.getConnectedInstance) {
              instance = await wallet.getConnectedInstance();
              if(drip && instance) { drip(instance); }
              return instance
            } else {
              if(drip && wallet) { drip(wallet); }
              return new wallet
            }
          }
        }
      )
    );

    return availableWallets.filter(Boolean)
  };

  const supported = [
    wallets.MetaMask,
    wallets.CoinbaseEVM,
    wallets.Binance,
    wallets.TrustEVM,
    wallets.Rabby,
    wallets.Uniswap,
    wallets.Rainbow,
    wallets.PhantomEVM,
    wallets.BraveEVM,
    wallets.OKXEvm,
    wallets.MagicEdenEVM,
    wallets.Opera,
    wallets.Coin98EVM,
    wallets.Coin98SVM,
    wallets.CryptoCom,
    wallets.HyperPay,
    wallets.TokenPocket,
    wallets.ExodusEVM,
    wallets.Worldapp,

    // standards
    wallets.WalletConnectV2,
    wallets.WalletLink,
    wallets.WindowEthereum,
  ];

  exports.getWallets = getWallets;
  exports.supported = supported;
  exports.wallets = wallets;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
