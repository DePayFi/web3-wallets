'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var depayWeb3Blockchains = require('depay-web3-blockchains');

class Wallet {constructor() { Wallet.prototype.__init.call(this);Wallet.prototype.__init2.call(this); }
  __init() {this.name = undefined;}
  __init2() {this.logo = undefined;}

  async account() {
    return
  }

  async accounts() {
    return
  }

  async assets() {
    return
  }

  on(event, callback) {
    return
  }
}

class EVMWallet extends Wallet {constructor(...args) { super(...args); EVMWallet.prototype.__init.call(this);EVMWallet.prototype.__init2.call(this);EVMWallet.prototype.__init3.call(this); }
  __init() {this.name = 'Web3 Wallet';}
  __init2() {this.logo =
    'data:image/png;base64,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';}
  __init3() {this.blockchains = ['ethereum'];}

  async connect() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts
  }

  async account() {
    return (await this.accounts())[0]
  }

  async accounts() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts
  }

  on(event, callback) {
    switch (event) {
      case 'account':
        window.ethereum.on('accountsChanged', (accounts) => callback(accounts[0]));
        break
      case 'accounts':
        window.ethereum.on('accountsChanged', (accounts) => callback(accounts));
        break
      case 'network':
        window.ethereum.on('chainChanged', (chainId) => callback(depayWeb3Blockchains.Blockchain.findById(chainId).name));
        break
    }
  }

  async connectedTo(input) {
    const blockchain = depayWeb3Blockchains.Blockchain.findById(await window.ethereum.request({ method: 'eth_chainId' }));
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = depayWeb3Blockchains.Blockchain.findByName(blockchainName);
      ethereum.request({
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
      const blockchain = depayWeb3Blockchains.Blockchain.findByName(blockchainName);
      ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: blockchain.id }],
      }).then(resolve).catch((error)=> {
        if(error.code === 4902){ // metamask chain not yet added {
          this.addNetwork(blockchainName)
            .then(()=>this.switchTo(blockchainName).then(resolve))
            .catch(reject);
        } else {
          reject(error);
        }
      });
    })
  }
}

class MetaMask extends EVMWallet {constructor(...args) { super(...args); MetaMask.prototype.__init.call(this);MetaMask.prototype.__init2.call(this);MetaMask.prototype.__init3.call(this);MetaMask.prototype.__init4.call(this);MetaMask.prototype.__init5.call(this); }
  __init() {this.name = 'MetaMask';}
  __init2() {this.logo =
    'data:image/png;base64,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';}
  __init3() {this.blockchains = ['ethereum', 'bsc'];}
  __init4() {this.devices = ['desktop', 'mobile'];}
  __init5() {this.install = 'https://metamask.io/download.html';}
}

class Coinbase extends EVMWallet {constructor(...args) { super(...args); Coinbase.prototype.__init.call(this);Coinbase.prototype.__init2.call(this);Coinbase.prototype.__init3.call(this);Coinbase.prototype.__init4.call(this);Coinbase.prototype.__init5.call(this); }
  __init() {this.name = 'Coinbase Wallet';}
  __init2() {this.logo =
    'data:image/png;base64,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';}
  __init3() {this.blockchains = ['ethereum', 'bsc'];}
  __init4() {this.devices = ['desktop', 'mobile'];}
  __init5() {this.install = 'https://wallet.coinbase.com/';}
}

let getWallet = function () {
  if (typeof window.ethereum !== 'undefined') {
    if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
      return new MetaMask()
    } else if (typeof window.ethereum === 'object' && window.ethereum.isCoinbaseWallet) {
      return new Coinbase()
    } else {
      return new EVMWallet()
    }
  }
};

const supported = [
  new MetaMask()
];

exports.getWallet = getWallet;
exports.supported = supported;
