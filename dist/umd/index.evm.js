(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@depay/web3-blockchains'), require('ethers'), require('@depay/web3-constants'), require('@depay/web3-client-evm'), require('@depay/walletconnect-v1'), require('@depay/coinbase-wallet-sdk')) :
  typeof define === 'function' && define.amd ? define(['exports', '@depay/web3-blockchains', 'ethers', '@depay/web3-constants', '@depay/web3-client-evm', '@depay/walletconnect-v1', '@depay/coinbase-wallet-sdk'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Wallets = {}, global.Web3Blockchains, global.ethers, global.Web3Constants, global.Web3Client, global.WalletConnect, global.CoinbaseWalletSdk));
}(this, (function (exports, web3Blockchains, ethers, web3Constants, web3ClientEvm, walletconnectV1, coinbaseWalletSdk) { 'use strict';

  function _optionalChain$5(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Transaction {

    constructor({ blockchain, from, to, value, api, method, params, instructions, sent, succeeded, failed }) {

      // required
      this.blockchain = blockchain;
      this.from = (from && from.match('0x')) ? ethers.ethers.utils.getAddress(from) : from;
      this.to = (to && to.match('0x')) ? ethers.ethers.utils.getAddress(to) : to;

      // optional
      this.value = _optionalChain$5([Transaction, 'access', _ => _.bigNumberify, 'call', _2 => _2(value, blockchain), 'optionalAccess', _3 => _3.toString, 'call', _4 => _4()]);
      this.api = api;
      this.method = method;
      this.params = params;
      this.sent = sent;
      this.succeeded = succeeded;
      this.failed = failed;
      this.instructions = instructions;

      // internal
      this._succeeded = false;
      this._failed = false;
    }

    async prepare({ wallet }) {
      this.from = await wallet.account();
    }

    static bigNumberify(value, blockchain) {
      if (typeof value === 'number') {
        return ethers.ethers.utils.parseUnits(value.toString(), web3Constants.CONSTANTS[blockchain].DECIMALS)
      } else if (value && value.toString) {
        return ethers.ethers.BigNumber.from(value.toString())
      } else {
        return value
      }
    }

    getContractArguments() {
      let fragment = this.getContract().interface.fragments.find((fragment) => {
        return fragment.name == this.method
      });

      if(this.params instanceof Array) {
        return this.params
      } else if (this.params instanceof Object) {
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
        populatedTransaction = await this.getContract().populateTransaction[this.method].apply(
          null, contractArguments
        );
      } else {
        populatedTransaction = await this.getContract().populateTransaction[this.method].apply(null);
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

  const sendTransaction$2 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      await wallet.switchTo(transaction.blockchain);
    }
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
    await transaction.prepare({ wallet });
    let provider = new ethers.ethers.providers.Web3Provider(window.ethereum, 'any');
    let signer = provider.getSigner(0);
    await submit$2({ transaction, provider, signer }).then((sentTransaction)=>{
      if (sentTransaction) {
        transaction.id = sentTransaction.hash;
        transaction.nonce = sentTransaction.nonce;
        transaction.url = web3Blockchains.Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        sentTransaction.wait(1).then(() => {
          transaction._succeeded = true;
          if (transaction.succeeded) transaction.succeeded(transaction);
        }).catch((error)=>{
          if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
            if(error.replacement && error.replacement.hash) {
              transaction.id = error.replacement.hash;
              transaction.url = web3Blockchains.Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction });
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

  const submit$2 = ({ transaction, provider, signer }) => {
    if(transaction.method) {
      return submitContractInteraction$2({ transaction, signer, provider })
    } else {
      return submitSimpleTransfer$2({ transaction, signer })
    }
  };

  const submitContractInteraction$2 = ({ transaction, signer, provider })=>{
    let contract = new ethers.ethers.Contract(transaction.to, transaction.api, provider);
    let contractArguments = transaction.getContractArguments({ contract });
    let method = contract.connect(signer)[transaction.method];
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

  const submitSimpleTransfer$2 = ({ transaction, signer })=>{
    return signer.sendTransaction({
      to: transaction.to,
      value: Transaction.bigNumberify(transaction.value, transaction.blockchain)
    })
  };

  let supported$1 = ['ethereum', 'bsc', 'polygon', 'velas'];
  supported$1.evm = ['ethereum', 'bsc', 'polygon', 'velas'];
  supported$1.solana = [];

  function _optionalChain$4(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Wallet (Ethereum)',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA0NDYuNCAzNzYuOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ2LjQgMzc2Ljg7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojODI4NDg3O30KCS5zdDF7ZmlsbDojMzQzNDM0O30KCS5zdDJ7ZmlsbDojOEM4QzhDO30KCS5zdDN7ZmlsbDojM0MzQzNCO30KCS5zdDR7ZmlsbDojMTQxNDE0O30KCS5zdDV7ZmlsbDojMzkzOTM5O30KPC9zdHlsZT4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTM4MS43LDExMC4yaDY0LjdWNDYuNWMwLTI1LjctMjAuOC00Ni41LTQ2LjUtNDYuNUg0Ni41QzIwLjgsMCwwLDIwLjgsMCw0Ni41djY1LjFoMzUuN2wyNi45LTI2LjkKCWMxLjUtMS41LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDc4LjZjNS4zLTI1LjUsMzAuMi00Miw1NS43LTM2LjdjMjUuNSw1LjMsNDIsMzAuMiwzNi43LDU1LjdjLTEuNiw3LjUtNC45LDE0LjYtOS44LDIwLjUKCWMtMC45LDEuMS0xLjksMi4yLTMsMy4zYy0xLjEsMS4xLTIuMiwyLjEtMy4zLDNjLTIwLjEsMTYuNi00OS45LDEzLjgtNjYuNS02LjNjLTQuOS01LjktOC4zLTEzLTkuOC0yMC42SDczLjJsLTI2LjksMjYuOAoJYy0xLjUsMS41LTMuNiwyLjUtNS43LDIuN2wwLDBoLTAuNGgtMC4xaC0wLjVIMHY3NGgyOC44bDE4LjItMTguMmMxLjUtMS42LDMuNi0yLjUsNS43LTIuN2wwLDBoMC40aDI5LjkKCWM1LjItMjUuNSwzMC4yLTQxLjksNTUuNy0zNi43czQxLjksMzAuMiwzNi43LDU1LjdzLTMwLjIsNDEuOS01NS43LDM2LjdjLTE4LjUtMy44LTMyLjktMTguMi0zNi43LTM2LjdINTcuN2wtMTguMiwxOC4zCgljLTEuNSwxLjUtMy42LDIuNS01LjcsMi43bDAsMGgtMC40SDB2MzQuMmg1Ni4zYzAuMiwwLDAuMywwLDAuNSwwaDAuMWgwLjRsMCwwYzIuMiwwLjIsNC4yLDEuMiw1LjgsMi44bDI4LDI4aDU3LjcKCWM1LjMtMjUuNSwzMC4yLTQyLDU1LjctMzYuN3M0MiwzMC4yLDM2LjcsNTUuN2MtMS43LDguMS01LjUsMTUuNy0xMSwyMS45Yy0wLjYsMC43LTEuMiwxLjMtMS45LDJzLTEuMywxLjMtMiwxLjkKCWMtMTkuNSwxNy4zLTQ5LjMsMTUuNi02Ni43LTMuOWMtNS41LTYuMi05LjMtMTMuNy0xMS0yMS45SDg3LjFjLTEuMSwwLTIuMS0wLjItMy4xLTAuNWgtMC4xbC0wLjMtMC4xbC0wLjItMC4xbC0wLjItMC4xbC0wLjMtMC4xCgloLTAuMWMtMC45LTAuNS0xLjgtMS4xLTIuNi0xLjhsLTI4LTI4SDB2NTMuNWMwLjEsMjUuNywyMC45LDQ2LjQsNDYuNSw0Ni40aDM1My4zYzI1LjcsMCw0Ni41LTIwLjgsNDYuNS00Ni41di02My42aC02NC43CgljLTQzLjIsMC03OC4yLTM1LTc4LjItNzguMmwwLDBDMzAzLjUsMTQ1LjIsMzM4LjUsMTEwLjIsMzgxLjcsMTEwLjJ6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMjAuOSwyOTguMWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIyMC45LDMxMi40LDIyMC45LDI5OC4xTDIyMC45LDI5OC4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjE5LjYsOTEuNWMwLTE0LjQtMTEuNi0yNi0yNi0yNnMtMjYsMTEuNi0yNiwyNnMxMS42LDI2LDI2LDI2UzIxOS42LDEwNS44LDIxOS42LDkxLjV6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zODIuMiwxMjguOGgtMC41Yy0zMi45LDAtNTkuNiwyNi43LTU5LjYsNTkuNmwwLDBsMCwwYzAsMzIuOSwyNi43LDU5LjYsNTkuNiw1OS42bDAsMGgwLjUKCWMzMi45LDAsNTkuNi0yNi43LDU5LjYtNTkuNmwwLDBDNDQxLjgsMTU1LjQsNDE1LjEsMTI4LjgsMzgyLjIsMTI4Ljh6IE0zOTYuNiwyMTkuNGgtMzFsOC45LTMyLjVjLTcuNy0zLjctMTEtMTIuOS03LjQtMjAuNgoJYzMuNy03LjcsMTIuOS0xMSwyMC42LTcuNGM3LjcsMy43LDExLDEyLjksNy40LDIwLjZjLTEuNSwzLjItNC4xLDUuOC03LjQsNy40TDM5Ni42LDIxOS40eiIvPgo8ZyBpZD0iTGF5ZXJfeDAwMjBfMSI+Cgk8ZyBpZD0iXzE0MjEzOTQzNDI0MDAiPgoJCTxnPgoJCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjEyOSwxNjYuMiAxMjguNywxNjcuMyAxMjguNywyMDEuNCAxMjksMjAxLjcgMTQ0LjgsMTkyLjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDE2Ni4yIDExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDMiIHBvaW50cz0iMTI5LDIwNC43IDEyOC44LDIwNC45IDEyOC44LDIxNyAxMjksMjE3LjYgMTQ0LjgsMTk1LjQgCQkJIi8+CgkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMTI5LDIxNy42IDEyOSwyMDQuNyAxMTMuMiwxOTUuNCAJCQkiLz4KCQkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMjksMjAxLjcgMTQ0LjgsMTkyLjQgMTI5LDE4NS4yIAkJCSIvPgoJCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjExMy4yLDE5Mi40IDEyOSwyMDEuNyAxMjksMTg1LjIgCQkJIi8+CgkJPC9nPgoJPC9nPgo8L2c+Cjwvc3ZnPgo=",
      blockchains: supported$1.evm
    };}

    static __initStatic2() {this.isAvailable = ()=>{ 
      return (
        _optionalChain$4([window, 'optionalAccess', _8 => _8.ethereum]) &&
        !_optionalChain$4([window, 'optionalAccess', _9 => _9.ethereum, 'optionalAccess', _10 => _10.isMetaMask]) &&
        !(_optionalChain$4([window, 'optionalAccess', _11 => _11.ethereum, 'optionalAccess', _12 => _12.isCoinbaseWallet]) || _optionalChain$4([window, 'optionalAccess', _13 => _13.ethereum, 'optionalAccess', _14 => _14.isWalletLink]))
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

    async account() {
      if(!_optionalChain$4([window, 'optionalAccess', _15 => _15.ethereum])) { return undefined }
      const accounts = (await window.ethereum.request({ method: 'eth_accounts' })).map((address)=>ethers.ethers.utils.getAddress(address));
      return accounts[0]
    }

    async connect() {
      if(!_optionalChain$4([window, 'optionalAccess', _16 => _16.ethereum])) { return undefined }
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })).map((address)=>ethers.ethers.utils.getAddress(address));
      return accounts[0]
    }

    on(event, callback) {
      let internalCallback;
      switch (event) {
        case 'account':
          internalCallback = (accounts) => callback(ethers.ethers.utils.getAddress(accounts[0]));
          window.ethereum.on('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    off(event, internalCallback) {
      switch (event) {
        case 'account':
          window.ethereum.removeListener('accountsChanged', internalCallback);
          break
      }
      return internalCallback
    }

    async connectedTo(input) {
      const blockchain = web3Blockchains.Blockchain.findById(await window.ethereum.request({ method: 'eth_chainId' }));
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    addNetwork(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
        window.ethereum.request({
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
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
        window.ethereum.request({
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

    async sign(message) {
      await this.account();
      let provider = new ethers.ethers.providers.Web3Provider(window.ethereum, 'any');
      let signer = provider.getSigner(0);
      let signature = await signer.signMessage(message);
      return signature
    }
  } WindowEthereum.__initStatic(); WindowEthereum.__initStatic2();

  function _optionalChain$3(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class Coinbase extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'Coinbase',
      logo: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB2aWV3Qm94PScwIDAgNDg4Ljk2IDQ4OC45Nic+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6IzQzNjFhZDt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9J2xpbmVhci1ncmFkaWVudCcgeDE9JzI1MCcgeTE9JzcuMzUnIHgyPScyNTAnIHkyPSc0OTYuMzInIGdyYWRpZW50VHJhbnNmb3JtPSdtYXRyaXgoMSwgMCwgMCwgLTEsIDAsIDUwMiknIGdyYWRpZW50VW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyMzZDViYTknLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyM0ODY4YjEnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNTAsNS42OEMxMTQuODcsNS42OCw1LjUyLDExNSw1LjUyLDI1MC4xN1MxMTQuODcsNDk0LjY1LDI1MCw0OTQuNjUsNDk0LjQ4LDM4NS4yOSw0OTQuNDgsMjUwLjE3LDM4NS4xMyw1LjY4LDI1MCw1LjY4Wm0wLDM4Ny41NEExNDMuMDYsMTQzLjA2LDAsMSwxLDM5My4wNSwyNTAuMTcsMTQzLjExLDE0My4xMSwwLDAsMSwyNTAsMzkzLjIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUuNTIgLTUuNjgpJy8+PHBhdGggY2xhc3M9J2Nscy0yJyBkPSdNMjg0LjY5LDI5Ni4wOUgyMTUuMzFhMTEsMTEsMCwwLDEtMTAuOS0xMC45VjIxNS40OGExMSwxMSwwLDAsMSwxMC45LTEwLjkxSDI4NWExMSwxMSwwLDAsMSwxMC45LDEwLjkxdjY5LjcxQTExLjA3LDExLjA3LDAsMCwxLDI4NC42OSwyOTYuMDlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNS41MiAtNS42OCknLz48L3N2Zz4=",
      blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
    };}

    static __initStatic2() {this.isAvailable = ()=>{ return (_optionalChain$3([window, 'optionalAccess', _5 => _5.ethereum, 'optionalAccess', _6 => _6.isCoinbaseWallet]) || _optionalChain$3([window, 'optionalAccess', _7 => _7.ethereum, 'optionalAccess', _8 => _8.isWalletLink])) };}
  } Coinbase.__initStatic(); Coinbase.__initStatic2();

  function _optionalChain$2(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  class MetaMask extends WindowEthereum {

    static __initStatic() {this.info = {
      name: 'MetaMask',
      logo: "data:image/svg+xml;base64,PHN2ZyBpZD0nTGF5ZXJfMScgZGF0YS1uYW1lPSdMYXllciAxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0ODUuOTMgNDUwLjU2Jz48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzgyODQ4Nzt9LmNscy0ye2ZpbGw6I2UyNzcyNjtzdHJva2U6I2UyNzcyNjt9LmNscy0xMCwuY2xzLTExLC5jbHMtMiwuY2xzLTMsLmNscy00LC5jbHMtNSwuY2xzLTYsLmNscy03LC5jbHMtOCwuY2xzLTl7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTN7ZmlsbDojZTM3NzI1O3N0cm9rZTojZTM3NzI1O30uY2xzLTR7ZmlsbDojZDZjMGIzO3N0cm9rZTojZDZjMGIzO30uY2xzLTV7ZmlsbDojMjQzNDQ3O3N0cm9rZTojMjQzNDQ3O30uY2xzLTZ7ZmlsbDojY2Q2MzI4O3N0cm9rZTojY2Q2MzI4O30uY2xzLTd7ZmlsbDojZTM3NTI1O3N0cm9rZTojZTM3NTI1O30uY2xzLTh7ZmlsbDojZjY4NTFmO3N0cm9rZTojZjY4NTFmO30uY2xzLTl7ZmlsbDojYzFhZTllO3N0cm9rZTojYzFhZTllO30uY2xzLTEwe2ZpbGw6IzE3MTcxNztzdHJva2U6IzE3MTcxNzt9LmNscy0xMXtmaWxsOiM3NjNlMWE7c3Ryb2tlOiM3NjNlMWE7fTwvc3R5bGU+PC9kZWZzPjxwYXRoIGNsYXNzPSdjbHMtMScgZD0nTTI0Ny45MSwzNTYuMjlhMjYsMjYsMCwxLDAtMjYsMjZBMjYsMjYsMCwwLDAsMjQ3LjkxLDM1Ni4yOVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03Ljk3IC0yMS4zMyknLz48cGF0aCBjbGFzcz0nY2xzLTEnIGQ9J00yNDYuNTUsMTQ5LjcxYTI2LDI2LDAsMSwwLTI2LDI2QTI2LDI2LDAsMCwwLDI0Ni41NSwxNDkuNzFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNy45NyAtMjEuMzMpJy8+PGNpcmNsZSBjbGFzcz0nY2xzLTEnIGN4PScxNDguNCcgY3k9JzIzMC4wNScgcj0nMjUuOTknLz48cG9seWdvbiBjbGFzcz0nY2xzLTInIHBvaW50cz0nNDYxLjI4IDAuNSAyNzIuMDYgMTQxLjAzIDMwNy4wNSA1OC4xMiA0NjEuMjggMC41Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzI0LjQ2IDAuNSAyMTIuMTYgMTQyLjM3IDE3OC44OCA1OC4xMiAyNC40NiAwLjUnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMzkzLjIgMzI2LjI2IDM0Mi44MSA0MDMuNDcgNDUwLjYzIDQzMy4xNCA0ODEuNjMgMzI3Ljk3IDM5My4yIDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPSc0LjQ5IDMyNy45NyAzNS4zIDQzMy4xNCAxNDMuMTMgNDAzLjQ3IDkyLjczIDMyNi4yNiA0LjQ5IDMyNy45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMycgcG9pbnRzPScxMzcuMDQgMTk1LjggMTA3IDI0MS4yNSAyMTQuMDYgMjQ2LjAxIDIxMC4yNiAxMzAuOTYgMTM3LjA0IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzM0OC43IDE5NS44IDI3NC41MyAxMjkuNjMgMjcyLjA2IDI0Ni4wMSAzNzguOTQgMjQxLjI1IDM0OC43IDE5NS44Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy0zJyBwb2ludHM9JzE0My4xMyA0MDMuNDcgMjA3LjQxIDM3Mi4wOSAxNTEuODggMzI4LjczIDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTMnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAzNDIuODEgNDAzLjQ3IDMzMy44NyAzMjguNzMgMjc4LjM0IDM3Mi4wOScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPSczNDIuODEgNDAzLjQ3IDI3OC4zNCAzNzIuMDkgMjgzLjQ3IDQxNC4xMiAyODIuOSA0MzEuODEgMzQyLjgxIDQwMy40NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNCcgcG9pbnRzPScxNDMuMTMgNDAzLjQ3IDIwMy4wMyA0MzEuODEgMjAyLjY1IDQxNC4xMiAyMDcuNDEgMzcyLjA5IDE0My4xMyA0MDMuNDcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTUnIHBvaW50cz0nMjAzLjk4IDMwMC45NyAxNTAuMzUgMjg1LjE4IDE4OC4yIDI2Ny44OCAyMDMuOTggMzAwLjk3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy01JyBwb2ludHM9JzI4MS43NiAzMDAuOTcgMjk3LjU1IDI2Ny44OCAzMzUuNTggMjg1LjE4IDI4MS43NiAzMDAuOTcnLz48cG9seWdvbiBjbGFzcz0nY2xzLTYnIHBvaW50cz0nMTQzLjEzIDQwMy40NyAxNTIuMjUgMzI2LjI2IDkyLjczIDMyNy45NyAxNDMuMTMgNDAzLjQ3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy02JyBwb2ludHM9JzMzMy42OCAzMjYuMjYgMzQyLjgxIDQwMy40NyAzOTMuMiAzMjcuOTcgMzMzLjY4IDMyNi4yNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPSczNzguOTQgMjQxLjI1IDI3Mi4wNiAyNDYuMDEgMjgxLjk1IDMwMC45NyAyOTcuNzQgMjY3Ljg4IDMzNS43NyAyODUuMTggMzc4Ljk0IDI0MS4yNScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNicgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE4OC4zOSAyNjcuODggMjAzLjk4IDMwMC45NyAyMTQuMDYgMjQ2LjAxIDEwNyAyNDEuMjUgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtNycgcG9pbnRzPScxMDcgMjQxLjI1IDE1MS44OCAzMjguNzMgMTUwLjM1IDI4NS4xOCAxMDcgMjQxLjI1Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzMzNS43NyAyODUuMTggMzMzLjg3IDMyOC43MyAzNzguOTQgMjQxLjI1IDMzNS43NyAyODUuMTgnLz48cG9seWdvbiBjbGFzcz0nY2xzLTcnIHBvaW50cz0nMjE0LjA2IDI0Ni4wMSAyMDMuOTggMzAwLjk3IDIxNi41MyAzNjUuODIgMjE5LjM4IDI4MC40MyAyMTQuMDYgMjQ2LjAxJy8+PHBvbHlnb24gY2xhc3M9J2Nscy03JyBwb2ludHM9JzI3Mi4wNiAyNDYuMDEgMjY2LjkzIDI4MC4yNCAyNjkuMjEgMzY1LjgyIDI4MS45NSAzMDAuOTcgMjcyLjA2IDI0Ni4wMScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyODEuOTUgMzAwLjk3IDI2OS4yMSAzNjUuODIgMjc4LjM0IDM3Mi4wOSAzMzMuODcgMzI4LjczIDMzNS43NyAyODUuMTggMjgxLjk1IDMwMC45NycvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScxNTAuMzUgMjg1LjE4IDE1MS44OCAzMjguNzMgMjA3LjQxIDM3Mi4wOSAyMTYuNTMgMzY1LjgyIDIwMy45OCAzMDAuOTcgMTUwLjM1IDI4NS4xOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOScgcG9pbnRzPScyODIuOSA0MzEuODEgMjgzLjQ3IDQxNC4xMiAyNzguNzIgNDA5Ljk0IDIwNy4wMiA0MDkuOTQgMjAyLjY1IDQxNC4xMiAyMDMuMDMgNDMxLjgxIDE0My4xMyA0MDMuNDcgMTY0LjA1IDQyMC41OCAyMDYuNDUgNDUwLjA2IDI3OS4yOSA0NTAuMDYgMzIxLjg5IDQyMC41OCAzNDIuODEgNDAzLjQ3IDI4Mi45IDQzMS44MScvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTAnIHBvaW50cz0nMjc4LjM0IDM3Mi4wOSAyNjkuMjEgMzY1LjgyIDIxNi41MyAzNjUuODIgMjA3LjQxIDM3Mi4wOSAyMDIuNjUgNDE0LjEyIDIwNy4wMiA0MDkuOTQgMjc4LjcyIDQwOS45NCAyODMuNDcgNDE0LjEyIDI3OC4zNCAzNzIuMDknLz48cG9seWdvbiBjbGFzcz0nY2xzLTExJyBwb2ludHM9JzQ2OS4yNyAxNTAuMTYgNDg1LjQzIDcyLjU3IDQ2MS4yOCAwLjUgMjc4LjM0IDEzNi4yOCAzNDguNyAxOTUuOCA0NDguMTYgMjI0LjkgNDcwLjIyIDE5OS4yMyA0NjAuNzEgMTkyLjM4IDQ3NS45MiAxNzguNSA0NjQuMTMgMTY5LjM3IDQ3OS4zNSAxNTcuNzcgNDY5LjI3IDE1MC4xNicvPjxwb2x5Z29uIGNsYXNzPSdjbHMtMTEnIHBvaW50cz0nMC41IDcyLjU3IDE2LjY2IDE1MC4xNiA2LjM5IDE1Ny43NyAyMS42MSAxNjkuMzcgMTAuMDEgMTc4LjUgMjUuMjIgMTkyLjM4IDE1LjcxIDE5OS4yMyAzNy41OCAyMjQuOSAxMzcuMDQgMTk1LjggMjA3LjQxIDEzNi4yOCAyNC40NiAwLjUgMC41IDcyLjU3Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzQ0OC4xNiAyMjQuOSAzNDguNyAxOTUuOCAzNzguOTQgMjQxLjI1IDMzMy44NyAzMjguNzMgMzkzLjIgMzI3Ljk3IDQ4MS42MyAzMjcuOTcgNDQ4LjE2IDIyNC45Jy8+PHBvbHlnb24gY2xhc3M9J2Nscy04JyBwb2ludHM9JzEzNy4wNCAxOTUuOCAzNy41OCAyMjQuOSA0LjQ5IDMyNy45NyA5Mi43MyAzMjcuOTcgMTUxLjg4IDMyOC43MyAxMDcgMjQxLjI1IDEzNy4wNCAxOTUuOCcvPjxwb2x5Z29uIGNsYXNzPSdjbHMtOCcgcG9pbnRzPScyNzIuMDYgMjQ2LjAxIDI3OC4zNCAxMzYuMjggMzA3LjI0IDU4LjEyIDE3OC44OCA1OC4xMiAyMDcuNDEgMTM2LjI4IDIxNC4wNiAyNDYuMDEgMjE2LjM0IDI4MC42MiAyMTYuNTMgMzY1LjgyIDI2OS4yMSAzNjUuODIgMjY5LjU5IDI4MC42MiAyNzIuMDYgMjQ2LjAxJy8+PC9zdmc+",
      blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
    };}

    static __initStatic2() {this.isAvailable = ()=>{ return _optionalChain$2([window, 'optionalAccess', _3 => _3.ethereum, 'optionalAccess', _4 => _4.isMetaMask]) };}
  } MetaMask.__initStatic(); MetaMask.__initStatic2();

  function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  const sendTransaction$1 = async ({ transaction, wallet })=> {
    transaction = new Transaction(transaction);
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      await wallet.switchTo(transaction.blockchain);
    }
    if((await wallet.connectedTo(transaction.blockchain)) == false) {
      throw({ code: 'WRONG_NETWORK' })
    }
    await transaction.prepare({ wallet });
    await submit$1({ transaction, wallet }).then(async (tx)=>{
      if (tx) {
        let blockchain = web3Blockchains.Blockchain.findByName(transaction.blockchain);
        transaction.id = tx;
        transaction.url = blockchain.explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        let sentTransaction = await retrieveTransaction(tx, transaction.blockchain);
        transaction.nonce = sentTransaction.nonce;
        if(!sentTransaction) {
          transaction._failed = true;
          console.log('Error retrieving transaction');
          if(transaction.failed) transaction.failed(transaction, 'Error retrieving transaction');
        } else {
          sentTransaction.wait(1).then(() => {
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
        throw('Submitting transaction failed!')
      }
    });
    return transaction
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
    return wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value: _optionalChain$1([transaction, 'access', _ => _.value, 'optionalAccess', _2 => _2.toString, 'call', _3 => _3()]),
      data: await transaction.getData(),
      gas: (await web3ClientEvm.estimate(transaction)).toString(),
      gasPrice: (await provider.getGasPrice()).toString()
    })
  };

  const submitSimpleTransfer$1 = async ({ transaction, wallet })=>{
    const provider = await web3ClientEvm.getProvider(transaction.blockchain);
    return wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value: _optionalChain$1([transaction, 'access', _4 => _4.value, 'optionalAccess', _5 => _5.toString, 'call', _6 => _6()]),
      gas: (await web3ClientEvm.estimate(transaction)).toString(),
      gasPrice: (await provider.getGasPrice()).toString()
    })
  };

  function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
  const getConnectedInstance$1 = ()=>{
    return window._connectedWalletConnectInstance
  };

  const setConnectedInstance$1 = (value)=>{
    window._connectedWalletConnectInstance = value;
  };

  class WalletConnect {

    static __initStatic() {this.info = {
      name: 'WalletConnect',
      logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjUuNC4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAtLT48c3ZnIHZlcnNpb249JzEuMScgaWQ9J0xheWVyXzEnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgeG1sbnM6eGxpbms9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgNTAwIDUwMCcgc3R5bGU9J2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsnIHhtbDpzcGFjZT0ncHJlc2VydmUnPjxzdHlsZSB0eXBlPSd0ZXh0L2Nzcyc+IC5zdDB7ZmlsbDojNTk5MUNEO30KPC9zdHlsZT48ZyBpZD0nUGFnZS0xJz48ZyBpZD0nd2FsbGV0Y29ubmVjdC1sb2dvLWFsdCc+PHBhdGggaWQ9J1dhbGxldENvbm5lY3QnIGNsYXNzPSdzdDAnIGQ9J00xMDIuNywxNjJjODEuNS03OS44LDIxMy42LTc5LjgsMjk1LjEsMGw5LjgsOS42YzQuMSw0LDQuMSwxMC41LDAsMTQuNEwzNzQsMjE4LjkgYy0yLDItNS4zLDItNy40LDBsLTEzLjUtMTMuMmMtNTYuOC01NS43LTE0OS01NS43LTIwNS44LDBsLTE0LjUsMTQuMWMtMiwyLTUuMywyLTcuNCwwTDkxLjksMTg3Yy00LjEtNC00LjEtMTAuNSwwLTE0LjQgTDEwMi43LDE2MnogTTQ2Ny4xLDIyOS45bDI5LjksMjkuMmM0LjEsNCw0LjEsMTAuNSwwLDE0LjRMMzYyLjMsNDA1LjRjLTQuMSw0LTEwLjcsNC0xNC44LDBjMCwwLDAsMCwwLDBMMjUyLDMxMS45IGMtMS0xLTIuNy0xLTMuNywwaDBsLTk1LjUsOTMuNWMtNC4xLDQtMTAuNyw0LTE0LjgsMGMwLDAsMCwwLDAsMEwzLjQsMjczLjZjLTQuMS00LTQuMS0xMC41LDAtMTQuNGwyOS45LTI5LjIgYzQuMS00LDEwLjctNCwxNC44LDBsOTUuNSw5My41YzEsMSwyLjcsMSwzLjcsMGMwLDAsMCwwLDAsMGw5NS41LTkzLjVjNC4xLTQsMTAuNy00LDE0LjgsMGMwLDAsMCwwLDAsMGw5NS41LDkzLjUgYzEsMSwyLjcsMSwzLjcsMGw5NS41LTkzLjVDNDU2LjQsMjI1LjksNDYzLDIyNS45LDQ2Ny4xLDIyOS45eicvPjwvZz48L2c+PC9zdmc+Cg==",
      blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
    };}

    static __initStatic2() {this.isAvailable = ()=>{ 
      return getConnectedInstance$1() != undefined 
    };}

    constructor() {
      this.name = this.constructor.info.name;
      this.logo = this.constructor.info.logo;
      this.blockchains = this.constructor.info.blockchains;
      this.connector = WalletConnect.instance || this.newWalletConnectInstance();
      this.sendTransaction = (transaction)=>{ 
        return sendTransaction$1({
          wallet: this,
          transaction
        })
      };
    }

    newWalletConnectInstance() {
      let instance = new walletconnectV1.WalletConnectClient({
        bridge: "https://bridge.walletconnect.org",
        qrcodeModal: walletconnectV1.QRCodeModal
      });

      instance.on("connect", (error, payload) => {
        if (error) { throw error }
        const { accounts, chainId } = payload.params[0];
        this.connectedAccounts = accounts.map((account)=>ethers.ethers.utils.getAddress(account));
        this.connectedChainId = chainId;
      });

      instance.on("session_update", (error, payload) => {
        if (error) { throw error }
        const { accounts, chainId } = payload.params[0];
        this.connectedAccounts = accounts.map((account)=>ethers.ethers.utils.getAddress(account));
        this.connectedChainId = chainId;
      });

      instance.on("disconnect", (error, payload) => {
        setConnectedInstance$1(undefined);
        if (error) { throw error }
      });

      instance.on("modal_closed", ()=>{
        setConnectedInstance$1(undefined);
        this.connector = undefined;
      });

      return instance
    }

    async account() {
      if(this.connectedAccounts == undefined) { return }
      return this.connectedAccounts[0]
    }

    async connect(options) {
      try {
        window.localStorage.removeItem('walletconnect'); // https://github.com/WalletConnect/walletconnect-monorepo/issues/315

        if(this.connector == undefined){
          this.connector = this.newWalletConnectInstance();
        }

        if(this.connector.connected) {
          await this.connector.killSession();
          setConnectedInstance$1(undefined);
          this.connector = this.newWalletConnectInstance();
        }

        let { accounts, chainId } = await this.connector.connect({ chainId: _optionalChain([options, 'optionalAccess', _ => _.chainId]) });

        if(accounts instanceof Array && accounts.length) {
          setConnectedInstance$1(this);
        }

        accounts = accounts.map((account)=>ethers.ethers.utils.getAddress(account));
        this.connectedAccounts = accounts;
        this.connectedChainId = chainId;

        return accounts[0]
      } catch (error) {
        console.log('WALLETCONNECT ERROR', error);
        return undefined
      }
    }

    async connectedTo(input) {
      let chainId = await this.connector.sendCustomRequest({ method: 'eth_chainId' });
      const blockchain = web3Blockchains.Blockchain.findById(chainId);
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        let resolved, rejected;
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
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
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
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

    async sign(message) {
      let address = await this.account();
      var params = [ethers.ethers.utils.toUtf8Bytes(message), address];
      let signature = await this.connector.signPersonalMessage(params);
      return signature
    }
  } WalletConnect.__initStatic(); WalletConnect.__initStatic2();

  WalletConnect.getConnectedInstance = getConnectedInstance$1;
  WalletConnect.setConnectedInstance = setConnectedInstance$1;

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
        transaction.url = web3Blockchains.Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction });
        if (transaction.sent) transaction.sent(transaction);
        sentTransaction.wait(1).then(() => {
          transaction._succeeded = true;
          if (transaction.succeeded) transaction.succeeded(transaction);
        }).catch((error)=>{
          if(error && error.code && error.code == 'TRANSACTION_REPLACED') {
            if(error.replacement && error.replacement.hash) {
              transaction.id = error.replacement.hash;
              transaction.url = web3Blockchains.Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction });
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
    let method = contract.connect(signer)[transaction.method];
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
      blockchains: ['ethereum', 'bsc', 'polygon', 'velas'],
    };}

    static __initStatic2() {this.isAvailable = ()=>{ return getConnectedInstance() != undefined };}

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
      const blockchain = web3Blockchains.Blockchain.findByNetworkId(chainId);
      if(input) {
        return input === blockchain.name
      } else {
        return blockchain.name
      }
    }

    switchTo(blockchainName) {
      return new Promise((resolve, reject)=>{
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
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
        const blockchain = web3Blockchains.Blockchain.findByName(blockchainName);
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

    async sign(message) {
      await this.account();
      let provider = new ethers.ethers.providers.Web3Provider(this.connector, 'any');
      let signer = provider.getSigner(0);
      let signature = await signer.signMessage(message);
      return signature
    }
  } WalletLink.__initStatic(); WalletLink.__initStatic2();

  WalletLink.getConnectedInstance = getConnectedInstance;
  WalletLink.setConnectedInstance = setConnectedInstance;

  var wallets = {
    MetaMask,
    Coinbase,
    WindowEthereum,
    WalletConnect,
    WalletLink
  };

  let instances = {};

  const getWallets = ()=>{
    let availableWallets = [];

    Object.keys(wallets).forEach((key)=>{
      let wallet = wallets[key];
      if(wallet.isAvailable()) {
        if(!instances[wallet]) {
          if(wallet.getConnectedInstance && wallet.getConnectedInstance()) {
            instances[wallet] = wallet.getConnectedInstance();
          } else {
            instances[wallet] = new wallet;
          }
        }
        availableWallets.push(instances[wallet]);
      }
    });

    return availableWallets
  };

  const getConnectedWallets = async()=>{

    let connectedWallets = (await Promise.all(
      getWallets().map(async(wallet)=>{
        if(await wallet.account()) {
          return wallet
        }
      })
    )).filter((value)=>!!value);

    return connectedWallets
  };

  const supported = [
    wallets.MetaMask,
    wallets.Coinbase,
    wallets.WalletConnect,
    wallets.WalletLink
  ];

  exports.getConnectedWallets = getConnectedWallets;
  exports.getWallets = getWallets;
  exports.supported = supported;
  exports.wallets = wallets;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
