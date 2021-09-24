import { ethers } from 'ethers'

const sendTransaction = ({ wallet, transaction })=> {
  return new Promise(async (resolve, reject)=>{
    let provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    let signer = provider.getSigner(0)

    if(await wallet.connectedTo(transaction.blockchain)) {
      executeSubmit({ transaction, provider, signer, resolve, reject })
    } else { // connected to wrong network
      wallet.switchTo(transaction.blockchain)
        .then(()=>{
          executeSubmit({ transaction, provider, signer, resolve, reject })
        })
        .catch(reject)
    }
  })
}

const executeSubmit = ({ transaction, provider, signer, resolve, reject }) => {
  if(transaction.method) {
    submitContractInteraction({ transaction, signer, provider })
      .then(()=>resolve(transaction))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  } else {
    submitSimpleTransfer({ transaction, signer })
      .then(()=>resolve(transaction))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  }
}

const submitContractInteraction = ({ transaction, signer, provider })=>{
  let contract = new ethers.Contract(transaction.to, transaction.api, provider)
  return contract
    .connect(signer)
    [transaction.method](...argsFromTransaction({ transaction, contract }), {
      value: transaction.value ? ethers.BigNumber.from(transaction.value.toString()) : undefined
    })
}

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
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
