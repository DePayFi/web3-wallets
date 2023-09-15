(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@depay/web3-client-evm'), require('@depay/web3-blockchains'), require('ethers'), require('@depay/walletconnect-v1'), require('@depay/walletconnect-v2'), require('@depay/coinbase-wallet-sdk')) :
  typeof define === 'function' && define.amd ? define(['exports', '@depay/web3-client-evm', '@depay/web3-blockchains', 'ethers', '@depay/walletconnect-v1', '@depay/walletconnect-v2', '@depay/coinbase-wallet-sdk'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Wallets = {}, global.Web3Client, global.Web3Blockchains, global.ethers, global.WalletConnect, global.WalletConnectV2, global.CoinbaseWalletSdk));
}(this, (function (exports, web3ClientEvm, Blockchains, ethers, walletconnectV1, walletconnectV2, coinbaseWalletSdk) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Blockchains__default = /*#__PURE__*/_interopDefaultLegacy(Blockchains);

  let supported$1 = ['ethereum', 'bsc', 'polygon', 'fantom', 'arbitrum', 'avalanche', 'gnosis', 'optimism', 'base'];
  supported$1.evm = ['ethereum', 'bsc', 'polygon', 'fantom', 'arbitrum', 'avalanche', 'gnosis', 'optimism', 'base'];
  supported$1.solana = [];

  function _optionalChain$i(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
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
      this.value = _optionalChain$i([Transaction, 'access', _ => _.bigNumberify, 'call', _2 => _2(value, blockchain), 'optionalAccess', _3 => _3.toString, 'call', _4 => _4()]);
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
      if(_optionalChain$i([param, 'optionalAccess', _5 => _5.components, 'optionalAccess', _6 => _6.length])) {
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

  const sendTransaction$3 = async ({ transaction, wallet })=> {
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
    await submit$3({ transaction, provider, signer }).then((sentTransaction)=>{
      if (sentTransaction) {
        transaction.id = sentTransaction.hash;
        transaction.nonce = sentTransaction.nonce || transactionCount;
        transaction.url = Blockchains__default['default'].findByName(transaction.blockchain).explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        sentTransaction.wait(1).then(() => {
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

  const submit$3 = ({ transaction, provider, signer }) => {
    if(transaction.method) {
      return submitContractInteraction$3({ transaction, signer, provider })
    } else {
      return submitSimpleTransfer$3({ transaction, signer })
    }
  };

  const submitContractInteraction$3 = ({ transaction, signer, provider })=>{
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

  const submitSimpleTransfer$3 = ({ transaction, signer })=>{
    return signer.sendTransaction({
      to: transaction.to,
      value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
    })
  };

  function _optionalChain$h(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  class WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Ethereum Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA0NDYuNCAzNzYuOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ2LjQgMzc2Ljg7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojODI4NDg3O30KCS5zdDF7ZmlsbDojMzQzNDM0O30KCS5zdDJ7ZmlsbDojOEM4QzhDO30KCS5zdDN7ZmlsbDojM0MzQzNCO30KCS5zdDR7ZmlsbDojMTQxNDE0O30KCS5zdDV7ZmlsbDojMzkzOTM5O30KPC9zdHlsZT4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTM4MS43LDExMC4yaDY0LjdWNDYuNWMwLTI1LjctMjAuOC00Ni41LTQ2LjUtNDYuNUg0Ni41QzIwLjgsMCwwLDIwLjgsMCw0Ni41djY1LjFoMzUuN2wyNi45LTI2LjkKCWMxLjUtMS41LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDc4LjZjNS4zLTI1LjUsMzAuMi00Miw1NS43LTM2LjdjMjUuNSw1LjMsNDIsMzAuMiwzNi43LDU1LjdjLTEuNiw3LjUtNC45LDE0LjYtOS44LDIwLjUKCWMtMC45LDEuMS0xLjksMi4yLTMsMy4zYy0xLjEsMS4xLTIuMiwyLjEtMy4zLDNjLTIwLjEsMTYuNi00OS45LDEzLjgtNjYuNS02LjNjLTQuOS01LjktOC4zLTEzLTkuOC0yMC42SDczLjJsLTI2LjksMjYuOAoJYy0xLjUsMS41LTMuNiwyLjUtNS43LDIuN2wwLDBoLTAuNGgtMC4xaC0wLjVIMHY3NGgyOC44bDE4LjItMTguMmMxLjUtMS42LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDI5LjkKCWM1LjItMjUuNSwzMC4yLTQxLjksNTUuNy0zNi43czQxLjksMzAuMiwzNi43LDU1LjdzLTMwLjIsNDEuOS01NS43LDM2LjdjLTE4LjUtMy44LTMyLjktMTguMi0zNi43LTM2LjdINTcuN2wtMTguMiwxOC4zCgljLTEuNSwxLjUtMy42LDIuNS01LjcsMi43bDAsMGgtMC40SDB2MzQuMmg1Ni4zYzAuMiwwLDAuMywwLDAuNSwwaDAuMWgwLjRsMCwwYzIuMiwwLjIsNC4yLDEuMiw1LjgsMi44bDI4LDI4aDU3LjcKCWM1LjMtMjUuNSwzMC4yLTQyLDU1LjctMzYuN3M0MiwzMC4yLDM2LjcsNTUuN2MtMS43LDguMS01LjUsMTUuNy0xMSwyMS45Yy0wLjYsMC43LTEuMiwxLjMtMS45LDJzLTEuMywxLjMtMiwxLjkKCWMtMTkuNSwxNy4zLTQ5LjMsMTUuNi02Ni43LTMuOWMtNS41LTYuMi05LjMtMTMuNy0xMS0yMS45SDg3LjFjLTEuMSwwLTIuMS0wLjItMy4xLTAuNWgtMC4xbC0wLjMtMC4xbC0wLjItMC4xbC0wLjItMC4xbC0wLjMtMC4xCgloLTAuMWMtMC45LTAuNS0xLjgtMS4xLTIuNi0xLjhsLTI4LTI4SDB2NTMuNWMwLjEsMjUuNywyMC45LDQ2LjQsNDYuNSw0Ni40aDM1My4zYzI1LjcsMCw0Ni41LTIwLjgsNDYuNS00Ni41di02My42aC02NC43CgljLTQzLjIsMC03OC4yLTM1LTc4LjItNzguMmwwLDBDMzAzLjUsMTQ1LjIsMzM4LjUsMTEwLjIsMzgxLjcsMTEwLjJ6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMjAuOSwyOTguMWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIyMC45LDMxMi40LDIyMC45LDI5OC4xTDIyMC45LDI5OC4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjE5LjYsOTEuNWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIxOS42LDEwNS44LDIxOS42LDkxLjV6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zODIuMiwxMjguOGgtMC41Yy0zMi45LDAtNTkuNiwyNi43LTU5LjYsNTkuNmwwLDBsMCwwYzAsMzIuOSwyNi43LDU5LjYsNTkuNiw1OS42bDAsMGgwLjUKCWMzMi45LDAsNTkuNi0yNi43LDU5LjYtNTkuNmwwLDBDNDQxLjgsMTU1LjQsNDE1LjEsMTI4LjgsMzgyLjIsMTI4Ljh6IE0zOTYuNiwyMTkuNGgtMzFsOC45LTMyLjVjLTcuNy0zLjctMTEtMTIuOS03LjQtMjAuNgoJYzMuNy03LjcsMTIuOS0xMSwyMC42LTcuNGM3LjcsMy43LDExLDEyLjksNy40LDIwLjZjLTEuNSwzLjItNC4xLDUuOC03LjQsNy40TDM5Ni42LDIxOS40eiIvPgo8ZyBpZD0iTGF5ZXJfeDAwMjBfMSI+Cgk8ZyBpZD0iXzE0MjEzOTQzNDI0MDAiPgoJCTxnPgoJCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjEyOSwxNjYuMiAxMjguNywxNjcuMyAxMjguNywyMDEuNCAxMjksMjAxLjcgMTQ0LjgsMTkyLjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDE2Ni4yIDExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDMiIHBvaW50cz0iMTI5LDIwNC43IDEyOC44LDIwNC45IDEyOC44LDIxNyAxMjksMjE3LjYgMTQ0LjgsMTk1LjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDIxNy42IDEyOSwyMDQuNyAxMTMuMiwxOTUuNCAJCQkiLz4KCQkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMjksMjAxLjcgMTQ0LjgsMTkyLjQgMTI5LDE4NS4yIAkJCSIvPgoJCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJPC9nPgoJPC9nPgo8L2c+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ 
      return (
        _optionalChain$h([window, 'optionalAccess', _31 => _31.ethereum]) &&
        // not MetaMask
        !(_optionalChain$h([window, 'optionalAccess', _32 => _32.ethereum, 'optionalAccess', _33 => _33.isMetaMask]) && Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!PocketUniverse)(?!RevokeCash)/)).length == 1) &&
        // not Coin98
        !_optionalChain$h([window, 'optionalAccess', _34 => _34.coin98]) &&
        // not Trust Wallet
        !(_optionalChain$h([window, 'optionalAccess', _35 => _35.ethereum, 'optionalAccess', _36 => _36.isTrust]) || _optionalChain$h([window, 'optionalAccess', _37 => _37.ethereum, 'optionalAccess', _38 => _38.isTrustWallet])) &&
        // not crypto.com
        !_optionalChain$h([window, 'optionalAccess', _39 => _39.ethereum, 'optionalAccess', _40 => _40.isDeficonnectProvider]) &&
        // not HyperPay
        !_optionalChain$h([window, 'optionalAccess', _41 => _41.ethereum, 'optionalAccess', _42 => _42.isHyperPay]) &&
        // not Phantom
        !(window.phantom && !window.glow && !_optionalChain$h([window, 'optionalAccess', _43 => _43.solana, 'optionalAccess', _44 => _44.isGlow]) && !['isBitKeep'].some((identifier)=>window.solana && window.solana[identifier])) &&
        // not Rabby
        !_optionalChain$h([window, 'optionalAccess', _45 => _45.ethereum, 'optionalAccess', _46 => _46.isRabby]) &&
        // not Backpack
        !_optionalChain$h([window, 'optionalAccess', _47 => _47.backpack, 'optionalAccess', _48 => _48.isBackpack]) &&
        // not TokenPocket
        !_optionalChain$h([window, 'optionalAccess', _49 => _49.ethereum, 'optionalAccess', _50 => _50.isTokenPocket]) && 
        // not BitKeep
        !_optionalChain$h([window, 'optionalAccess', _51 => _51.ethereum, 'optionalAccess', _52 => _52.isBitKeep]) && 
        // not Coinbase
        !(_optionalChain$h([window, 'optionalAccess', _53 => _53.ethereum, 'optionalAccess', _54 => _54.isCoinbaseWallet]) || _optionalChain$h([window, 'optionalAccess', _55 => _55.ethereum, 'optionalAccess', _56 => _56.isWalletLink])) &&
        // MetaMask through ProviderMap
        !_optionalChain$h([window, 'optionalAccess', _57 => _57.ethereum, 'optionalAccess', _58 => _58.providerMap, 'optionalAccess', _59 => _59.has, 'call', _60 => _60('MetaMask')])
      )
    };}
    
    constructor () {
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      this.sendTransaction = (transaction)=>{
        return sendTransaction$3({
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

  function _optionalChain$g(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Binance extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Binance Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIgMTkzLjY4Ij48cmVjdCB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5My42OCIgZmlsbD0iIzFlMjAyNCIvPjxwYXRoIGQ9Im01Ni45Miw0Ni41M2wzOS4wOC0yMi41NCwzOS4wOCwyMi41NC0xNC4zNSw4LjM2LTI0LjczLTE0LjE4LTI0LjczLDE0LjE4LTE0LjM1LTguMzZabTc4LjE3LDI4LjUzbC0xNC4zNS04LjM2LTI0LjczLDE0LjI3LTI0LjczLTE0LjI3LTE0LjM1LDguMzZ2MTYuNzFsMjQuNzMsMTQuMTh2MjguNDVsMTQuMzUsOC4zNiwxNC4zNS04LjM2di0yOC40NWwyNC43My0xNC4yN3YtMTYuNjNabTAsNDUuMTZ2LTE2LjcxbC0xNC4zNSw4LjM2djE2LjcxbDE0LjM1LTguMzZabTEwLjIxLDUuODJsLTI0LjczLDE0LjI3djE2LjcxbDM5LjA4LTIyLjU0di00NS4yNWwtMTQuMzUsOC4zNnYyOC40NVptLTE0LjM1LTY1LjI1bDE0LjM1LDguMzZ2MTYuNzFsMTQuMzUtOC4zNnYtMTYuNzFsLTE0LjM1LTguMzYtMTQuMzUsOC4zNlptLTQ5LjMsODUuNnYxNi43MWwxNC4zNSw4LjM2LDE0LjM1LTguMzZ2LTE2LjcxbC0xNC4zNSw4LjM2LTE0LjM1LTguMzZabS0yNC43My0yNi4xN2wxNC4zNSw4LjM2di0xNi43MWwtMTQuMzUtOC4zNnYxNi43MVptMjQuNzMtNTkuNDNsMTQuMzUsOC4zNiwxNC4zNS04LjM2LTE0LjM1LTguMzYtMTQuMzUsOC4zNlptLTM0Ljk1LDguMzZsMTQuMzUtOC4zNi0xNC4zNS04LjM2LTE0LjM1LDguMzZ2MTYuNzFsMTQuMzUsOC4zNnYtMTYuNzFabTAsMjguNDVsLTE0LjM1LTguMzZ2NDUuMTZsMzkuMDgsMjIuNTR2LTE2LjcxbC0yNC43My0xNC4yN3MwLTI4LjM2LDAtMjguMzZaIiBmaWxsPSIjZjBiOTBiIi8+PC9zdmc+",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return _optionalChain$g([window, 'optionalAccess', _2 => _2.BinanceChain]) &&
        !window.coin98
    };}

    getProvider() { return window.BinanceChain }

  } Binance.__initStatic(); Binance.__initStatic2();

  function _optionalChain$f(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Brave extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Brave',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyNTYgMzAxIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNTYgMzAxIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoKCTxwYXRoIGZpbGw9IiNGMTVBMjIiIGQ9Im0yMzYgMTA1LjQtNy44LTIxLjIgNS40LTEyLjJjMC43LTEuNiAwLjMtMy40LTAuOC00LjZsLTE0LjgtMTQuOWMtNi41LTYuNS0xNi4xLTguOC0yNC44LTUuN2wtNC4xIDEuNC0yMi42LTI0LjUtMzguMi0wLjNoLTAuM2wtMzguNSAwLjMtMjIuNiAyNC43LTQtMS40Yy04LjgtMy4xLTE4LjUtMC44LTI1IDUuOGwtMTUgMTUuMmMtMSAxLTEuMyAyLjQtMC44IDMuN2w1LjcgMTIuNy03LjggMjEuMiA1LjEgMTkuMiAyMyA4Ny4yYzIuNiAxMCA4LjcgMTguOCAxNy4yIDI0LjkgMCAwIDI3LjggMTkuNyA1NS4zIDM3LjUgMi40IDEuNiA1IDIuNyA3LjcgMi43czUuMi0xLjEgNy43LTIuN2MzMC45LTIwLjIgNTUuMy0zNy41IDU1LjMtMzcuNSA4LjQtNi4xIDE0LjUtMTQuOCAxNy4xLTI0LjlsMjIuOC04Ny4yIDQuOC0xOS40eiIvPgoJPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0ibTEzMy4xIDE3OS40Yy0xLTAuNC0yLjEtMC44LTIuNC0wLjhoLTIuN2MtMC4zIDAtMS40IDAuMy0yLjQgMC44bC0xMSA0LjZjLTEgMC40LTIuNyAxLjItMy43IDEuN2wtMTYuNSA4LjZjLTEgMC41LTEuMSAxLjQtMC4yIDIuMWwxNC42IDEwLjNjMC45IDAuNyAyLjQgMS44IDMuMiAyLjVsNi41IDUuNmMwLjggMC44IDIuMiAxLjkgMyAyLjdsNi4yIDUuNmMwLjggMC44IDIuMiAwLjggMyAwbDYuNC01LjZjMC44LTAuOCAyLjItMS45IDMtMi43bDYuNS01LjdjMC44LTAuOCAyLjMtMS45IDMuMi0yLjVsMTQuNi0xMC40YzAuOS0wLjcgMC44LTEuNi0wLjItMi4xbC0xNi41LTguNGMtMS0wLjUtMi43LTEuMy0zLjctMS43bC0xMC45LTQuNnoiLz4KCTxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Im0yMTIuMiAxMDkuMmMwLjMtMS4xIDAuMy0xLjUgMC4zLTEuNSAwLTEuMS0wLjEtMy0wLjMtNGwtMC44LTIuNGMtMC41LTEtMS40LTIuNi0yLTMuNWwtOS41LTE0LjFjLTAuNi0wLjktMS43LTIuNC0yLjQtMy4zbC0xMi4zLTE1LjRjLTAuNy0wLjgtMS40LTEuNi0xLjQtMS41aC0wLjJzLTAuOSAwLjItMiAwLjNsLTE4LjggMy43Yy0xLjEgMC4zLTIuOSAwLjYtNCAwLjhsLTAuMyAwLjFjLTEuMSAwLjItMi45IDAuMS00LTAuM2wtMTUuOC01LjFjLTEuMS0wLjMtMi45LTAuOC0zLjktMS4xIDAgMC0zLjItMC44LTUuOC0wLjctMi42IDAtNS44IDAuNy01LjggMC43LTEuMSAwLjMtMi45IDAuOC0zLjkgMS4xbC0xNS44IDUuMWMtMS4xIDAuMy0yLjkgMC40LTQgMC4zbC0wLjMtMC4xYy0xLjEtMC4yLTIuOS0wLjYtNC0wLjhsLTE5LTMuNWMtMS4xLTAuMy0yLTAuMy0yLTAuM2gtMC4yYy0wLjEgMC0wLjggMC43LTEuNCAxLjVsLTEyLjMgMTUuMmMtMC43IDAuOC0xLjggMi40LTIuNCAzLjNsLTkuNSAxNC4xYy0wLjYgMC45LTEuNSAyLjUtMiAzLjVsLTAuOCAyLjRjLTAuMiAxLjEtMC4zIDMtMC4zIDQuMSAwIDAgMCAwLjMgMC4zIDEuNSAwLjYgMiAyIDMuOSAyIDMuOSAwLjcgMC44IDEuOSAyLjMgMi43IDNsMjcuOSAyOS43YzAuOCAwLjggMSAyLjQgMC42IDMuNGwtNS44IDEzLjhjLTAuNCAxLTAuNSAyLjctMC4xIDMuOGwxLjYgNC4zYzEuMyAzLjYgMy42IDYuOCA2LjcgOS4zbDUuNyA0LjZjMC44IDAuNyAyLjQgMC45IDMuNCAwLjRsMTcuOS04LjVjMS0wLjUgMi41LTEuNSAzLjQtMi4zbDEyLjgtMTEuNmMxLjktMS43IDEuOS00LjYgMC4zLTYuNGwtMjYuOS0xOC4xYy0wLjktMC42LTEuMy0xLjktMC44LTNsMTEuOC0yMi4zYzAuNS0xIDAuNi0yLjYgMC4yLTMuNmwtMS40LTMuM2MtMC40LTEtMS43LTIuMi0yLjctMi42bC0zNC45LTEzYy0xLTAuNC0xLTAuOCAwLjEtMC45bDIyLjQtMi4xYzEuMS0wLjEgMi45IDAuMSA0IDAuM2wxOS45IDUuNmMxLjEgMC4zIDEuOCAxLjQgMS42IDIuNWwtNyAzNy44Yy0wLjIgMS4xLTAuMiAyLjYgMC4xIDMuNXMxLjMgMS42IDIuNCAxLjlsMTMuOCAzYzEuMSAwLjMgMi45IDAuMyA0IDBsMTIuOS0zYzEuMS0wLjMgMi4yLTEuMSAyLjQtMS45IDAuMy0wLjggMC4zLTIuNCAwLjEtMy41bC02LjgtMzcuOWMtMC4yLTEuMSAwLjUtMi4zIDEuNi0yLjVsMTkuOS01LjZjMS4xLTAuMyAyLjktMC40IDQtMC4zbDIyLjQgMi4xYzEuMSAwLjEgMS4yIDAuNSAwLjEgMC45bC0zNC43IDEzLjJjLTEgMC40LTIuMyAxLjUtMi43IDIuNmwtMS40IDMuM2MtMC40IDEtMC40IDIuNyAwLjIgMy42bDExLjkgMjIuM2MwLjUgMSAwLjIgMi4zLTAuOCAzbC0yNi45IDE4LjJjLTEuOCAxLjgtMS42IDQuNyAwLjMgNi40bDEyLjggMTEuNmMwLjggMC44IDIuNCAxLjggMy40IDIuMmwxOCA4LjVjMSAwLjUgMi41IDAuMyAzLjQtMC40bDUuNy00LjZjMy0yLjQgNS4zLTUuNyA2LjYtOS4zbDEuNi00LjNjMC40LTEgMC4zLTIuOC0wLjEtMy44bC01LjgtMTMuOGMtMC40LTEtMC4yLTIuNSAwLjYtMy40bDI3LjktMjkuN2MwLjgtMC44IDEuOS0yLjIgMi43LTMtMC40LTAuMyAxLjEtMi4xIDEuNi00LjF6Ii8+Cgo8L3N2Zz4K",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$f([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isBraveWallet]) };}
  } Brave.__initStatic(); Brave.__initStatic2();

  function _optionalChain$e(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Coin98 extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Coin98',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA0MC43IDQwIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA0MC43IDQwIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsPSIjRDlCNDMyIiBkPSJtMzMuMyAwaC0yNS45Yy00LjEgMC03LjQgMy4zLTcuNCA3LjN2MjUuNGMwIDQgMy4zIDcuMyA3LjQgNy4zaDI1LjljNC4xIDAgNy40LTMuMyA3LjQtNy4zdi0yNS40YzAtNC0zLjMtNy4zLTcuNC03LjN6Ii8+CjxwYXRoIGZpbGw9IiMyNTI1MjUiIGQ9Im0zMy4zIDBoLTI1LjljLTQuMSAwLTcuNCAzLjMtNy40IDcuM3YyNS40YzAgNCAzLjMgNy4zIDcuNCA3LjNoMjUuOWM0LjEgMCA3LjQtMy4zIDcuNC03LjN2LTI1LjRjMC00LTMuMy03LjMtNy40LTcuM3ptLTYuMyAxMGMzIDAgNS41IDIuNCA1LjUgNS40IDAgMC45LTAuMiAxLjgtMC42IDIuNi0wLjctMC41LTEuNS0xLTIuMy0xLjMgMC4yLTAuNCAwLjMtMC45IDAuMy0xLjMgMC0xLjUtMS4zLTIuOC0yLjgtMi44LTEuNiAwLTIuOCAxLjMtMi44IDIuOCAwIDAuNSAwLjEgMC45IDAuMyAxLjMtMC44IDAuMy0xLjYgMC43LTIuMyAxLjMtMC41LTAuOC0wLjYtMS43LTAuNi0yLjYtMC4xLTMgMi4zLTUuNCA1LjMtNS40em0tMTMuMyAyMGMtMyAwLTUuNS0yLjQtNS41LTUuNGgyLjZjMCAxLjUgMS4zIDIuOCAyLjggMi44czIuOC0xLjMgMi44LTIuOGgyLjZjMC4yIDMtMi4zIDUuNC01LjMgNS40em0wLTcuNWMtMy41IDAtNi4zLTIuOC02LjMtNi4yczIuOC02LjMgNi4zLTYuMyA2LjQgMi44IDYuNCA2LjNjMCAzLjQtMi45IDYuMi02LjQgNi4yem0xMy4zIDcuNWMtMy41IDAtNi40LTIuOC02LjQtNi4yIDAtMy41IDIuOC02LjMgNi40LTYuMyAzLjUgMCA2LjMgMi44IDYuMyA2LjMgMC4xIDMuNC0yLjggNi4yLTYuMyA2LjJ6bTMuOC02LjNjMCAyLjEtMS43IDMuNy0zLjggMy43cy0zLjgtMS43LTMuOC0zLjdjMC0yLjEgMS43LTMuNyAzLjgtMy43IDIuMSAwLjEgMy44IDEuNyAzLjggMy43em0tMTMuNC03LjRjMCAyLjEtMS43IDMuNy0zLjggMy43cy0zLjgtMS43LTMuOC0zLjdjMC0yLjEgMS43LTMuNyAzLjgtMy43IDIuMiAwIDMuOCAxLjYgMy44IDMuN3oiLz4KPC9zdmc+Cg==",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$e([window, 'optionalAccess', _2 => _2.coin98]) };}
  } Coin98.__initStatic(); Coin98.__initStatic2();

  function _optionalChain$d(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Coinbase extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Coinbase',
      logo: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB2aWV3Qm94PScwIDAgNDg4Ljk2IDQ4OC45Nic+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6IzQzNjFhZDt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9J2xpbmVhci1ncmFkaWVudCcgeDE9JzI1MCcgeTE9JzcuMzUnIHgyPScyNTAnIHkyPSc0OTYuMzInIGdyYWRpZW50VHJhbnNmb3JtPSdtYXRyaXgoMSwgMCwgMCwgLTEsIDAsIDUwMiknIGdyYWRpZW50VW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyMzZDViYTknLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyM0ODY4YjEnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNTAsNS42OEMxMTQuODcsNS42OCw1LjUyLDExNSw1LjUyLDI1MC4xN1MxMTQuODcsNDk0LjY1LDI1MCw0OTQuNjUsNDk0LjQ4LDM4NS4yOSw0OTQuNDgsMjUwLjE3LDM4NS4xMyw1LjY4LDI1MCw1LjY4Wm0wLDM4Ny41NEExNDMuMDYsMTQzLjA2LDAsMSwxLDM5My4wNSwyNTAuMTcsMTQzLjExLDE0My4xMSwwLDAsMSwyNTAsMzkzLjIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUuNTIgLTUuNjgpJy8+PHBhdGggY2xhc3M9J2Nscy0yJyBkPSdNMjg0LjY5LDI5Ni4wOUgyMTUuMzFhMTEsMTEsMCwwLDEtMTAuOS0xMC45VjIxNS40OGExMSwxMSwwLDAsMSwxMC45LTEwLjkxSDI4NWExMSwxMSwwLDAsMSwxMC45LDEwLjkxdjY5LjcxQTExLjA3LDExLjA3LDAsMCwxLDI4NC42OSwyOTYuMDlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNS41MiAtNS42OCknLz48L3N2Zz4=",
      blockchains: supported$1.evm
    };}

    getProvider() { 
      if(_optionalChain$d([window, 'optionalAccess', _9 => _9.ethereum, 'optionalAccess', _10 => _10.providerMap, 'optionalAccess', _11 => _11.has, 'call', _12 => _12('CoinbaseWallet')])) {
        return _optionalChain$d([window, 'optionalAccess', _13 => _13.ethereum, 'optionalAccess', _14 => _14.providerMap, 'optionalAccess', _15 => _15.get, 'call', _16 => _16('CoinbaseWallet')])
      } else {
        return window.ethereum
      }
    }

    static __initStatic2() {this.isAvailable = async()=>{ 
      return(
        (
          _optionalChain$d([window, 'optionalAccess', _17 => _17.ethereum, 'optionalAccess', _18 => _18.isCoinbaseWallet]) || _optionalChain$d([window, 'optionalAccess', _19 => _19.ethereum, 'optionalAccess', _20 => _20.isWalletLink])
        ) || (
          _optionalChain$d([window, 'optionalAccess', _21 => _21.ethereum, 'optionalAccess', _22 => _22.providerMap, 'optionalAccess', _23 => _23.has, 'call', _24 => _24('CoinbaseWallet')])
        )
      )
    };}
  } Coinbase.__initStatic(); Coinbase.__initStatic2();

  function _optionalChain$c(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class CryptoCom extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Crypto.com | DeFi Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA4OS45IDEwMi44IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA4OS45IDEwMi44IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNGRkZGRkY7fQoJLnN0MXtmaWxsOiMwMzMxNkM7fQo8L3N0eWxlPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuMzc1MSAtMTEzLjYxKSI+Cgk8ZyB0cmFuc2Zvcm09Im1hdHJpeCguMzE3OTQgMCAwIC4zMTQ2NSAtMS4wNDczIDMwLjQ0NykiPgoJCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Im0xNjEuNiAyNjQuMy0xNDEuNCA4MS42djE2My4zbDE0MS40IDgxLjYgMTQxLjQtODEuNnYtMTYzLjNsLTE0MS40LTgxLjZ6bTAgMC0xNDEuNCA4MS42djE2My4zbDE0MS40IDgxLjYgMTQxLjQtODEuNnYtMTYzLjNsLTE0MS40LTgxLjZ6Ii8+CgkJPHBhdGggY2xhc3M9InN0MSIgZD0ibTIxNy41IDUyNy4xaC0yMC4xbC0yNC4xLTIyLjF2LTExLjNsMjQuOS0yMy44di0zNy43bDMyLjYtMjEuMyAzNy4xIDI4LjEtNTAuNCA4OC4xem0tODMuMy01OS42IDMuNy0zNS40LTEyLjItMzEuN2g3MmwtMTEuOSAzMS43IDMuNCAzNS40aC01NXptMTYuNCAzNy41LTI0LjEgMjIuNGgtMjAuNGwtNTAuNy04OC40IDM3LjQtMjcuOCAzMi45IDIxdjM3LjdsMjQuOSAyMy44djExLjN6bS00NC44LTE3MC4xaDExMS40bDEzLjMgNTYuN2gtMTM3LjdsMTMtNTYuN3ptNTUuOC03MC42LTE0MS40IDgxLjZ2MTYzLjNsMTQxLjQgODEuNiAxNDEuNC04MS42di0xNjMuM2wtMTQxLjQtODEuNnoiLz4KCTwvZz4KPC9nPgo8L3N2Zz4K",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$c([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isDeficonnectProvider]) };}
  } CryptoCom.__initStatic(); CryptoCom.__initStatic2();

  function _optionalChain$b(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class HyperPay extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'HyperPay',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjA0LjcgMjAwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyMDQuNyAyMDA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZmlsbD0iIzFBNzJGRSIgZD0iTTEwMi41LDUuMkM1MC44LDUuMiw4LjgsNDcuMiw4LjgsOTlzNDIsOTMuNSw5My44LDkzLjVzOTMuOC00Miw5My44LTkzLjhTMTU0LjIsNS4yLDEwMi41LDUuMnogTTEyNy4yLDExOS4yCgljLTYuMiwwLTIxLjcsMC4zLTIxLjcsMC4zbC03LDI3aC0yOWw2LjgtMjYuNUgzMWw3LjItMjEuOGMwLDAsNzguOCwwLjIsODUuMiwwYzYuNS0wLjIsMTYuNS0xLjgsMTYuOC0xNC44YzAuMy0xNy44LTI3LTE2LjgtMjkuMi0xCgljLTEuNSwxMC0xLjUsMTIuNS0xLjUsMTIuNUg4My44bDUtMjMuNUg0N2w2LjMtMjJjMCwwLDYxLjIsMC4yLDcyLjgsMC4yczQyLjIsMyw0Mi4yLDMxLjJDMTY4LjIsMTEyLDEzOC41LDExOS4zLDEyNy4yLDExOS4yCglMMTI3LjIsMTE5LjJ6Ii8+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$b([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isHyperPay]) };}
  } HyperPay.__initStatic(); HyperPay.__initStatic2();

  function _optionalChain$a(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class MetaMask extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'MetaMask',
      logo: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0ODUuOTMgNDUwLjU2Jz48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzgyODQ4Nzt9LmNscy0ye2ZpbGw6I2UyNzcyNjtzdHJva2U6I2UyNzcyNjt9LmNscy0xMCwuY2xzLTExLC5jbHMtMiwuY2xzLTMsLmNscy00LC5jbHMtNSwuY2xzLTYsLmNscy03LC5jbHMtOCwuY2xzLTl7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTN7ZmlsbDojZTM3NzI1O3N0cm9rZTojZTM3NzI1O30uY2xzLTR7ZmlsbDojZDZjMGIzO3N0cm9rZTojZDZjMGIzO30uY2xzLTV7ZmlsbDojMjQzNDQ3O3N0cm9rZTojMjQzNDQ3O30uY2xzLTZ7ZmlsbDojY2Q2MzI4O3N0cm9rZTojY2Q2MzI4O30uY2xzLTd7ZmlsbDojZTM3NTI1O3N0cm9rZTojZTM3NTI1O30uY2xzLTh7ZmlsbDojZjY4NTFmO3N0cm9rZTojZjY4NTFmO30uY2xzLTl7ZmlsbDojYzFhZTllO3N0cm9rZTojYzFhZTllO30uY2xzLTEwe2ZpbGw6IzE3MTcxNztzdHJva2U6IzE3MTcxNzt9LmNscy0xMXtmaWxsOiM3NjNlMWE7c3Ryb2tlOiM3NjNlMWE7fTwvc3R5bGU+PC9kZWZzPjxwYXRoIGNsYXNzPSdjbHMtMScgZD0nTTI0Ny45MSwzNTYuMjlhMjYsMjYsMCwxLDAtMjYsMjZBMjYsMjYsMCwwLDAsMjQ3LjkxLDM1Ni4yOVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03Ljk3IC0yMS4zMyknLz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNDYuNTUsMTQ5LjcxYTI2LDI2LDAsMSwwLTI2LDI2QTI2LDI2LDAsMCwwLDI0Ni41NSwxNDkuNzFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNy45NyAtMjEuMzMpJy8+PGNpcmNsZSBjbGFzcz0nY2xzLTEnIGN4PScxNDguNCcgY3k9JzIzMC4wNScgcj0nMjUuOTknLz48cG9seWdvbiBjbGFzcz0nY2xzLTInIHBvaW50cz0nNDYxLjI4IDAuNSAyNzIuMDYgMTQxLjAzIDMwNy4wNSA1OC4xMiA0NjEuMjggMC41Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzI0LjQ2IDAuNSAyMTIuMTYgMTQyLjM3IDE3OC44OCA1OC4xMiAyNC40NiAwLjUnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMzkzLjIgMzI2LjI2IDM0Mi44MSA0MDMuNDcgNDUwLjYzIDQzMy4xNCA0ODEuNjMgMzI3Ljk3IDM5My4yIDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPSc0LjQ5IDMyNy45NyAzNS4zIDQzMy4xNCAxNDMuMTMgNDAzLjQ3IDkyLjczIDMyNi4yNiA0LjQ5IDMyNy45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPScxMzcuMDQgMTk1LjggMTA3IDI0MS4yNSAyMTQuMDYgMjQ2LjAxIDIxMC4yNiAxMzAuOTYgMTM3LjA0IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzM0OC43IDE5NS44IDI3NC41MyAxMjkuNjMgMjcyLjA2IDI0Ni4wMSAzNzguOTQgMjQxLjI1IDM0OC43IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzE0My4xMyA0MDMuNDcgMjA3LjQxIDM3Mi4wOSAxNTEuODggMzI4LjczIDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAzNDIuODEgNDAzLjQ3IDMzMy44NyAzMjguNzMgMjc4LjM0IDM3Mi4wOScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPSczNDIuODEgNDAzLjQ3IDI3OC4zNCAzNzIuMDkgMjgzLjQ3IDQxNC4xMiAyODIuOSA0MzEuODEgMzQyLjgxIDQwMy40NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPScxNDMuMTMgNDAzLjQ3IDIwMy4wMyA0MzEuODEgMjAyLjY1IDQxNC4xMiAyMDcuNDEgMzcyLjA5IDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTUnIHBvaW50cz0nMjAzLjk4IDMwMC45NyAxNTAuMzUgMjg1LjE4IDE4OC4yIDI2Ny44OCAyMDMuOTggMzAwLjk3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy01JyBwb2ludHM9JzI4MS43NiAzMDAuOTcgMjk3LjU1IDI2Ny44OCAzMzUuNTggMjg1LjE4IDI4MS43NiAzMDAuOTcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTYnIHBvaW50cz0nMTQzLjEzIDQwMy40NyAxNTIuMjUgMzI2LjI2IDkyLjczIDMyNy45NyAxNDMuMTMgNDAzLjQ3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy02JyBwb2ludHM9JzMzMy42OCAzMjYuMjYgMzQyLjgxIDQwMy40NyAzOTMuMiAzMjcuOTcgMzMzLjY4IDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPSczNzguOTQgMjQxLjI1IDI3Mi4wNiAyNDYuMDEgMjgxLjk1IDMwMC45NyAyOTcuNzQgMjY3Ljg4IDMzNS43NyAyODUuMTggMzc4Ljk0IDI0MS4yNScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE4OC4zOSAyNjcuODggMjAzLjk4IDMwMC45NyAyMTQuMDYgMjQ2LjAxIDEwNyAyNDEuMjUgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNycgcG9pbnRzPScxMDcgMjQxLjI1IDE1MS44OCAzMjguNzMgMTUwLjM1IDI4NS4xOCAxMDcgMjQxLjI1Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzMzNS43NyAyODUuMTggMzMzLjg3IDMyOC43MyAzNzguOTQgMjQxLjI1IDMzNS43NyAyODUuMTgnLz48cG9seWdvbiBjbGFzcz0nY2xzLTcnIHBvaW50cz0nMjE0LjA2IDI0Ni4wMSAyMDMuOTggMzAwLjk3IDIxNi41MyAzNjUuODIgMjE5LjM4IDI4MC40MyAyMTQuMDYgMjQ2LjAxJy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzI3Mi4wNiAyNDYuMDEgMjY2LjkzIDI4MC4yNCAyNjkuMjEgMzY1LjgyIDI4MS45NSAzMDAuOTcgMjcyLjA2IDI0Ni4wMScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyODEuOTUgMzAwLjk3IDI2OS4yMSAzNjUuODIgMjc4LjM0IDM3Mi4wOSAzMzMuODcgMzI4LjczIDMzNS43NyAyODUuMTggMjgxLjk1IDMwMC45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE1MS44OCAzMjguNzMgMjA3LjQxIDM3Mi4wOSAyMTYuNTMgMzY1LjgyIDIwMy45OCAzMDAuOTcgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOScgcG9pbnRzPScyODIuOSA0MzEuODEgMjgzLjQ3IDQxNC4xMiAyNzguNzIgNDA5Ljk0IDIwNy4wMiA0MDkuOTQgMjAyLjY1IDQxNC4xMiAyMDMuMDMgNDMxLjgxIDE0My4xMyA0MDMuNDcgMTY0LjA1IDQyMC41OCAyMDYuNDUgNDUwLjA2IDI3OS4yOSA0NTAuMDYgMzIxLjg5IDQyMC41OCAzNDIuODEgNDAzLjQ3IDI4Mi45IDQzMS44MScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTAnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAyNjkuMjEgMzY1LjgyIDIxNi41MyAzNjUuODIgMjA3LjQxIDM3Mi4wOSAyMDIuNjUgNDE0LjEyIDIwNy4wMiA0MDkuOTQgMjc4LjcyIDQwOS45NCAyODMuNDcgNDE0LjEyIDI3OC4zNCAzNzIuMDknLz48cG9seWdvbiBjbGFzcz0nY2xzLTExJyBwb2ludHM9JzQ2OS4yNyAxNTAuMTYgNDg1LjQzIDcyLjU3IDQ2MS4yOCAwLjUgMjc4LjM0IDEzNi4yOCAzNDguNyAxOTUuOCA0NDguMTYgMjI0LjkgNDcwLjIyIDE5OS4yMyA0NjAuNzEgMTkyLjM4IDQ3NS45MiAxNzguNSA0NjQuMTMgMTY5LjM3IDQ3OS4zNSAxNTcuNzcgNDY5LjI3IDE1MC4xNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTEnIHBvaW50cz0nMC41IDcyLjU3IDE2LjY2IDE1MC4xNiA2LjM5IDE1Ny43NyAyMS42MSAxNjkuMzcgMTAuMDEgMTc4LjUgMjUuMjIgMTkyLjM4IDE1LjcxIDE5OS4yMyAzNy41OCAyMjQuOSAxMzcuMDQgMTk1LjggMjA3LjQxIDEzNi4yOCAyNC40NiAwLjUgMC41IDcyLjU3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzQ0OC4xNiAyMjQuOSAzNDguNyAxOTUuOCAzNzguOTQgMjQxLjI1IDMzMy44NyAzMjguNzMgMzkzLjIgMzI3Ljk3IDQ4MS42MyAzMjcuOTcgNDQ4LjE2IDIyNC45Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzEzNy4wNCAxOTUuOCAzNy41OCAyMjQuOSA0LjQ5IDMyNy45NyA5Mi43MyAzMjcuOTcgMTUxLjg4IDMyOC43MyAxMDcgMjQxLjI1IDEzNy4wNCAxOTUuOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyNzIuMDYgMjQ2LjAxIDI3OC4zNCAxMzYuMjggMzA3LjI0IDU4LjEyIDE3OC44OCA1OC4xMiAyMDcuNDEgMTM2LjI4IDIxNC4wNiAyNDYuMDEgMjE2LjM0IDI4MC42MiAyMTYuNTMgMzY1LjgyIDI2OS4yMSAzNjUuODIgMjY5LjU5IDI4MC42MiAyNzIuMDYgMjQ2LjAxJy8+PC9zdmc+",
      blockchains: supported$1.evm
    };}

    getProvider() { 
      if(_optionalChain$a([window, 'optionalAccess', _7 => _7.ethereum, 'optionalAccess', _8 => _8.providerMap, 'optionalAccess', _9 => _9.has, 'call', _10 => _10('MetaMask')])) {
        return _optionalChain$a([window, 'optionalAccess', _11 => _11.ethereum, 'optionalAccess', _12 => _12.providerMap, 'optionalAccess', _13 => _13.get, 'call', _14 => _14('MetaMask')])
      } else {
        return window.ethereum
      }
    }

    static __initStatic2() {this.isAvailable = async()=>{
      return(
        (
          _optionalChain$a([window, 'optionalAccess', _15 => _15.ethereum, 'optionalAccess', _16 => _16.isMetaMask]) &&
          Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!PocketUniverse)(?!RevokeCash)/)).length == 1
        ) || (
          _optionalChain$a([window, 'optionalAccess', _17 => _17.ethereum, 'optionalAccess', _18 => _18.providerMap, 'optionalAccess', _19 => _19.has, 'call', _20 => _20('MetaMask')])
        )
      )
    };}
  } MetaMask.__initStatic(); MetaMask.__initStatic2();

  function _optionalChain$9(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Opera extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Opera',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA3NS42IDc1LjYiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMyAwIDAgLTEuMzMzMyAwIDEwNy4yKSI+CiAgCiAgPGxpbmVhckdyYWRpZW50IGlkPSJvcGVyYUxvZ28wMDAwMDAxMjM1MTEiIHgxPSItMTA3LjM0IiB4Mj0iLTEwNi4zNCIgeTE9Ii0xMzcuODUiIHkyPSItMTM3Ljg1IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAgLTczLjI1NyAtNzMuMjU3IDAgLTEwMDc1IC03Nzg0LjEpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRkYxQjJEIiBvZmZzZXQ9IjAiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjFCMkQiIG9mZnNldD0iLjMiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjFCMkQiIG9mZnNldD0iLjYxNCIvPgogICAgPHN0b3Agc3RvcC1jb2xvcj0iI0E3MDAxNCIgb2Zmc2V0PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICAKICA8cGF0aCBmaWxsPSJ1cmwoI29wZXJhTG9nbzAwMDAwMDEyMzUxMSkiIGQ9Im0yOC4zIDgwLjRjLTE1LjYgMC0yOC4zLTEyLjctMjguMy0yOC4zIDAtMTUuMiAxMi0yNy42IDI3LTI4LjNoMS40YzcuMyAwIDEzLjkgMi43IDE4LjkgNy4yLTMuMy0yLjItNy4yLTMuNS0xMS40LTMuNS02LjggMC0xMi44IDMuMy0xNi45IDguNi0zLjEgMy43LTUuMiA5LjItNS4zIDE1LjN2MS4zYzAuMSA2LjEgMi4yIDExLjYgNS4zIDE1LjMgNC4xIDUuMyAxMC4xIDguNiAxNi45IDguNiA0LjIgMCA4LTEuMyAxMS40LTMuNS01IDQuNS0xMS42IDcuMi0xOC44IDcuMi0wLjEgMC4xLTAuMSAwLjEtMC4yIDAuMXoiLz4KICAKICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9Ii0xMDcuMDYiIHgyPSItMTA2LjA2IiB5MT0iLTEzOC4wNCIgeTI9Ii0xMzguMDQiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMCAtNjQuNzkyIC02NC43OTIgMCAtODkwNi4yIC02ODYwLjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBzdG9wLWNvbG9yPSIjOUMwMDAwIiBvZmZzZXQ9IjAiLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjRCNEIiIG9mZnNldD0iLjciLz4KICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRjRCNEIiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHBhdGggZD0ibTE5IDY4YzIuNiAzLjEgNiA0LjkgOS42IDQuOSA4LjMgMCAxNC45LTkuNCAxNC45LTIwLjlzLTYuNy0yMC45LTE0LjktMjAuOWMtMy43IDAtNyAxLjktOS42IDQuOSA0LjEtNS4zIDEwLjEtOC42IDE2LjktOC42IDQuMiAwIDggMS4zIDExLjQgMy41IDUuOCA1LjIgOS41IDEyLjcgOS41IDIxLjFzLTMuNyAxNS45LTkuNSAyMS4xYy0zLjMgMi4yLTcuMiAzLjUtMTEuNCAzLjUtNi44IDAuMS0xMi44LTMuMy0xNi45LTguNiIgZmlsbD0idXJsKCNiKSIvPgo8L2c+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return _optionalChain$9([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isOpera]) };}
  } Opera.__initStatic(); Opera.__initStatic2();

  function _optionalChain$8(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Rabby extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Rabby',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9ImthdG1hbl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjA0IDE1MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjA0IDE1MjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDF7ZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMTE4MzY5MTkwNjY5MjcyNDcwNjgwMDAwMDE1NjE0NDY3MTMxNjE1Mjc5NDkxXyk7fQoJLnN0MntmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjU1ZHSURfMDAwMDAwNjU3Nzc0NTQ3NDc4MDEzNzcwNTAwMDAwMDcwMDM5OTUyODQ2NDY5NTk3NzVfKTt9Cgkuc3Qze2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDA5MTY5NjU3NTkzMjA0MzQxNTM5MDAwMDAwMTAyMTU2NDM5MjA1MDA3ODg1Nl8pO30KPC9zdHlsZT4KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI3MS4zNDE4IiB5MT0iNDE5LjA4NjkiIHgyPSIxNzUuMjg4MSIgeTI9IjQ0OC41NjQxIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMCAtMzQ2KSI+Cgk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojODc5N0ZGIi8+Cgk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojQUFBOEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNzYuNCw4NS40YzUuOS0xMy4yLTIzLjMtNTAuMS01MS4yLTY1LjNDMTA3LjUsOC4xLDg5LjMsOS43LDg1LjUsMTVjLTguMSwxMS40LDI3LDIxLjMsNTAuNCwzMi41CgljLTUuMSwyLjItOS44LDYuMi0xMi41LDExLjFDMTE0LjcsNDksOTUuNSw0MC44LDczLDQ3LjVjLTE1LjIsNC40LTI3LjgsMTUuMS0zMi43LDMwLjljLTEuMS0wLjUtMi41LTAuOC0zLjgtMC44CgljLTUuMiwwLTkuNSw0LjMtOS41LDkuNWMwLDUuMiw0LjMsOS41LDkuNSw5LjVjMSwwLDQtMC42LDQtMC42bDQ4LjgsMC4zYy0xOS41LDMxLjEtMzUsMzUuNS0zNSw0MC45czE0LjcsNCwyMC4zLDEuOQoJYzI2LjYtOS41LDU1LjItMzkuNSw2MC4xLTQ4LjFDMTU1LjMsOTMuOCwxNzIuNSw5My45LDE3Ni40LDg1LjR6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMDAwMDAwMzg0MDY0NTAzNDY5MjQ4NjkzNTAwMDAwMDA5NDQzOTczMDQwMTQ3OTk1NDdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE1My45OTAyIiB5MT0iNDIxLjM0NzQiIHgyPSI3OC45ODgzIiB5Mj0iMzQ2LjE2MTgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAwIC0zNDYpIj4KCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzQjIyQTAiLz4KCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MTU2RDg7c3RvcC1vcGFjaXR5OjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDAzODQwNjQ1MDM0NjkyNDg2OTM1MDAwMDAwMDk0NDM5NzMwNDAxNDc5OTU0N18pOyIgZD0iCglNMTM2LjEsNDcuNUwxMzYuMSw0Ny41YzEuMS0wLjUsMS0yLjEsMC42LTMuM2MtMC42LTIuOS0xMi41LTE0LjYtMjMuNi0xOS44Yy0xNS4yLTcuMS0yNi4zLTYuOC0yNy45LTMuNWMzLDYuMywxNy40LDEyLjIsMzIuNCwxOC42CglDMTIzLjcsNDEuOSwxMzAuMiw0NC42LDEzNi4xLDQ3LjVMMTM2LjEsNDcuNXoiLz4KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8wMDAwMDE0NzIyMDY3MjYxNTU0Nzk0MjI0MDAwMDAxMTg5NDM0ODEwNDAwNzM1NDA0NF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTE4Ljc4NjUiIHkxPSI0NTkuOTQ1OSIgeDI9IjQ2LjczODgiIHkyPSI0MTguNTIzNiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDAgLTM0NikiPgoJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNCMUU4RiIvPgoJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzZBNkZGQjtzdG9wLW9wYWNpdHk6MCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cGF0aCBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMTQ3MjIwNjcyNjE1NTQ3OTQyMjQwMDAwMDExODk0MzQ4MTA0MDA3MzU0MDQ0Xyk7IiBkPSIKCU0xMTYuNywxMTEuMmMtMy0xLjEtNi41LTIuMi0xMC41LTMuMmM0LjEtNy41LDUuMS0xOC43LDEuMS0yNS43Yy01LjYtOS44LTEyLjUtMTUuMS0yOC45LTE1LjFjLTguOSwwLTMzLDMtMzMuNSwyMy4yCgljMCwyLjEsMCw0LDAuMiw1LjlsNDQuMSwwYy01LjksOS40LTExLjQsMTYuMy0xNi4zLDIxLjZjNS45LDEuNCwxMC42LDIuNywxNS4xLDRjNC4xLDEuMSw4LjEsMi4xLDEyLjEsMy4yCglDMTA2LjEsMTIwLjYsMTExLjgsMTE1LjgsMTE2LjcsMTExLjJ6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMDAwMDAxMjg0NzQ1MTgwNjUxMjc5MDc2OTAwMDAwMDg3OTM1NDY5MjM0OTg1OTA4NjFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjY2LjM2MDQiIHkxPSI0MjcuNjAyIiB4Mj0iMTE1LjA1OTMiIHkyPSI0ODkuNDc5MiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDAgLTM0NikiPgoJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6Izg4OThGRiIvPgoJPHN0b3AgIG9mZnNldD0iMC45ODM5IiBzdHlsZT0ic3RvcC1jb2xvcjojNUY0N0YxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIHN0eWxlPSJmaWxsOnVybCgjU1ZHSURfMDAwMDAxMjg0NzQ1MTgwNjUxMjc5MDc2OTAwMDAwMDg3OTM1NDY5MjM0OTg1OTA4NjFfKTsiIGQ9Ik0zOS43LDkzLjljMS43LDE1LjIsMTAuNSwyMS4zLDI4LjIsMjMKCWMxNy44LDEuNywyNy45LDAuNiw0MS40LDEuN2MxMS4zLDEsMjEuNCw2LjgsMjUuMSw0LjhjMy4zLTEuNywxLjQtOC4yLTMtMTIuNGMtNS45LTUuNC0xNC05LTI4LjEtMTAuNWMyLjktNy44LDIuMS0xOC43LTIuNC0yNC42CgljLTYuMy04LjYtMTguMS0xMi40LTMzLTEwLjhDNTIuMyw2Ny4xLDM3LjQsNzQuOSwzOS43LDkzLjl6Ii8+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ 
      return(
        _optionalChain$8([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isRabby])
      )
    };}
  } Rabby.__initStatic(); Rabby.__initStatic2();

  function _optionalChain$7(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class TokenPocket extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'TP Wallet (TokenPocket)',
      logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8bWFzayBpZD0ibWFzazBfNDA4XzIyNSIgc3R5bGU9Im1hc2stdHlwZTphbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCI+CjxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IiNDNEM0QzQiLz4KPC9tYXNrPgo8ZyBtYXNrPSJ1cmwoI21hc2swXzQwOF8yMjUpIj4KPHBhdGggZD0iTTEwNDEuNTIgMEgtMjdWMTAyNEgxMDQxLjUyVjBaIiBmaWxsPSIjMjk4MEZFIi8+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF80MDhfMjI1KSI+CjxwYXRoIGQ9Ik00MDYuNzk2IDQzOC42NDNINDA2LjkyN0M0MDYuNzk2IDQzNy44NTcgNDA2Ljc5NiA0MzYuOTQgNDA2Ljc5NiA0MzYuMTU0VjQzOC42NDNaIiBmaWxsPSIjMjlBRUZGIi8+CjxwYXRoIGQ9Ik02NjcuNjAyIDQ2My41MzNINTIzLjI0OVY3MjQuMDc2QzUyMy4yNDkgNzM2LjM4OSA1MzMuMjA0IDc0Ni4zNDUgNTQ1LjUxNyA3NDYuMzQ1SDY0NS4zMzNDNjU3LjY0NyA3NDYuMzQ1IDY2Ny42MDIgNzM2LjM4OSA2NjcuNjAyIDcyNC4wNzZWNDYzLjUzM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00NTMuNTYzIDI3N0g0NDguNzE2SDE5MC4yNjlDMTc3Ljk1NSAyNzcgMTY4IDI4Ni45NTUgMTY4IDI5OS4yNjlWMzg5LjY1M0MxNjggNDAxLjk2NyAxNzcuOTU1IDQxMS45MjIgMTkwLjI2OSA0MTEuOTIySDI1MC45MThIMjc1LjAyMVY0MzguNjQ0VjcyNC43MzFDMjc1LjAyMSA3MzcuMDQ1IDI4NC45NzYgNzQ3IDI5Ny4yODkgNzQ3SDM5Mi4xMjhDNDA0LjQ0MSA3NDcgNDE0LjM5NiA3MzcuMDQ1IDQxNC4zOTYgNzI0LjczMVY0MzguNjQ0VjQzNi4xNTZWNDExLjkyMkg0MzguNDk5SDQ0OC4zMjNINDUzLjE3QzQ5MC4zNzIgNDExLjkyMiA1MjAuNjMxIDM4MS42NjMgNTIwLjYzMSAzNDQuNDYxQzUyMS4wMjQgMzA3LjI1OSA0OTAuNzY1IDI3NyA0NTMuNTYzIDI3N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02NjcuNzM1IDQ2My41MzNWNjQ1LjM1QzY3Mi43MTMgNjQ2LjUyOSA2NzcuODIxIDY0Ny40NDYgNjgzLjA2MSA2NDguMjMyQzY5MC4zOTcgNjQ5LjI4IDY5Ny45OTQgNjQ5LjkzNSA3MDUuNTkyIDY1MC4wNjZDNzA1Ljk4NSA2NTAuMDY2IDcwNi4zNzggNjUwLjA2NiA3MDYuOTAyIDY1MC4wNjZWNTA1LjQ1QzY4NS4wMjYgNTA0LjAwOSA2NjcuNzM1IDQ4NS44MDEgNjY3LjczNSA0NjMuNTMzWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzQwOF8yMjUpIi8+CjxwYXRoIGQ9Ik03MDkuNzgxIDI3N0M2MDYuODIyIDI3NyA1MjMuMjQ5IDM2MC41NzMgNTIzLjI0OSA0NjMuNTMzQzUyMy4yNDkgNTUyLjA4NCA1ODQuOTQ2IDYyNi4yMjUgNjY3LjczMyA2NDUuMzVWNDYzLjUzM0M2NjcuNzMzIDQ0MC4zNDcgNjg2LjU5NiA0MjEuNDg0IDcwOS43ODEgNDIxLjQ4NEM3MzIuOTY3IDQyMS40ODQgNzUxLjgzIDQ0MC4zNDcgNzUxLjgzIDQ2My41MzNDNzUxLjgzIDQ4My4wNTEgNzM4LjYgNDk5LjQyNSA3MjAuNTIzIDUwNC4xNEM3MTcuMTE3IDUwNS4wNTcgNzEzLjQ0OSA1MDUuNTgxIDcwOS43ODEgNTA1LjU4MVY2NTAuMDY2QzcxMy40NDkgNjUwLjA2NiA3MTYuOTg2IDY0OS45MzUgNzIwLjUyMyA2NDkuODA0QzgxOC41MDUgNjQ0LjE3MSA4OTYuMzE0IDU2Mi45NTYgODk2LjMxNCA0NjMuNTMzQzg5Ni40NDUgMzYwLjU3MyA4MTIuODcyIDI3NyA3MDkuNzgxIDI3N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03MDkuNzggNjUwLjA2NlY1MDUuNTgxQzcwOC43MzMgNTA1LjU4MSA3MDcuODE2IDUwNS41ODEgNzA2Ljc2OCA1MDUuNDVWNjUwLjA2NkM3MDcuODE2IDY1MC4wNjYgNzA4Ljg2NCA2NTAuMDY2IDcwOS43OCA2NTAuMDY2WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNDA4XzIyNSIgeDE9IjcwOS44NDQiIHkxPSI1NTYuODI3IiB4Mj0iNjY3Ljc1MyIgeTI9IjU1Ni44MjciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0id2hpdGUiLz4KPHN0b3Agb2Zmc2V0PSIwLjk2NjciIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjAuMzIzMyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjAuMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzQwOF8yMjUiPgo8cmVjdCB3aWR0aD0iNzI4LjQ0OCIgaGVpZ2h0PSI0NzAiIGZpbGw9IndoaXRlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNjggMjc3KSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        _optionalChain$7([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isTokenPocket])
      )
    };}
  } TokenPocket.__initStatic(); TokenPocket.__initStatic2();

  function _optionalChain$6(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Trust extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Trust Wallet',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA5Ni41IDk2LjUiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDk2LjUgOTYuNSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgZmlsbD0iI0ZGRkZGRiIgd2lkdGg9Ijk2LjUiIGhlaWdodD0iOTYuNSIvPgo8cGF0aCBzdHJva2U9IiMzMzc1QkIiIHN0cm9rZS13aWR0aD0iNi4wNjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQgPSIxMCIgZmlsbD0ibm9uZSIgZD0ibTQ4LjUgMjAuMWM5LjYgOCAyMC42IDcuNSAyMy43IDcuNS0wLjcgNDUuNS01LjkgMzYuNS0yMy43IDQ5LjMtMTcuOC0xMi44LTIzLTMuNy0yMy43LTQ5LjMgMy4yIDAgMTQuMSAwLjUgMjMuNy03LjV6Ii8+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (
        (_optionalChain$6([window, 'optionalAccess', _5 => _5.ethereum, 'optionalAccess', _6 => _6.isTrust]) || _optionalChain$6([window, 'optionalAccess', _7 => _7.ethereum, 'optionalAccess', _8 => _8.isTrustWallet])) &&
        Object.keys(window.ethereum).filter((key)=>key.match(/^is(?!Connected)(?!Debug)(?!TrustWallet)(?!MetaMask)(?!PocketUniverse)(?!RevokeCash)/)).length == 1
      )
    };}
  } Trust.__initStatic(); Trust.__initStatic2();

  const transactionApiBlockchainNames = {
    'ethereum': 'mainnet',
    'bsc': 'bsc',
    'polygon': 'polygon',
  };

  const explorerBlockchainNames = {
    'ethereum': 'eth',
    'bsc': 'bnb',
    'polygon': 'matic',
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

  const sendTransaction$2 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
    await transaction.prepare({ wallet });
    const smartContractWallet = await getSmartContractWallet(transaction.blockchain, transaction.from);
    let transactionCount = await wallet.transactionCount({ blockchain: transaction.blockchain, address: transaction.from });
    transaction.nonce = transactionCount;
    await submit$2({ transaction, wallet }).then((tx)=>{
      console.log('tx', tx);
      if (tx) {
        let blockchain = Blockchains__default['default'].findByName(transaction.blockchain);
        transaction.id = tx;
        transaction.url = smartContractWallet && smartContractWallet.explorerUrlFor ? smartContractWallet.explorerUrlFor({ transaction }) : blockchain.explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        retrieveTransaction$1({ blockchain: transaction.blockchain, tx, smartContractWallet }).then((sentTransaction)=>{
          transaction.id = sentTransaction.hash || transaction.id;
          transaction.url = blockchain.explorerUrlFor({ transaction });
          transaction.nonce = sentTransaction.nonce || transactionCount;
          retrieveConfirmedTransaction$2(sentTransaction).then(()=>{
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
        });
      } else {
        throw('Submitting transaction failed!')
      }
    });
    return transaction
  };

  const retrieveConfirmedTransaction$2 = (sentTransaction)=>{
    return new Promise((resolve, reject)=>{

      sentTransaction.wait(1).then(resolve).catch((error)=>{
        if(_optionalChain$5([error, 'optionalAccess', _ => _.toString, 'call', _2 => _2()]) === "TypeError: Cannot read properties of undefined (reading 'message')") {
          setTimeout(()=>{
            retrieveConfirmedTransaction$2(sentTransaction)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      });
    })
  };

  const retrieveTransaction$1 = async ({ blockchain, tx, smartContractWallet })=>{
    const provider = await web3ClientEvm.getProvider(blockchain);
    let retrieve = async()=>{
      try {
        if(smartContractWallet && smartContractWallet.retrieveTransaction) {
          return await smartContractWallet.retrieveTransaction({ blockchain, tx })
        } else {
          return await provider.getTransaction(tx)
        }
      } catch (e) {}
    };
    
    let sentTransaction;
    sentTransaction = await retrieve();
    while (!sentTransaction) {
      await (new Promise((resolve)=>setTimeout(resolve, 3000)));
      sentTransaction = await retrieve();
    }
    return sentTransaction
  };

  const submit$2 = ({ transaction, wallet }) => {
    if(transaction.method) {
      return submitContractInteraction$2({ transaction, wallet })
    } else {
      return submitSimpleTransfer$2({ transaction, wallet })
    }
  };

  const submitContractInteraction$2 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    let gasPrice = await provider.getGasPrice();
    if(_optionalChain$5([wallet, 'access', _3 => _3.session, 'optionalAccess', _4 => _4.peerMeta, 'optionalAccess', _5 => _5.name]) === 'Uniswap Wallet') {
      gasPrice = undefined;
    } else {
      gasPrice = gasPrice.toHexString();
    }
    let gas = await web3ClientEvm.estimate(transaction);
    const data = await transaction.getData();
    const value = transaction.value ? ethers.ethers.utils.hexlify(ethers.ethers.BigNumber.from(transaction.value)) : undefined;
    const nonce = ethers.ethers.utils.hexlify(transaction.nonce);
    gas = gas.add(gas.div(10));
    return wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value,
      data,
      gas: gas.toHexString(),
      gasPrice,
      nonce,
    })
  };

  const submitSimpleTransfer$2 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    let gasPrice = await provider.getGasPrice();
    if(_optionalChain$5([wallet, 'access', _6 => _6.session, 'optionalAccess', _7 => _7.peerMeta, 'optionalAccess', _8 => _8.name]) === 'Uniswap Wallet') {
      gasPrice = undefined;
    } else {
      gasPrice = gasPrice.toHexString();
    }
    const gas = await web3ClientEvm.estimate(transaction);
    const value = ethers.ethers.utils.hexlify(ethers.ethers.BigNumber.from(transaction.value));
    const nonce = ethers.ethers.utils.hexlify(transaction.nonce);
    return wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value,
      data: '0x',
      gas: gas.toHexString(),
      gasPrice,
      nonce,
    })
  };

  function _optionalChain$4(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const KEY$1 = '_DePayWeb3WalletsConnectedWalletConnectV1Instance';

  let currentPlainInstance;

  const getPlainInstance = ()=>{
    if(currentPlainInstance) { return currentPlainInstance }
    currentPlainInstance = getWalletConnectInstance(()=>{});
    return currentPlainInstance
  };

  const isConnected = ()=>{
    return new Promise(async(resolve, reject)=>{
      
      setTimeout(()=>{ 
        delete localStorage['walletconnect'];
        resolve(false);
      }, 5000);

      if(!localStorage['walletconnect'] || JSON.parse(localStorage['walletconnect']).handshakeTopic.length == 0) {
        delete localStorage['walletconnect'];
        return resolve(false)
      }

      let connector = getPlainInstance();
      let accounts;

      try {
        let blockNumber = await connector.sendCustomRequest({ method: 'eth_blockNumber' });
        if(blockNumber) {
          accounts = await connector.sendCustomRequest({ method: 'eth_accounts' }); 
        } else {
          delete localStorage['walletconnect'];
        }
      } catch (error) {
        delete localStorage['walletconnect'];
        resolve(false);
      }

      return resolve(accounts && accounts.length)
    })
  };

  const getConnectedInstance$2 = async()=>{
    if(window[KEY$1]) { return window[KEY$1] }
    if(await isConnected()) { return new WalletConnectV1() }
  };

  const setConnectedInstance$1 = (value)=>{
    window[KEY$1] = value;
  };

  const getWalletConnectInstance = (connect)=>{
    return new walletconnectV1.WalletConnectClient({
      bridge: "https://walletconnect.depay.com",
      qrcodeModal: { 
        open: async(uri)=>connect({ uri }),
        close: ()=>{},
      }
    })
  };

  class WalletConnectV1 {

    static __initStatic() {this.info = {
      name: 'WalletConnect',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{
      return (await getConnectedInstance$2()) != undefined
    };}

    constructor() {
      this.name = (localStorage[KEY$1+'_name'] && localStorage[KEY$1+'_name'] != undefined) ? localStorage[KEY$1+'_name'] : this.constructor.info.name;
      this.logo = (localStorage[KEY$1+'_logo'] && localStorage[KEY$1+'_logo'] != undefined) ? localStorage[KEY$1+'_logo'] : this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      this.sendTransaction = (transaction)=>{ 
        return sendTransaction$2({
          wallet: this,
          transaction
        })
      };
    }

    disconnect() {
      setConnectedInstance$1(undefined);
      localStorage[KEY$1+'_name'] = undefined;
      localStorage[KEY$1+'_logo'] = undefined;
      currentPlainInstance = undefined;
      this.session = undefined;
    }

    newWalletConnectInstance(connect) {
      let instance = getWalletConnectInstance(connect);

      instance.on("disconnect", (error, payload) => {
        this.disconnect();
        if (error) { throw error }
      });

      instance.on("modal_closed", ()=>{
        setConnectedInstance$1(undefined);
        this.connector = undefined;
        this.session = undefined;
      });

      return instance
    }

    async account() {
      if(!this.connector){ this.connector = getPlainInstance(); }
      let accounts;
      try{ accounts = await this.connector.sendCustomRequest({ method: 'eth_accounts' }); } catch (e) {}
      if(accounts && accounts.length) { return ethers.ethers.utils.getAddress(accounts[0]) }
    }

    async connect(options) {
      let connect = (options && options.connect) ? options.connect : ({uri})=>{};
      try {

        this.connector = WalletConnectV1.instance;

        if(this.connector == undefined){
          this.connector = this.newWalletConnectInstance(connect);
        }

        if(options && options.reconnect) {
          if(this.connector) {
            try{ await this.connector.killSession(); } catch (e2) {}
            this.disconnect();
          }
        }

        if((await isConnected())) {
          return await this.account()
        } else {

          let session = await this.connector.connect();
          this.session = session;

          if(_optionalChain$4([options, 'optionalAccess', _ => _.name])) { localStorage[KEY$1+'_name'] = this.name = options.name; }
          if(_optionalChain$4([options, 'optionalAccess', _2 => _2.logo])) { localStorage[KEY$1+'_logo'] = this.logo = options.logo; }

          if(session.accounts instanceof Array && session.accounts.length) {
            setConnectedInstance$1(this);
            return ethers.ethers.utils.getAddress(session.accounts[0])
          } else {
            return
          }
        }
        
      } catch (error) {
        console.log('WALLETCONNECT ERROR', error);
        return undefined
      }
    }

    async connectedTo(input) {
      let chainId = await this.connector.sendCustomRequest({ method: 'eth_chainId' });
      const blockchain = Blockchains__default['default'].findById(chainId);
      if(!blockchain) { return false }
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        let resolved, rejected;
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        setTimeout(async()=>{
          if(!(await this.connectedTo(blockchainName)) && !resolved && !rejected){
            reject({ code: 'NOT_SUPPORTED' });
          } else {
            resolve();
          }
        }, 3000);
        this.connector.sendCustomRequest({ 
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: blockchain.id }],
        }).then(()=>{
          resolved = true;
          resolve();
        }).catch((error)=> {
          if(error && typeof error.message == 'string' && error.message.match('addEthereumChain')){ // chain not yet added
            this.addNetwork(blockchainName)
              .then(()=>this.switchTo(blockchainName).then(()=>{
                resolved = true;
                resolve();
              }))
              .catch(()=>{
                rejected = true;
                reject({ code: 'NOT_SUPPORTED' });
              });
          } else {
            rejected = true;
            reject({ code: 'NOT_SUPPORTED' });
          }
        });
      })
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = Blockchains__default['default'].findByName(blockchainName);
        this.connector.sendCustomRequest({ 
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
          internalCallback = (error, payload) => {
            if(payload && payload.params && payload.params[0].accounts && payload.params[0].accounts instanceof Array) {
              const accounts = payload.params[0].accounts.map((account)=>ethers.ethers.utils.getAddress(account));
              callback(accounts[0]);
            }
          };
          this.connector.on("session_update", internalCallback);
          break
      }
      return internalCallback
    }

    off(event, callback) {
      switch (event) {
        case 'account':
          this.connector.off("session_update");
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
        if((await this.connectedTo(Blockchains__default['default'].findByNetworkId(message.domain.chainId).name)) === false) {
          throw({ code: 'WRONG_NETWORK' })
        }
        let signature = await this.connector.sendCustomRequest({
          jsonrpc: '2.0',
          method: 'eth_signTypedData_v4',
          params: [account, JSON.stringify(message)],
        });
        return signature
      } else if (typeof message === 'string') {
        let blockchain = await this.connectedTo();
        let address = await this.account();
        const smartContractWallet = await getSmartContractWallet(blockchain, address);
        if(smartContractWallet){ throw({ message: 'Smart contract wallets are not supported for signing!', code: "SMART_CONTRACT_WALLET_NOT_SUPPORTED" }) }
        var params = [ethers.ethers.utils.toUtf8Bytes(message), address];
        let signature = await this.connector.signPersonalMessage(params);
        return signature
      }
    }
  } WalletConnectV1.__initStatic(); WalletConnectV1.__initStatic2();

  WalletConnectV1.getConnectedInstance = getConnectedInstance$2;
  WalletConnectV1.setConnectedInstance = setConnectedInstance$1;

  function _optionalChain$3(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const sendTransaction$1 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
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
          console.log('Error retrieving transaction');
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

      sentTransaction.wait(1).then(resolve).catch((error)=>{
        if(_optionalChain$3([error, 'optionalAccess', _ => _.toString, 'call', _2 => _2()]) === "TypeError: Cannot read properties of undefined (reading 'message')") {
          setTimeout(()=>{
            retrieveConfirmedTransaction$1(sentTransaction)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      });
    })
  };

  const retrieveTransaction = async (tx, blockchain)=>{
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
    return sentTransaction
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
    const gas = await web3ClientEvm.estimate(transaction);
    const gasPrice = await provider.getGasPrice();
    return wallet.signClient.request({
      topic: wallet.session.topic,
      chainId: `${blockchain.namespace}:${blockchain.networkId}`,
      request: {
        method: 'eth_sendTransaction',
        params: [{
          from: transaction.from,
          to: transaction.to,
          value: _optionalChain$3([transaction, 'access', _3 => _3.value, 'optionalAccess', _4 => _4.toString, 'call', _5 => _5()]),
          data: await transaction.getData(),
          gas: gas.toHexString(),
          gasPrice: gasPrice.toHexString(),
          nonce: transaction.nonce,
        }]
      }
    }).catch((e)=>{console.log('ERROR', e);})
  };

  const submitSimpleTransfer$1 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    let blockchain = Blockchains__default['default'][transaction.blockchain];
    const gas = await web3ClientEvm.estimate(transaction);
    const gasPrice = await provider.getGasPrice();
    return wallet.signClient.request({
      topic: wallet.session.topic,
      chainId: `${blockchain.namespace}:${blockchain.networkId}`,
      request: {
        method: 'eth_sendTransaction',
        params: [{
          from: transaction.from,
          to: transaction.to,
          value: _optionalChain$3([transaction, 'access', _6 => _6.value, 'optionalAccess', _7 => _7.toString, 'call', _8 => _8()]),
          gas: gas.toHexString(),
          gasPrice: gasPrice.toHexString(),
          nonce: transaction.nonce
        }]
      }
    }).catch((e)=>{console.log('ERROR', e);})
  };

  function _optionalChain$2(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const KEY = 'depay:wallets:wc2';

  // configurations for wallets that require special handling
  const CONFIGURATIONS = {

    "MetaMask": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
        "wallet_switchEthereumChain"
      ]
    },

    "BitGet (BitKeep)": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
      ],
      requiredNamespaces: {
        eip155: {
          chains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'base'].map((blockchainName)=>`eip155:${Blockchains__default['default'][blockchainName].networkId}`)
        }
      },
      optionalNamespaces: {},
    },

    "BitGet": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
      ],
      requiredNamespaces: {
        eip155: {
          chains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'base'].map((blockchainName)=>`eip155:${Blockchains__default['default'][blockchainName].networkId}`)
        }
      },
      optionalNamespaces: {},
    },

    "Uniswap Wallet": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
      ],
      requiredNamespaces: {
        eip155: {
          chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'].map((blockchainName)=>`eip155:${Blockchains__default['default'][blockchainName].networkId}`)
        }
      },
      optionalNamespaces: {},
    },

    "Ledger Live": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
      ],
      requiredNamespaces: {},
      optionalNamespaces: {
        eip155: {
          chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'].map((blockchainName)=>`eip155:${Blockchains__default['default'][blockchainName].networkId}`)
        }
      },
    },

    "Enjin Wallet": {
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
      ]
    },
  };

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
    const existingSessions = signClient.find(getWalletConnectV2Config(walletName));
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
    const methods = _optionalChain$2([CONFIGURATIONS, 'access', _ => _[walletName], 'optionalAccess', _2 => _2.methods]) || DEFAULT_CONFIGURATION.methods;
    const events = _optionalChain$2([CONFIGURATIONS, 'access', _3 => _3[walletName], 'optionalAccess', _4 => _4.events]) || DEFAULT_CONFIGURATION.events;

    let requiredNamespaces = {};
    if(_optionalChain$2([CONFIGURATIONS, 'access', _5 => _5[walletName], 'optionalAccess', _6 => _6.requiredNamespaces])) {
      requiredNamespaces = CONFIGURATIONS[walletName].requiredNamespaces;
    } else {
      requiredNamespaces['eip155'] = {
        chains: [`eip155:1`],
      };
    }
    if(requiredNamespaces['eip155']) {
      requiredNamespaces['eip155'].methods = methods;
      requiredNamespaces['eip155'].events = events;
    }

    let optionalNamespaces = {};
    if(_optionalChain$2([CONFIGURATIONS, 'access', _7 => _7[walletName], 'optionalAccess', _8 => _8.optionalNamespaces])) {
      optionalNamespaces = CONFIGURATIONS[walletName].optionalNamespaces;
    } else {
      optionalNamespaces['eip155'] = {
        chains: supported$1.evm.map((blockchain)=>`${Blockchains__default['default'][blockchain].namespace}:${Blockchains__default['default'][blockchain].networkId}`),
      };
    }
    if(_optionalChain$2([optionalNamespaces, 'optionalAccess', _9 => _9.eip155]) && _optionalChain$2([optionalNamespaces, 'optionalAccess', _10 => _10.eip155, 'optionalAccess', _11 => _11.chains, 'optionalAccess', _12 => _12.length])) {
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
          description: _optionalChain$2([document, 'access', _13 => _13.querySelector, 'call', _14 => _14('meta[name="description"]'), 'optionalAccess', _15 => _15.getAttribute, 'call', _16 => _16('content')]) || document.title || 'dApp',
          url: location.href,
          icons: [_optionalChain$2([document, 'access', _17 => _17.querySelector, 'call', _18 => _18("link[rel~='icon'], link[rel~='shortcut icon']"), 'optionalAccess', _19 => _19.href]) || `${location.origin}/favicon.ico`]
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
      return !! await getLastSession(_optionalChain$2([options, 'optionalAccess', _21 => _21.walletName]))
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
      if(_optionalChain$2([this, 'access', _22 => _22.session, 'optionalAccess', _23 => _23.namespaces, 'optionalAccess', _24 => _24.eip155, 'optionalAccess', _25 => _25.accounts, 'optionalAccess', _26 => _26.length])) {
        return this.session.namespaces.eip155.accounts[0].split(':')[2]
      }
    }

    async setSessionBlockchains() {
      if(!this.session) { return }
      if(_optionalChain$2([CONFIGURATIONS, 'access', _27 => _27[this.walletName], 'optionalAccess', _28 => _28.methods, 'optionalAccess', _29 => _29.includes, 'call', _30 => _30('wallet_switchEthereumChain')])) {
        this.blockchains = [this.session.namespaces.eip155.chains[this.session.namespaces.eip155.chains.length-1]].map((chainIdentifier)=>_optionalChain$2([Blockchains__default['default'], 'access', _31 => _31.findByNetworkId, 'call', _32 => _32(chainIdentifier.split(':')[1]), 'optionalAccess', _33 => _33.name])).filter(Boolean);
      } else if(this.session.namespaces.eip155.chains) {
        this.blockchains = this.session.namespaces.eip155.chains.map((chainIdentifier)=>_optionalChain$2([Blockchains__default['default'], 'access', _34 => _34.findByNetworkId, 'call', _35 => _35(chainIdentifier.split(':')[1]), 'optionalAccess', _36 => _36.name])).filter(Boolean);
      } else if(this.session.namespaces.eip155.accounts) {
        this.blockchains = this.session.namespaces.eip155.accounts.map((accountIdentifier)=>_optionalChain$2([Blockchains__default['default'], 'access', _37 => _37.findByNetworkId, 'call', _38 => _38(accountIdentifier.split(':')[1]), 'optionalAccess', _39 => _39.name])).filter(Boolean);
      }
    }

    async connect(options) {
      
      let connect = (options && options.connect) ? options.connect : ({uri})=>{};
      
      try {

        this.walletName = _optionalChain$2([options, 'optionalAccess', _40 => _40.name]);

        // delete localStorage[`wc@2:client:0.3//session`] // DELETE WC SESSIONS
        this.signClient = await getSignClient();

        this.signClient.on("session_delete", (session)=> {
          if(_optionalChain$2([session, 'optionalAccess', _41 => _41.topic]) === _optionalChain$2([this, 'access', _42 => _42.session, 'optionalAccess', _43 => _43.topic])) {
            localStorage[KEY+':name'] = undefined;
            localStorage[KEY+':logo'] = undefined;
            this.signClient = undefined;
            this.session = undefined;
          }
        });

        this.signClient.on("session_update", async(session)=> {
          if(_optionalChain$2([session, 'optionalAccess', _44 => _44.topic]) === _optionalChain$2([this, 'access', _45 => _45.session, 'optionalAccess', _46 => _46.topic])) {
            this.session = this.signClient.session.get(session.topic);
            await this.setSessionBlockchains();
          }
        });

        this.signClient.on("session_event", (event)=> {
          if(_optionalChain$2([event, 'optionalAccess', _47 => _47.topic]) === _optionalChain$2([this, 'access', _48 => _48.session, 'optionalAccess', _49 => _49.topic])) {}
        });

        const connectWallet = async()=>{
          const { uri, approval } = await this.signClient.connect(getWalletConnectV2Config(this.walletName));
          await connect({ uri });
          this.session = await approval();
          localStorage[KEY+":lastSessionWalletName"] = this.walletName;
          await new Promise(resolve=>setTimeout(resolve, 500)); // to prevent race condition within WalletConnect
        };

        const lastSession = _optionalChain$2([this, 'optionalAccess', _50 => _50.walletName, 'optionalAccess', _51 => _51.length]) ? await getLastSession(this.walletName) : undefined;
        if(lastSession) {
          this.session = lastSession;
        } else {
          await connectWallet();
        }

        let meta = _optionalChain$2([this, 'access', _52 => _52.session, 'optionalAccess', _53 => _53.peer, 'optionalAccess', _54 => _54.metadata]);
        if(meta && meta.name) {
          this.name = meta.name;
          localStorage[KEY+':name'] = meta.name;
          if(_optionalChain$2([meta, 'optionalAccess', _55 => _55.icons]) && meta.icons.length) {
            this.logo = meta.icons[0];
            localStorage[KEY+':logo'] = this.logo;
          }
        }
        if(_optionalChain$2([options, 'optionalAccess', _56 => _56.name])) { localStorage[KEY+':name'] = this.name = options.name; }
        if(_optionalChain$2([options, 'optionalAccess', _57 => _57.logo])) { localStorage[KEY+':logo'] = this.logo = options.logo; }

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
        
        const blockchain = Blockchains__default['default'][blockchainName];

        Promise.race([
          this.signClient.request({
            topic: this.session.topic,
            chainId: this.getValidChainId(),
            request:{
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: blockchain.id }],
            }
          }),
          new Promise((resolve, reject)=>setTimeout(()=>{
            if(this.blockchains.indexOf(blockchainName) === -1) {
              reject({ code: 'NOT_SUPPORTED' });
            }
          } , 8000))
        ]).catch(reject);
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
            if(_optionalChain$2([event, 'optionalAccess', _58 => _58.topic]) === _optionalChain$2([this, 'access', _59 => _59.session, 'optionalAccess', _60 => _60.topic]) && event.params.event.name === 'accountsChanged') {
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

  function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
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

      sentTransaction.wait(1).then(resolve).catch((error)=>{
        if(_optionalChain$1([error, 'optionalAccess', _ => _.toString, 'call', _2 => _2()]) === "TypeError: Cannot read properties of undefined (reading 'message')") {
          setTimeout(()=>{
            retrieveConfirmedTransaction(sentTransaction)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      });
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

  function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

  const getConnectedInstance = ()=>{
    return window._connectedWalletLinkInstance
  };

  const setConnectedInstance = (value)=>{
    window._connectedWalletLinkInstance = value;
  };

  class WalletLink {

    static __initStatic() {this.info = {
      name: 'Coinbase',
      logo: Coinbase.info.logo,
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = async()=>{ return getConnectedInstance() != undefined };}

    constructor() {
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
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
      
      _optionalChain([document, 'access', _ => _.querySelector, 'call', _2 => _2('.-cbwsdk-extension-dialog-container'), 'optionalAccess', _3 => _3.setAttribute, 'call', _4 => _4('style', 'display: none;')]);
      setTimeout(()=>{
        if(_optionalChain([this, 'optionalAccess', _5 => _5.connector, 'optionalAccess', _6 => _6._relay, 'optionalAccess', _7 => _7.ui, 'optionalAccess', _8 => _8.linkFlow, 'optionalAccess', _9 => _9.isOpen])){
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

  var wallets = {
    MetaMask,
    Coinbase,
    Binance,
    Trust,
    Rabby,
    Brave,
    Opera,
    Coin98,
    CryptoCom,
    HyperPay,
    TokenPocket,
    WindowEthereum,
    WalletConnectV1,
    WalletConnectV2,
    WalletLink
  };

  const getWallets = async(args)=>{

    let drip = (args && typeof args.drip === 'function') ? args.drip : undefined;

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
    wallets.Coinbase,
    wallets.Binance,
    wallets.Trust,
    wallets.Rabby,
    wallets.Brave,
    wallets.Opera,
    wallets.Coin98,
    wallets.CryptoCom,
    wallets.HyperPay,
    wallets.TokenPocket,
    wallets.WalletConnectV1,
    wallets.WalletConnectV2,
    wallets.WalletLink,
    wallets.WindowEthereum,
  ];

  exports.getWallets = getWallets;
  exports.supported = supported;
  exports.wallets = wallets;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
