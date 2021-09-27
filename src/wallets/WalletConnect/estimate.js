import { Transaction } from '../../Transaction'
import { ethers } from 'ethers'

const estimate = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  let from = await wallet.account()
  let contract = new ethers.Contract(transaction.to, transaction.api)
  let populatedTransaction = await contract.populateTransaction[transaction.method].apply(
    null, transaction.getContractArguments({ contract })
  )
  return wallet.connector.sendCustomRequest({
    method: 'eth_estimateGas',
    params: [{
      from,
      to: transaction.to,
      value: transaction.value?.toString(),
      data: populatedTransaction.data
    }]
  })
}

export {
  estimate
}
