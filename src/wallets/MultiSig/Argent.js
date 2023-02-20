import { request } from '@depay/web3-client'

export default class Argent {

  constructor ({ address, blockchain }) {
    this.address = address
    this.blockchain = blockchain
  }

  async transactionCount() {
    return 1 // irrelevant as proxy address/relayer actually sending the transaction is not known yet (but needs to be something)
  }
}
