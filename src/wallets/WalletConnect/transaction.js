import { Transaction } from '../../Transaction'
import { Blockchain } from 'depay-web3-blockchains'
import { ethers } from 'ethers'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await executeSubmit({ transaction, wallet }).then((tx)=>{
    transaction.id = tx
    transaction.url = Blockchain.findByName(transaction.blockchain).explorerUrlFor({ transaction })
  })
  return transaction
}

const executeSubmit = ({ transaction, wallet }) => {
  if(transaction.method) {
    return submitContractInteraction({ transaction, wallet })
  } else {
    return submitSimpleTransfer({ transaction, wallet })
  }
}

const submitContractInteraction = async ({ transaction, wallet })=>{
  let contract = new ethers.Contract(transaction.to, transaction.api)

  let populatedTransaction = await contract.populateTransaction[transaction.method].apply(
    null, transaction.getContractArguments({ contract })
  )

  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    data: populatedTransaction.data
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
