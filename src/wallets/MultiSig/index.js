/*#if _EVM

import { request, getProvider } from '@depay/web3-client-evm'

/*#elif _SVM

import { request, getProvider } from '@depay/web3-client-svm'

//#else */

import { request, getProvider } from '@depay/web3-client'

//#endif

import Safe from './Safe'

const isSmartContractWallet = async(blockchain, address)=>{
  const provider = await getProvider(blockchain)
  const code = await provider.getCode(address)
  return (code != '0x')
}

const identifySmartContractWallet = async (blockchain, address)=>{
  let name 
  try {
    name = await request({
      blockchain,
      address,
      api: [{ "constant": true, "inputs": [], "name": "NAME", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function"}],
      method: 'NAME'
    })
  } catch {}
  if(name == 'Default Callback Handler') { return 'Safe' }
  
}

const getSmartContractWallet = async(blockchain, address)=> {
  if(!await isSmartContractWallet(blockchain, address)){ return }

  const type = await identifySmartContractWallet(blockchain, address)
  if(type == 'Safe') {
    return new Safe({ blockchain, address })
  } else if(type == 'Argent') {
    return new Argent({ blockchain, address })
  } else {
    if(smartContractWallet){ throw({ message: 'Unrecognized smart contract wallet not supported!', code: "SMART_CONTRACT_WALLET_NOT_SUPPORTED" }) }
  }
}

export {
  getSmartContractWallet
}
