import wallets from './wallets'

const getWallets = async(args)=>{

  let drip = (args && typeof args.drip === 'function') ? args.drip : undefined

  // eip6963
  window['_eip6963Providers'] = {}
  const announceProvider = (event)=>{
    if(event?.detail?.info?.uuid) {
      window['_eip6963Providers'][event?.detail?.info?.uuid] = event.detail.provider
    }
  }
  window.addEventListener("eip6963:announceProvider", announceProvider)
  window.dispatchEvent(new Event("eip6963:requestProvider"))
  window.removeEventListener("eip6963:announceProvider", announceProvider)

  let availableWallets = await Promise.all(
    
    Object.keys(wallets).map(
      
      async(key)=>{
      
        let wallet = wallets[key]

        if(await wallet.isAvailable()) {
          let instance
          
          if(wallet.getConnectedInstance) {
            instance = await wallet.getConnectedInstance()
            if(drip && instance) { drip(instance) }
            return instance
          } else {
            if(drip && wallet) { drip(wallet) }
            return new wallet
          }
        }
      }
    )
  )

  return availableWallets.filter(Boolean)
}

export default getWallets
