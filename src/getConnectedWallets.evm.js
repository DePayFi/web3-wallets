import getWallets from './getWallets.evm'

const getConnectedWallets = async()=>{

  let connectedWallets = (await Promise.all(
    getWallets().map(async(wallet)=>{
      if(await wallet.account()) {
        return wallet
      }
    })
  )).filter((value)=>!!value)

  return connectedWallets
}

export default getConnectedWallets
