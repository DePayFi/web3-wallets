'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Wallet {constructor() { Wallet.prototype.__init.call(this);Wallet.prototype.__init2.call(this); }

  __init() {this.name = undefined;}
  __init2() {this.logo = undefined;}

  async account() {
    return
  }

  async accounts() {
    return
  }

  on(event, callback) {
    return
  }
}

let chainIdToNetworkName = function (chainId) {
  switch (chainId) {
    case '0x01':
    case '0x1':
      return 'ethereum'

    case '0x38':
      return 'bsc'

    case '0x89':
      return 'polygon'
  }
};

class EthereumWallet extends Wallet {constructor(...args) { super(...args); EthereumWallet.prototype.__init.call(this);EthereumWallet.prototype.__init2.call(this); }
  
  __init() {this.name = 'unknown';}
  __init2() {this.logo = 'data:image/png;base64,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';}

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
        window.ethereum.on('chainChanged', (chainId) => callback(chainIdToNetworkName(chainId)));
      break
    }
  }
}

class EthereumWallet$1 extends Wallet {constructor(...args) { super(...args); EthereumWallet$1.prototype.__init.call(this);EthereumWallet$1.prototype.__init2.call(this); }
  
  __init() {this.name = 'unknown';}
  __init2() {this.logo = 'data:image/png;base64,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';}

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
        window.ethereum.on('chainChanged', (chainId) => callback(chainIdToNetworkName(chainId)));
      break
    }
  }
}

class MetaMask extends EthereumWallet$1 {constructor(...args) { super(...args); MetaMask.prototype.__init.call(this);MetaMask.prototype.__init2.call(this); }

