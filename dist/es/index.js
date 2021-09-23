import { Blockchain } from 'depay-web3-blockchains';
import QRCodeModal from '@walletconnect/qrcode-modal';
import WalletConnect from '@walletconnect/client';

class Web3Wallet {constructor() { Web3Wallet.prototype.__init.call(this);Web3Wallet.prototype.__init2.call(this);Web3Wallet.prototype.__init3.call(this); }
  __init() {this.name = 'Web3 Wallet';}
  __init2() {this.logo =
    'data:image/png;base64,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';}
  __init3() {this.blockchains = ['ethereum'];}

  async account() {
    return (await this.accounts())[0]
  }

  async accounts() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts
  }

  async connect() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
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
        window.ethereum.on('chainChanged', (chainId) => callback(Blockchain.findById(chainId).name));
        break
      case 'disconnect':
        window.ethereum.on('disconnect', callback);
        break
    }
  }

  async connectedTo(input) {
    const blockchain = Blockchain.findById(await window.ethereum.request({ method: 'eth_chainId' }));
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
  }

  addNetwork(blockchainName) {
    return new Promise((resolve, reject)=>{
      const blockchain = Blockchain.findByName(blockchainName);
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
      const blockchain = Blockchain.findByName(blockchainName);
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

class Coinbase extends Web3Wallet {constructor(...args) { super(...args); Coinbase.prototype.__init.call(this);Coinbase.prototype.__init2.call(this);Coinbase.prototype.__init3.call(this);Coinbase.prototype.__init4.call(this); }
  __init() {this.name = 'Coinbase Wallet';}
  __init2() {this.logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAARVBMVEVHcEypv/iPq/V7nPNhifJMee8uYeM8b/ITTN8WT+EYUeQcVOcgWOsjXO8nX/IpYvUsZPdXgvF+n/Oas/a6zPni6f3///93mVYDAAAACHRSTlMAIEh2mr7O4XKKDKcAAA8aSURBVHja7V2JmqsqDB63VsWl1jrv/6iXLQkQreio0zPfjQphTX6SQNvT6fk6hZIkTbM8L4rifr8/JMmsKPI8z9I0+fo3KJEIjPKPvn8gUVFCyrPPhiMxFHet8AqpDgrN1yeSBfGIpV5e9zz7LMskaX5XhthIekjxOYbZh4LQfAYWhWI3CDJM8bs+lmTFj1EAlnv+a2ZJ8nt/DAxwsV+BkuSPI2EYKPfLPUzC6A6GYTzsWigKxuMcUlC+LqKTrOFAuSZWskND/NfCPi3OhmGg5OeGSpIfdG6sIulO9a/0flaMz4XKaUa5zByWzjKKNIeP40BY/VzdSZGSuUdHTxwlflNvdAFOF8JOfTjcZ86IlKToXc1sEpYwc5Gaxy0H74A5MOTk4h17PBq36kMbvLWIubAblb0imYtbRF19l38dR+hW9gx5Y5GeWSSAyd8jsqre34iLwwIl63HtenR2XTQ3aGpLbm9UzvC2GibClTBDQhlmxHG7V97JaQ2BopYDuVRhy5qoxVRZ3kvQgFiekdE9jkCSFF3vkxW4j6x6vPL9zD8P+aRo+w+gLvspDrldfQR1+d/AoZD8DRwKyd/AoZD8DRwKyS/sV3INjl6GbufetR/H8Rhg2j1I8vany3cCnK7ffMZn7Y+s0AV8UOx2I3kkG3F03aIiAdvNF7uwgTLiN8vo2vsmJKnSQ2FROQtf2eSL0VXEBpp3XkXn8HMyei7DpLZ3W2zaeFs5yow1wvUDRV2lcw8IKAitOrNNtq/JoWVJhsyWZXRttiXQ7SREUNaPSqwGkMgn6L7Ad7C2s4PMhNTgyMCZ2jQ+0D2xOsHiPKEcuhS1LjnqIseFEC2WY8MktWvlTU3Ffu5igrXmj2EYnoYkJ98hqco32oZzzsvAMFkPED41lZcsQv2Vuo/hOb6m6dulaXqNz0Gh8eZVGSRxFokMk9zKmV0tXy5e1FmpOTxfHoQAzjg80DB9qLLnDSTEJCQnjXCs0O3VvUp2bdumG8bX9xpNr6fFwoTxOmKp3N43O1ZI72BJj3oCinUsQycl7aV158qjZu9nYQyj8ahYLM9Hsx9LuuZYW4lgGGNshbJXXrH22n3ftI2BsQNK35zhXNk+HM1j/N5L09DuEapePb6N9H1eNX3/gF77/KvNfxjp3ByOV+30rz1Gabtk0SCPdk90TN8/JmmUI02S78DRjt9H0DQ0O2SnCwbp26jxLv9jt0J6wpmypARva4oFgzS2NyXhPEHVIW4FNEKgcOkA0WtVV/rWINTT49WN2fE4ZKDo2T0AVhhVwAMmWTRIi/q7Q8OVgTD/PpZevYVBetDyeah0GaOEb1mt28lcMIJMAzgPx2GREARuAtLL+kQ+c6g3HSlOADx/ouU4BYf1riAg1EUMNtu6ZOZQ1z0leYGgivLRDQ5zdHwQEkeG4k1Bc5C4ujUZN4geTHpDZmeyl0pOxCGRNEYKrKmzvECdk/JXXEWD2vrDLW8JAPYn4ZC7sF5R0gNKOkG1ULnQJGmgKs1FU7kzHXYOzp2MRuasRahsUrYD58YgzIXs7cDUnnnM65IFGppgGclJPM4m/g58b7lFHNO605xwgPg0uS7lswHXMt9K0Q9pONx86OO0AHHChOlCvBdEzT3wLCAaOmsjNfTEAAHnWtKlmzFK6h0iBJOIY7nAsWacixhiKXFP97RhXYkNAJ248xKNol0KWr7Od8+zokmcumM5zrVO3Lfu0cOucCx7wK8S37fSyBHXRPpmk9CZmH2cQTaZhF4CF/GDxEUG2WaSFDbfxlbM9DHp5QYxJmkCZZb4nDZfIj2eHkqby7Ys1yRLiatlc6cQgZvDuPTFiX+WaOlcIcywsUsoRKijO9yigxrx/L6OpofVnnSiAqplnhROEXPpRN9zK9Bct/caegquCynoaGWDJOlAV2ygHt6oC0PdCfeGDOBDIQOJwhyHZBEHjzdCgoj3rGl4vKchcst4WJVIH7pRUYr2TLRhA3c1zTdT3EtX0bwnUT8jfUvJZvqYy1XPRHthS3AF+CmP9KxBLowvmi+KeMX5FjqVn3F9Ux3rqtqr9+UDK55bHMKGlbtdkvw4k0w96BJm4SUyda7bNm49uOWz4eXJg9YRbYszgUWekcY1Q1AvxanbcCRD5HrTItKDVEJ9ZQrPFAsExtO8TrbhQBqFO5WrUiijUC9QyK2oC6Y0gxgi9xrSGy5bgDTaIi/hTeWq5DVYIFYCNfGAkTcJXwcSuKa+HFDRc02dM8yP4wCb/OQ0s3LneniZiN39aRhfHzt7Hbsorg18nkSoRH5Ml7NO1NPTQLy2WCQ0CVaARWKj3TWCfEIWppZAhGcQdxk9Xh2HG4JdJ3TjYwTFWuQp+NpyVlH6VcyewyQVqdsApPVnCieMBjIKO9TfhLCSqjIFhCqW3awRj+9oIHzZAo6ArG9biyvr4pFA7qyFIzK7bzSQNdoApIml3AChBVykA4C0m4FMG4EQHQFELCLYDsSOXKfiy+THyZZAjnOtqYtdZgvkQLf+HSDN7cOBPMT/QJqPAtLFA7nPB8+/BqT4ugtQXTLAY0pZvXH7pTQois3niMChbLGxJddAhNMaylTZdiDygcTPNbv5QBTBWiCPTG5fNApbzdCae+uByFZDuNNtea0F4xEBze0paYCoG5qhM9Rg8yP21S8JDRKYawOQ2uoUuorNcFb5MUpeQwPWLpQ3AKGhpIc7cfTL+JrGB0tiEng0kBAyA2Mwi9dGi4RmpTnj31hp5XxdqMa95DtElfMWbpx63GYRSOzl8tFAhtodHSZO/Mi3uhkTZsquCe2WucEiOId/2+k3zdXMIIEiVslPUVL0NLdVCIYmdv99ONHBDCO5DRaZ9Ej9zJu3Mc0WiKAGw9vcHSwp9r1uZ7ujdNrPTV08kLE2mtgJDWdmgdW22hXqI1NToVLzYGess8NekUAQO6Tmwor4f1eoYYS9zWOX25WRq0/jSXXzqDSo0xX1GAmEtMfZfECxQIaaAJgU5yVeq5apfx/BhbcXsv7Y2CB51L402gkJUDVGhggpQ/OQSmQoBSSv3b5ehwBO3CdbY0kG0Cm3SN3EzVTjJJ7H8Fv/s25m7BdqHcDX8l+RDlHVlhTHqWxiJwq8yvJ0Q2Ob6C8+eMtHma7GZ8MG/Hq+p3GK3XwdiyxAMdFb6H+ebtmuReP9vaG78IsP4FmhGkCugnVuvvkgBxDxQc6AS78wMNSuNhwBkdq0KNrZIF5RX/mNgclTA5J5/WSsm2hfpmCCC33rWa2sLHH2m/4J96gl+1TXfatm6pbWl6kmY93QvV4ZQXl7mUnGMmJ9GwwRGyQrmInKy0wiXyBEUwpfzowfU19lkrGM1wn/GCZp5nv8okmmbsPiFvTnPBtGXbNx6S1rnTBEwLc2DKuuOEumZsPSNgl9yT9sw4TTJcf7UEVBAM8iuoHqNbRjGZ4ai+e/4npVoQrBbXOdVOBZ5FtLaJxifUW8T63VwKoMsmetojyLKDEj9EOQMLONUF+d7FxDaYSDPOYcJjF3Vfh/hgg9ZQ99EQe3uUx4nepcYwkqe04dKGNbwLPIt2z9vPZBUp65c71qR4vFC5PgT0OT1lebX8CcHSZTV4UKhAW3uszDv2Yvl/Hzqro87dv+w4wiTrAyTcK/aE/r2kYTdjeDfUPhxnbWaTKUKAOWn4c6tVY3/mM7cgZUV2YY8Zrs7M4mcM6fxDxLlKEke2czqqPlm1YKdTIJfHJDHakggCdc1RlIJA537UwaJoL6VHO/s3WvdK9wkLC5vQnXCUg0jtoV6Cnjl3WoZnM/gKRnseMZ0WCTn2EThcN1n3A5mSZ27+Umod4Cb98u1KRscuxfKg1lsPDh0qFgm5JBuElgFiKvFFi2OvDDiEnhcAH4K0dttKxVkyz8KFVlegemQF7dwaTlUb/98OpKx5MWLEKrjAZ5YxIh4SyECQKlqctjfj1orJVsNj23hGOiavmnwm6l9vyZQF+m8oBAUW61QqQCNwinlM3HbcKo+rF7jQ2Ty6Uw2aVrEH688xnULek0o0hzVLOar0lN3/26IY1fQlRRmZr2R8r0FKUzEQpChtr8mrJ4/3uTpR5DdzgjFT1cZbnr9w2nsQNzkPZvnYLkpiu/AFqG81beYi06QVkNrx0wSmZtryKoIx7eh7yL9yqAYOeEqgp5r4u2yjhtcapGwuBOVTmzorxQZnmzkf4u3rG7nFPNYqewCTHQhTqXZfN8RRpjkDa0isN0pDteVLKyYYh2rDXnggnUY1Kcl9hAjtVGYunkr/2uohBliUvsrYgPQ6dUhaW3jkVvTCR5i0LTWFR4+YyhUtqFfrqYg3jea4nCGU4AwkoymVdpHGud8kBMgIpj8C8LRnTq16RfE9JrlD8k3daySfXgw/S9eFGmzJ7G/Sj2rXTGeblM3VkXRIJltM7C/BFjrcoMxKL+JHDG+vDaZN25BAZ8uHauINuOCbSFpNQneqO2yoLVm7PLm6OQvwwGmSZBwiJJYTQPZ6EfaO7JmRtNnUphAyQyTD6W5JG+gW4fiyQIkPXT5EORsBNk/TT5SCQq0P8CEnUSbqbs84BoHH8ASbDx/rObcKm+qrEXyQdB0Tj+ABKN499HUmocv4ukrA6gH+NQe1e5pFbJ5b1vXq/kMsy0tx/jUP9yXZKCmitnpdtmnVAPlzFNVFYTuxMsyihvh/zXuvLtCbxNKi1nsKkHL8mjloqzOfbWjVhrGa+PGR/I0OlR/0VwcjOybII6I2MqqQ92kxcb6o73e9Ekfp/j/tPmpLDiSITPUDNvrWw1dtIXrToxvgzksq8DKXf0dTwKeWxFPf0+mOCju9AY35wk5pAw9wKl8T0FGB8DFv0OPiBiqLuD1TXtceHhuxcpTDmygesESuNDTGBcbHfX51C3on0YJFDuPr4JnBJhYeESdnWD5JjTY9a9briQTA37cAxU5nuUZ0q+GvnhbkUxX/F9ktdQvtSdlF2Y4URzgFHeyF6nKr7yRHPYSBHlBVScag5DifSvk+lcryJKi/JMEqfsuZdDEdnZwRFCOcXBroZxEpTbL8AwYX8rD6TiwthgULKjzCLyi3aqZQ87wCxV8Us+xbFU/z6Kn2G5fRQKiJf8JjaCSD8OBYBJ8yLGNNUt/1wQDppMwpm1TiVu0g7/AAYPTppmWS4haSryXAJIk9Mg/Acf5RwZJM18cwAAAABJRU5ErkJggg==';}
  __init3() {this.blockchains = ['ethereum', 'bsc'];}
  __init4() {this.install = 'https://wallet.coinbase.com';}
}

class MetaMask extends Web3Wallet {constructor(...args) { super(...args); MetaMask.prototype.__init.call(this);MetaMask.prototype.__init2.call(this);MetaMask.prototype.__init3.call(this);MetaMask.prototype.__init4.call(this);MetaMask.prototype.__init5.call(this); }
  __init() {this.name = 'MetaMask';}
  __init2() {this.logo =
    'data:image/png;base64,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';}
  __init3() {this.blockchains = ['ethereum', 'bsc'];}
  __init4() {this.devices = ['desktop', 'mobile'];}
  __init5() {this.install = 'https://metamask.io/download.html';}
}

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
let connectedInstance;

class WalletConnectWallet {
  __init() {this.name = 'WalletConnect';}
  __init2() {this.logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAIVBMVEVHcEzA3v+32f6n0f6Rxv5/vP5ss/1bqv1Kof0zlfw7mfxjyhOQAAAACXRSTlMAGTlZfaC81e2kc52PAAAFE0lEQVR42u3azXMTNxgGcMeJh6s7BLg6eBhyNKSUDKdlMG3JCUILNbekB8iR8NGEU4G21LnixV5dY0q0f2VTZ3dfvK+0zyvZmQ6DnhOzrEf67YderZRaSEhISEhISEhISEhIyP+Zb9pr3dsPfu7eWltp1k4lC+3be2meoxe3VmpzT/3ab/1EpUUS9e7F1dpcU7/2Kk3S6WiVzrWZS3tZC+V2Rs9btfmk/gMpmObTzdo8svgka8KC2azNnuVXWRtWzPOZH+dzfZWCJLO2cum/NmArf8zUynI/lUTPYlncP3FgyzP/Z3cnawNHbfsOVo+KNnBGnu/LdYc2Uv2h5fXw6tQleuxzQ/ZTt2iP2/JjdrEcbkvnlC/WhPLxtC/W5G3ZcmtkXaUeGbacXvV+6hP9xqWRjQxymvd+qequV/7foQPEemuPC9jfB6lObFIViSGJuQV99PKn7trF9rfdB3uJuR09kDZyx1xm391fadJc8uGBWRMJIaZfq9H90vPZ/kWZThz4Q9RfV3gp+M5Ymzuil910qX5tmmcymp/7WtJIg3dvZBtgzz7hJ7+XNHKGX6tNO5tXz/deErVdPQ/wuVx1XfrVMzCjKZ0ue4ZvqKkfoZnb8nSnYuEQrN2G73VVDcG/Su4JpmefNTL2qCZ67DZoq8ijLo46buePPQqj3pXNCPruEOraB+Fs/bKavrguXdNb0mnzTg5xyaqiZ142TGQQZ4q+e/wvB4o6fkocKROIC0Ufus+3JxA5pecCoQcmdjq/kRx6fDo8jtx+0O3UvposfC/9FK8/3JQuAry8Wb7Nya50Lq4i4fOZDFvlb55RS/o+xNI3Te9OQ6QfFz3pSFDvF2WVDsgoDRrT8ECedZxk+REMySi4JFHHCUJlEM/JYgkk6zhBTo68FUAKCoYQhSCYcq6o5bEAklEIklMgpKBgCFHoAKacV3CiSJNQ6nguoyOo+hEFQajj5Ump6mBIPpGBEOr4qip9iGNINpOBM0q6Kzv4Q5wgiELrGdNX9gAuwBGkRJGuZ/xeNEIUBCEKgFAjvfJvx5UQTFk6/q/y5bqgMIUgnIIhw+akXmHKQnYWp2DI7qRg4eWR3Mv7yCF8Oc/YyQGAUCefgoUZOucCOx7ZIJjSs5yCKfy+2b7EGiaIhXK3PGGSrp/2+BNofQdiBCEKgGzRS2CjUFWzUyAEUKg8V1EwBFM4pDSQA0gVBUKKmQKCYApBMKXHeppB7CeUIJjSsHfUesY9giBK9SXHFL7/8A+noCuO7tq6YhsL/FCrEoJeJA7Rb03HqiCYcoNDjDo7BFMWNe+0iXeYQXi9wPVmm0NaxidudJVBBtKdgJHlQaozypEVgim2t3sVnjlAmxp4yMXDQAS2Z0Dx4LXScatmA0DEO6pR5U4TgjCKx/bZBoDIKCry3sYcNqenYv5bmvT68ekinlTSNyHe18AQomAIpvB6TRRfCFFMA3+Z4gUhCoZQmTIUAy8Kh1DBZcXAZV+DQzjFF0I1iUM4xRNCFA7hFA9IMZBXQMDE843bFo1oSahnqGqelBiu5blttNFAziGYMmx5/5VPjNdXCeJBweuNvRLEkxLjpWIqBr4UsAb86PNi4JaFfel2bsMbQgM53i3ZcIcQRbqduwSWC6uXmnMI3hwqDz0OO63yTf8M4kXJIZhyAvGiqLxeY0qy5f0HyZ+E1eG6/tP7j3nbV6TotXn9VXpISEhISEhISEhISEhISEjIl5R/AceNSyX32CxyAAAAAElFTkSuQmCC';}
  __init3() {this.blockchains = ['ethereum', 'bsc'];}

  constructor() {WalletConnectWallet.prototype.__init.call(this);WalletConnectWallet.prototype.__init2.call(this);WalletConnectWallet.prototype.__init3.call(this);
    this.connector = this.newWalletConnectInstance();
  }

  newWalletConnectInstance() {
    let instance = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal
    });

    instance.on("connect", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0];
      this.connectedAccounts = accounts;
      this.connectedChainId = chainId;
    });

    instance.on("session_update", (error, payload) => {
      if (error) { throw error }
      const { accounts, chainId } = payload.params[0];
      this.connectedAccounts = accounts;
      this.connectedChainId = chainId;
    });

    instance.on("disconnect", (error, payload) => {
      connectedInstance = undefined;
      if (error) { throw error }
    });

    instance.on("modal_closed", ()=>{
      connectedInstance = undefined;
      this.connector = this.newWalletConnectInstance();
    });

    return instance
  }

  async account() {
    if(this.connectedAccounts == undefined) { return }
    return this.connectedAccounts[0]
  }

  async accounts() {
    if(this.connectedAccounts == undefined) { return }
    return this.connectedAccounts
  }

  async connect(options) {

    if(this.connector.connected) {
      await this.connector.killSession();
      connectedInstance = undefined;
      this.connector = this.newWalletConnectInstance();
    }

    const { accounts, chainId } = await this.connector.connect({ chainId: _optionalChain([options, 'optionalAccess', _ => _.chainId]) });

    if(accounts instanceof Array && accounts.length) {
      connectedInstance = this;
    }

    this.connectedAccounts = accounts;
    this.connectedChainId = chainId;
      
    return accounts
  }

  async connectedTo(input) {
    let chainId = await this.connector.sendCustomRequest({ method: 'eth_chainId' });
    const blockchain = Blockchain.findById(chainId);
    if(input) {
      return input === blockchain.name
    } else {
      return blockchain.name
    }
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
    switch (event) {
      case 'account':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0];
          if(accounts instanceof Array) { callback(accounts[0]); }
        });
        break
      case 'accounts':
        this.connector.on("session_update", (error, payload) => {
          const { accounts } = payload.params[0];
          callback(accounts);
        });
        break
      case 'network':
        this.connector.on("session_update", (error, payload) => {
          const { chainId } = payload.params[0];
          if(chainId) { callback(Blockchain.findByNetworkId(chainId).name); }
        });
        break
      case 'disconnect':
        this.connector.on('disconnect', callback);
        break
    }
  }
}

let getWallet = function () {
  if(connectedInstance) {
    return connectedInstance
  } else if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
    return new MetaMask()
  } else if (typeof window.ethereum === 'object' && window.ethereum.isCoinbaseWallet) {
    return new Coinbase()
  } else if (typeof window.ethereum !== 'undefined') {
    return new Web3Wallet()
  }
};

const supported = [
  new WalletConnectWallet(),
  new MetaMask(),
  new Coinbase()
];

export { getWallet, supported };
