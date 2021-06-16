let chainIdToNetworkName = function(chainId){
  switch(chainId){

    case '0x01':
    case '0x1':
      return 'ethereum'
    break
    
    case '0x38':
      return 'bsc'
    break

    case '0x89':
      return 'polygon'
    break
  }

}

export { chainIdToNetworkName }
