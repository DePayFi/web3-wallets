import { Transaction } from '../../Transaction'
import { ethers } from 'ethers'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await executeSubmit({ transaction, wallet })
  return transaction
}

const executeSubmit = ({ transaction, wallet }) => {
  if(transaction.method) {
    return submitContractInteraction({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitContractInteraction = ({ transaction, wallet })=>{
  return new Promise(async (resolve, reject)=>{
    let contract = new ethers.Contract(transaction.to, transaction.api)

    let populatedTransaction = await contract.populateTransaction[transaction.method].apply(
      null, transaction.getContractArguments({ contract })
    )

    wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      data: populatedTransaction.data
    })
      .then(()=>resolve(transaction))
      .catch(reject)
  })
}

const submitSimpleTransfer = ({ transaction, wallet })=>{
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value: transaction.value
  })
}

export {
  sendTransaction
}
