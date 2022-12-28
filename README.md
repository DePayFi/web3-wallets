## Quickstart

```
yarn add @depay/web3-wallets
```

or 

```
npm install --save @depay/web3-wallets
```

```javascript
import { getWallets } from '@depay/web3-wallets'

let wallets = getWallets()
let wallet = wallets[0]

wallet.name // MetaMask
await wallet.connect() // 0x317D875cA3B9f8d14f960486C0d1D1913be74e90
```

## Demo

https://depayfi.github.io/web3-wallets/demo.html

## Support

This library supports the following blockchains:

- [Ethereum](https://ethereum.org)
- [BNB Smart Chain](https://www.binance.org/smartChain)
- [Polygon](https://polygon.technology)
- [Solana](https://solana.com)
- [Velas](https://velas.com)

This library supports the following wallets:

- [MetaMask](https://metamask.io)
- [Coinbase Wallet](https://wallet.coinbase.com)
- [Phantom](https://phantom.app)
- [WalletConnect](https://walletconnect.org)

100+ different wallets via [WalletConnect](https://walletconnect.org), such as:
- [Trust Wallet](https://trustwallet.com)
- [DeFi Wallet by crypto.com](https://crypto.com/defi-wallet)
- [1inch Wallet](https://1inch.io/wallet/)
- [imToken Wallet](https://www.token.im)
- [TokenPocket](https://www.tokenpocket.pro/en)
- [Pillar](https://www.pillar.fi/)
- [Math Wallet](https://mathwallet.org/)
- [Ledger Live](https://www.ledger.com/ledger-live)
- [Argent Wallet](https://www.argent.xyz)
- [AlphaWallet](https://alphawallet.com/)
- [Unstoppable Wallet](https://unstoppable.money)
- [Atomic Wallet](https://atomicwallet.io)
- [Rainbow](https://rainbow.me/)
- and more...

## Platform specific packaging

In case you want to use and package only specific platforms, use platform-specific packages:

```javascript
import { getWallets } from '@depay/web3-wallets-evm'
```

## Functionalities

### getWallets

`getWallets`: Returns an array of available/connectable wallets.

```javascript
let wallets = getWallets();
// [<Wallet name='MetaMask'>, <Wallet name='Phantom'>]
```

```javascript
let wallets = getWallets();
// [] no wallets detected. (you can still try WalletConnect or WalletLink)
```

```javascript
{ getWallets, wallets } from "@depay/web3-wallets"

let foundWallets = getWallets()

let wallet
if(foundWallets.length == 1) {
  wallet = foundWallets[0]
} else if(foundWallets.length > 1) {
  wallet = foundWallets[parseInt(prompt('Which wallet do you want to connect?'), 10)]
} else {
  // Let the user choose:
  // you can still try to connect via wallets.WalletConnect.connect()
  // or wallets.WalletLink.connect()
  wallet = wallets.WalletLink
}
```

### getConnectedWallets

`getConnectedWallets`: Returns an array of currently connected wallets.

```javascript
let wallets = await getConnectedWallets();
// [<Wallet name='MetaMask'>, <Wallet name='Phantom'>]
```

### Name

`name:string`: Returns the name of the wallet.

```javascript
wallet.name // 'MetaMask'
```

### Logo

`logo:string`: Returns the logo of the wallet as PNG base64-encoded.

```javascript
wallet.logo // 'data:image/png;base64,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'
```

### Account

`async account():string`: Gets the currently connected and active account (without prompting a connect screen). Returns `undefined` if no account is connected.

```javascript
await wallet.account() // '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
```

### Connect an account

`async connect():string`: Connects account. Potentially opens wallet connect screen. Provides connected account in async return. If wallet fails to connect, it returns `undefined`.

```javascript
await wallet.connect() // '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
```

### Supported Blockchains

`blockchains:Array`: Array containing the names of supported blockchains

```javascript
wallet.name // MetaMask
wallet.blockchains // ['ethereum', 'bsc', 'polygon']
```

### Check if wallet is connected to a specific blockchain

`async connectedTo(blockchain):Boolean`: Checks if wallet is connected to a specific blockchain.

```javascript
await wallet.connectedTo('ethereum') // true
```

If no param is given it well tell you to which blockchain the wallet is connected to:

```javascript
await wallet.connectedTo() // 'bsc'
```

### Receive wallet events

`on(string, function):undefined`: Register a callback function for given events.

```javascript
wallet.on('account', (newAccount)=>{
  doSomething(newAccount)
})
```

#### Events

`on('account', (newAccount)=>{})`: Triggers when user changes the connected/active wallet account.

#### Deregister wallet events

`.on` returns a callback function that needs to be passed to `.off` if you want to deregister the event listener:

```javascript
let callback = wallet.on('account', (newAccount)=>{
  doSomething(newAccount)
})

//...

wallet.off('account', callback) // removes listener
```

### Switch blockchain/network

`async switchTo(blockchain)`: Changes wallet connection to a specific network (adds it to the wallet in case it's missing)

```javascript
await wallet.switchTo('bsc')
```

### Transaction

### sendTransaction

#### EVM: sendTransaction

Available arguments for EVM blockchains:

`blockchain: String`: Name of the blockchain e.g. 'ethereum'.

`to String`: Address of the contract to be transacted with.

`api: Array`: Api of the contract (e.g. abi for Ethereum).

`method: String`: Name of the contract method to be called.

`params: Object or Array`: Parameters passed to the method.

`value: Number or BigNumber as String`: Value of the transaction (amount of the native blockchain currency sent along with the transaction).

`sent: Function (transaction)=>{}`: Callback to be executed if transaction has been sent to the network.

`succeeded: Function (transaction)=>{}`: Callback to be executed if transaction was successful and has been confirmed once by the network.

`failed: Function (transaction, error)=>{}`: Callback to be executed if transaction failed (e.g. reverted).

##### EVM: Simple value transfer

e.g. sending 0.01 ETH on Ethereum:

```javascript

let sentTransaction = await wallet.sendTransaction({
  blockchain: 'ethereum',
  to: '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92',
  value: 0.01,
  sent: function(transaction){},
  succeeded: function(transaction){},
  failed: function(transaction, error){}
})
```

##### EVM: Smart contract interaction

```javascript
let sentTransaction = await wallet.sendTransaction({
  blockchain: 'ethereum',
  to: '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92',
  api: [{"inputs":[{"internalType":"address","name":"_configuration","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"configuration","outputs":[{"internalType":"contract DePayRouterV1Configuration","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"pluginAddress","type":"address"}],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"address[]","name":"plugins","type":"address[]"},{"internalType":"string[]","name":"data","type":"string[]"}],"name":"route","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
  method: 'route',
  params: {
    path: ["0xb056c38f6b7Dc4064367403E26424CD2c60655e1","0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb"],
    amounts: ["11275067000000000000000","100000000000000000000", "1632063302"],
    addresses: ["0x39794c3171d4D82eB9C6FBb764749Eb7ED92881d", "0x39794c3171d4D82eB9C6FBb764749Eb7ED92881d"],
    plugins: ["0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019", "0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9"],
    data: []
  },
  value: "0",
  sent: function(transaction){},
  succeeded: function(transaction){},
  failed: function(transaction, error){}
})
```

#### Solana: sendTransaction

Available arguments for Solana blockchains:

`blockchain: String`: Name of the blockchain e.g. 'solana'.

`sent: Function (transaction)=>{}`: Callback to be executed if transaction has been sent to the network.

`succeeded: Function (transaction)=>{}`: Callback to be executed if transaction was successful and has been confirmed once by the network.

`failed: Function (transaction, error)=>{}`: Callback to be executed if transaction failed (e.g. reverted).

##### Solana: Simple value transfer

e.g. send 0.01 SOL on Solana:

`to String`: Address of the receiver.

`value: Number or BigNumber as String`: Value of the transaction (only needed for simple SOL transfers).

```javascript

let sentTransaction = await wallet.sendTransaction({
  blockchain: 'solana',
  to: '2UgCJaHU5y8NC4uWQcZYeV9a5RyYLF7iKYCybCsdFFD1',
  value: 0.01,
  sent: function(transaction){},
  succeeded: function(transaction){},
  failed: function(transaction, error){}
})
```

##### Solana: Sign and send instructions

`instructions Array`: A set of TransactionInstructions

e.g. Send 1 USDC:

```javascript
import { Token } from '@depay/web3-tokens'

let sentTransaction = await wallet.sendTransaction({
  blockchain: 'solana',
  instructions: [
    await Token.solana.createTransferInstructions({
      token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
      amount: '1000000',
      from: await wallet.account(),
      to: '5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf552DfZkxas'
    })
  ],
  sent: function(transaction){},
  succeeded: function(transaction){},
  failed: function(transaction, error){}
})
```

#### value

If value is passed as a number it's gonna be converted into a big number applying the individual blockhain's default decimals:

```javascript
let transaction = new Transaction({
  ...,
  value: 1
})

transaction.value // '1000000000000000000'
```

If value is passed as a string or as a BigNumber, value is used just as provided:

```javascript
let transaction = new Transaction({
  ...,
  value: '1000000000000000000'
})

transaction.value // '1000000000000000000'
```

#### wrong network

`sendTransaction` rejects with:

```javascript
{ code: 'WRONG_NETWORK' }
```

in case wallet is connected to the wrong network and network cant be switched automatically.

### Sign messages

```javascript
let signature = await wallet.sign("This is a message to be signed")
```

## Logos

### Conversion

Use https://codebeautify.org

## Development

### Get started

```
yarn install
yarn dev
```

### Release

```
npm publish
```
