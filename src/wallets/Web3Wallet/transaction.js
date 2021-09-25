import { Transaction } from '../../Transaction'
import { ethers } from 'ethers'

const sendTransaction = async ({ transaction, wallet })=> {
  transaction = new Transaction(transaction)
  await transaction.prepare({ wallet })
  let provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  let signer = provider.getSigner(0)
  if((await wallet.connectedTo(transaction.blockchain)) == false) {
    await wallet.switchTo(transaction.blockchain)
  }
  await executeSubmit({ transaction, provider, signer })
  return transaction
}

const executeSubmit = ({ transaction, provider, signer }) => {
  if(transaction.method) {
    return submitContractInteraction({ transaction, signer, provider })
  } else {
    return submitSimpleTransfer({ transaction, signer })
  }
}

const submitContractInteraction = ({ transaction, signer, provider })=>{
  let contract = new ethers.Contract(transaction.to, transaction.api, provider)
  return contract
    .connect(signer)
    [transaction.method](...transaction.getContractArguments({ contract }), {
      value: transaction.value
    })
}

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
    to: transaction.to,
    value: transaction.value
  })
}

export {
  sendTransaction
}
