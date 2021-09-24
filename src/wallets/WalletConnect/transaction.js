import { ethers } from 'ethers'

const sendTransaction = ({ wallet, transaction })=> {
  return new Promise(async (resolve, reject)=>{
    transaction.from = await wallet.account()
    if(await wallet.connectedTo(transaction.blockchain)) {
      executeSubmit({ transaction, wallet, resolve, reject })
    } else { // connected to wrong network
      reject({ code: 'WRONG_NETWORK' })
    }
  })
}

const executeSubmit = ({ transaction, wallet, resolve, reject }) => {
  if(transaction.method) {
    submitContractInteraction({ transaction, wallet })
      .then(()=>resolve(transaction))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  } else {
    submitSimpleTransfer({ transaction, wallet })
      .then(()=>resolve(transaction))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  }
}

const submitContractInteraction = ({ transaction, wallet })=>{
  return new Promise(async (resolve, reject)=>{
    let contract = new ethers.Contract(transaction.to, transaction.api)

    let populatedTransaction = await contract.populateTransaction[transaction.method].apply(null, argsFromTransaction({ transaction, contract }))

    wallet.connector.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      value: transaction.value ? ethers.BigNumber.from(transaction.value.toString()) : undefined,
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
    value: transaction.value ? ethers.BigNumber.from(transaction.value.toString()) : undefined
  })
}

const argsFromTransaction = ({ transaction, contract })=> {
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == transaction.method
  })

  if(transaction.params instanceof Array) {
    return transaction.params
  } else if (transaction.params instanceof Object) {
    return fragment.inputs.map((input) => {
      return transaction.params[input.name]
    })
  } else {
    throw 'Web3Transaction: params have wrong type!'
  }
}

export {
  sendTransaction
}
