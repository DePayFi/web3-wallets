## Quickstart

```
yarn add depay-crypto-wallets
```

or 

```
npm install --save depay-crypto-wallets
```

```javascript
import { wallet } from 'depay-crypto-wallets'
  
```

## Support

This libraries supports the following blockchains:

- [Ethereum](https://ethereum.org/)

This libraries supports the following wallets:

- [MetaMask](https://metamask.io/)

## Functionalities

### Get wallet type

`type():string`: Gets the type of the wallet before even connecting it.

```javascript
wallet.type() // 'MetaMask'
```

Returns `'unknown'` if there is a wallet but type is `'unkown'`. Returns `undefined` if no wallet was found at all.

### Connect to the wallet

`async connect():string`: Connets wallet. Potentially opens wallet connect screen. Provides connected wallet addresses in async return.

```javascript
await wallet.connect() // '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
```

### Receive wallet events

`on(string, function):undefined`: Register a callback function for given events.

```javascript
wallet.on('account', (newAccount)=>{
  doSomething(newAccount)
})
```

#### Events

`on('account', (newAccount)=>{})`: Fires when user changes the connected/active wallet account.

`on('network', (newNetwork)=>{})`: Fires when user changes network of the connected wallet.

## Development

### Get started

```
yarn install
yarn start
```

### Release

```
npm publish
```
