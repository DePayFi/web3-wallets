import wallets from './wallets'

let instances = {}

const getWallets = ()=>{
  let availableWallets = []

  Object.keys(wallets).forEach((key)=>{
    let wallet = wallets[key]
    if(wallet.isAvailable()) {
      if(!instances[wallet]) {
        if(wallet.getConnectedInstance && wallet.getConnectedInstance()) {
          instances[wallet] = wallet.getConnectedInstance()
        } else {
          instances[wallet] = new wallet
        }
      }
      availableWallets.push(instances[wallet])
    }
  })

  return availableWallets
}


export default getWallets
