import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'ethers'

export default (value, blockchain) => {
  if (typeof value === 'number') {
    return ethers.utils.parseUnits(value.toString(), CONSTANTS[blockchain].DECIMALS)
  } else if (value && value.toString) {
    return ethers.BigNumber.from(value.toString())
  } else {
    return value
  }
}
