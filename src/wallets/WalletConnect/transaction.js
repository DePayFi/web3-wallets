import { Blockchain } from 'depay-web3-blockchains'
import { ethers } from 'ethers'
import { Transaction } from '../../Transaction'
import { WalletConnectProvider } from './provider'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    throw({ code: 'WRONG_NETWORK' })
  }
  await executeSubmit({ transaction, wallet }).then(async (tx)=>{
    if (tx) {
      let blockchain = Blockchain.findByName(transaction.blockchain)
      transaction.id = tx
      transaction.url = blockchain.explorerUrlFor({ transaction })
      if (transaction.sent) transaction.sent(transaction)
      let provider = new WalletConnectProvider({ connector: wallet.connector, chainId: blockchain.id })
      let sentTransaction = await provider.getTransaction(tx)
      sentTransaction.wait(1).then(() => {
        transaction._confirmed = true
        if (transaction.confirmed) transaction.confirmed(transaction)
      }).catch((error)=>{
        transaction._failed = true
        if(transaction.failed) transaction.failed(transaction)
      })
      sentTransaction.wait(12).then(() => {
        transaction._ensured = true
        if (transaction.ensured) transaction.ensured(transaction)
      })
    } else {
      throw('Submitting transaction failed!')
    }
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
    value: transaction.value?.toString(),
    data: populatedTransaction.data
  })
}

const submitSimpleTransfer = ({ transaction, wallet })=>{
  return wallet.connector.sendTransaction({
    from: transaction.from,
    to: transaction.to,
    value: transaction.value?.toString()
  })
}

export {
  sendTransaction
}