  __init() {this.name = 'MetaMask';}
  __init2() {this.logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAclBMVEVHcEyBTif0snbypF3nhijulD7cq4Hv1b/wrW3dvqSieVvWyL2PXjvJuazndgD5hQB3PQ/PYQDkdADCrp3YwrPsegAVFRZyOg7ZawDzgQD/iQAeMklxNQMMDQ+3XwiLRw2hVAyCdmxPQz7dqoAyKiSgkoj9gMFYAAAADnRSTlMA8X2g78dnGzZPp57O1Hi2/psAAApFSURBVHja7Z2LVqM6FIZ7pUUrtbQRqEyLHX3/Vzy5soHcICSd41r5z3EcFUL+7m/vXKDOIioqKioqKioqKioqKioqKioqKioqKurXKnlJd4t/rB3uxGKuXur7Zr1f/EPt15t7/TK3ld2yKN5vaLv6R2HZrbbo9l4Uy7nXT+t33EyTZ5ttsls8Wbtku8nypihwH9LZZL1jFfcS5fmTEcNI5XlW3gvSg/plNlnvRASvDDf7NMQwUuR6GCvegeVuNllYDC+UkbafgNguwS6wEMWKqU49kPUu8MqwleCIUaRyEo7TndmYz5YgC/DCYogF8kKRYj4ygZUHtjhZPbywQiEmkBJYvfeunvohi+N1QhkXQSxdeFTKkBpg5YUtQZaMl3fEMFLUwRArP2wBWTJePhEDpDL6gUqOlS+2OFlqvLwhJpASVgArX2wJsmS8qAMviAFSGTXRxcobW5wsWQKvIWIzqpT4rMSqHRN9kqXESwyUqSNSGf2jh5VHtgRZOrzACnjBiI3Uatt3MahWPtlKWZNavMiMRfZSHUepkmxkBKtuOLzVLSDLjhc4QeOMIAETWAGs/LIlyLLgJWmcEdLxYUQajpVnthJjQGBCPFQ1lqy+lT5WPuvWC23XFpQTcmILiTDwP2EF5Z8tGhG7k0bCayRZEJF2BWU3kvgcDi14jalbFSDVxSoMWvpklyfEU9lCeadedbEKkeyLg611mBBnaFK6V1l3xt5iZb/SIcQ4MsBrCltIpHnWxSpQrotsn46Xna1MtYIKlet4N0PfomW9VdlTPZtQrUB775NGA172kCB5YR4y13G2E7ac8LKSBSuoCaoP3tcjNrwqI1nD/Z7AuS6yfSJedrbQAKvQuS6y3Qkv8yDSwyp4rpNsnxISWM6bh5KqXZhPDQjJ9WdkO6y3jGyhLlZPyXWW7Y54VfqAAFZPynWR7U54IW1AMgVW4aa+ItvJJZ3w0kaEYeUU6RnbzHRsd8NL46SajBWM6x5vK0y47O2q8nG9MRvPTRGeJI55oo5Ih6tnDYdEqbOPe642Uro7SefcuHCOh24koTMsN9Hh8JlDIkkQ7SwF/4A4eepwSNDCZct1wqWZaLG9Bpeilc7I9elXhE27SmcEz1Dc2k3ciy+5nstU3myEbDi4tOxcgPeH2sGHcXFVsZ+h3MFJfdg7F62XYuL1YIsrVxvJuZPJKV8UL7MeBFwW09PcbmR6yhfLxMfzWlPS3G4EnDxpgoLZOtTTllS2LWAERiYur+rDbs4wUk8sV2ONOBSvesZAktTFtMX6NCPZpPlKUSdzJo31lFnJVCNT5iv1rEnjYr+sx5arSUYmp3y9FIOI86A49laig5Hx85XiMPtxKlv9LfCYSdJ8uhFIedJI0OpLZykWF/fmVBIfsjSzeIWT8tTccVOB5id8PWIOxa2srldsw8kIWLleq/JGAxNoPULKliEU2fF6FbjIqnRzRhWGpKWMBSZE0SJO5IZ5KI5X0bl5RuDYNjCKcjL7OdCkloBqbjm+Jty2mW+krQyk3fzWkMv420KRyxZuHQOF8NW6dchHRKgT8IJODQ6Mr8ewwUk/t+1dg+mvPPm12u5D5uWtCjAFhtyWBwY/RuRhB7K/Psx+IFfc8GlDIfvwFZHWiRwYXz4Wi1XrQmbel5EWLtmLh0TnWhvuPhle4vnHM60XnrTb6H34M6J3svGFVqq9P5v5NKK/Xzd7MBRkVbonGPwayTVOKk9s6ciqTlhlq84jWEwqI6LLreB80loVlK1Ul4T5SaPyRJ0pziDfJz9XKz8GZaslSy6mJ5NKxW0e4wmkYAdkqyVLhbxPI4anDDYLD0qNj5WYOiafYDqcpnpItoAsVfLmk0gxHU2LQ0i2KFn6kSSfYKQyHExHkZBspZan+vROoGfgW1uv2LATkq1VZX6CV4pJKT6bjJQDH9an7laLudraHrRkTsDG8rEszUbK+2N5K7s+7A90bhdByWIhASflbfn5+fkQVUhX5R74oI6Vks+zgrKFybKFBJxgG1R30kf8nJx8LDmwbNhRj+bEQ8cDEpSt7XFMSGgHmwftHw2JzkjGAyKsUB88IEHZ2kNLlsXV7fEJakrcP6WRkgWktXIb/Q6H/TyyRrwXhK9r89uyExK9EQgISXk8tox8P9MqLFmicOF9R7y6PgkvjRgZ5FGnaV0gfAoxwo4MytZu1Bu/aETafcLm8cDd1Bt50OQo8bHsbD6GhGXLRhb0T3SFBAbdlph9tZHshkOR4YPal6F1XGn/Zx+rwGSxGRcabOFkSF1+UTbYWqrwihJ/CsvW7jhOik5fK42Rq+5cu9wXvMnYN94qMNIYqRS48RMM7fMxMTBZtDeyEXWOVKZTK9WHB7Z2x9FSrIrURhRrs3FBn8NWMt4IQpYowbfkM9vXPdR8a30cL3cjVdvPzqeq/UvX5tb79oni1ZK/ozKiOKz3RZC6lRwdZDdiP9H3fCtBWmWdnVK+V1qNKAAo071zDDfTKkO6/1DiiFauk2ITQTFCIPk71n0VOm3WyXUPeG3YOy9V+1J2I/Z9sdKwW791Lb+m+0uqDZ2q/2pLRoYHqDaTTNdcuQ6I+OTRIWnvb9iNwNiPzxkdEHzs3nmKkpudyB2ozEZ6X6ibCUAWXo4Yb/kNeiAvvuXtoF4pVhkxXnDtvqmVjYarhNtnRiOAlboVk5F0xgZ2PtZJ2b8RaJ/3qxsxiBdf/wW4D1fveV77rF/XSBiyoADbQ9I5sK3DV0ngAw62BAQOTObsomRjneTSfeYrak4DNegqsIJjLT5AlKwgBbjbC+mO+fX0/edjoD/fpysezDVN4O+HKb68AI8LyfDXbG02H5KPD/ytzSYfNNkLSIBhnWlPG7E7KQc2/l5+iA/Zyc/lL7Mit2ARLb6hCnBLRjmwcbl8qY184R/93SiM2K7D7iKGKsBtP8q+DbORC42K3ECw4kuU5qPgKjs2mB5qIw/2U7AC54crvnx1ZbtEC0aecRt2I2AFzg82rANb9pDk3AboW23km/8YrOQ8ICGLryjAdif5wMbl/P2h1Pf50rOCaWQ+ghZfUYDtcAkbYORDI2EErJB4WjX77SNkcLeHZGjjAsOIPJBchlbK7Alk2djKCVTr1/NoI1/DI8+va/qrWQOTZSzAxAT7BbnpeWDl649GXwMb55Twu1pviJkQaypbAc7pb/lt/yWM9K1v5fH9pdT3o2/jLRWX2bPfTx6o+EIBlnnq/37f3du5a+Xr56zS5acTEfz1W7+NhAXG+7AuVldDF5QnSa+sq9BLtZXuAa/yK40DQ3Y4/Q7r7eqqx9Oa8aRzctb6kH78qrlg2kt/fHkvZNECDDwpCzokCpXNCPvLmymD95wyb8WXFWDOk/Ufudm98t6ajOAPJVY6yvwUX769te2lti0odsnh0FM2e00F6vFkD4pRcjisgfGT6j15Csqbt5c4rHav/sLxj/Vq9LH4Rdq9abH6PeHgQVHrV4UjKioqKioqKioqKioqKioqKioqKioqKirq/6z/AMhLOEXbTKvCAAAAAElFTkSuQmCC';}

}

let getWallet = function () {
  if (typeof window.ethereum !== 'undefined') {
    if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
      return new MetaMask()
    } else {
      return new EthereumWallet()
    }
  }

  return new Wallet()
};

exports.getWallet = getWallet;
