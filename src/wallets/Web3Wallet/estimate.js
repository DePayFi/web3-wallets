import { Transaction } from '../../Transaction'
import { ethers } from 'ethers'

const estimate = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    await wallet.switchTo(transaction.blockchain)
  }
  let provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  let signer = provider.getSigner(0)
  let contract = new ethers.Contract(transaction.to, transaction?.api, provider)
  return contract.connect(signer).estimateGas[transaction.method](...transaction.getContractArguments({ contract }))
}

export {
  estimate
}
