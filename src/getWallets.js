import wallets from './wallets'

const getWallets = async(args)=>{

  let drip = (args && typeof args.drip === 'function') ? args.drip : undefined

  let availableWallets = await Promise.all(
    
    Object.keys(wallets).map(
      
      async(key)=>{
      
        let wallet = wallets[key]

        if(await wallet.isAvailable()) {
          let instance
          
          if(wallet.getConnectedInstance) {
            instance = await wallet.getConnectedInstance()
            if(drip) { drip(instance) }
            return instance
          } else {
            if(drip) { drip(wallet) }
            return new wallet
          }
        }
      }
    )
  )

  return availableWallets.filter(Boolean)
}

export default getWallets
