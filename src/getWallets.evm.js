import wallets from './wallets.evm'

const getWallets = ()=>{
  let availableWallets = []

  Object.keys(wallets).forEach((key)=>{
    let wallet = wallets[key]
    if(wallet.isAvailable()) {
      let instance
      if(wallet.getConnectedInstance && wallet.getConnectedInstance()) {
        instance = wallet.getConnectedInstance()
      } else {
        instance = new wallet
      }
      availableWallets.push(instance)
    }
  })

  return availableWallets
}


export default getWallets
