import wallets from './wallets'

let instances = {}

const getWallets = ()=>{
  let availableWallets = []

  Object.keys(wallets).forEach((key)=>{
    let wallet = wallets[key]
    if(wallet.isAvailable()) {
      if(!instances[wallet]) {
        instances[wallet] = new wallet
      }
      availableWallets.push(instances[wallet])
    }
  })

  return availableWallets
}


export default getWallets
