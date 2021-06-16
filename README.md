## Quickstart

```
yarn add depay-multichain-crypto-wallets
```

or 

```
npm install --save depay-multichain-crypto-wallets
```

```javascript
import { wallet } from 'depay-multichain-crypto-wallets'
  
```

## Functionalities

### wallet

Provides a wallet instance.

```javascript
import { wallet } from 'depay-multichain-crypto-wallets'

wallet.type() // 'MetaMask'
await wallet.connect() // ['0x0000000000000000000000000000000000000000']
```

#### type

`type (string)`: Returns wallet type.

```javascript
  wallet.type() // 'MetaMask'
```

#### connect

`async connect (array)`: Connets wallet. Potentially opens wallet connect screen. Provides array of wallet addresses in async return.

```javascript
  await wallet.connect() // ['0x0000000000000000000000000000000000000000']
```

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
