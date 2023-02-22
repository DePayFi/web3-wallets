import wallets from './wallets.evm'

const getWallets = async()=>{

  let availableWallets = await Promise.all(
    Object.keys(wallets).map(
      async(key)=>{
      
        let wallet = wallets[key]

        if(wallet.isAvailable()) {
          let instance
          
          if(wallet.getConnectedInstance) {
            instance = await wallet.getConnectedInstance()
            return instance
          } else {
            return new wallet
          }          
        }
      }
    )
  )

  return availableWallets.filter((wallet)=>wallet)
}

export default getWallets
