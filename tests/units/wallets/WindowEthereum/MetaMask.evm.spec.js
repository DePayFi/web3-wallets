import { ethers } from 'ethers'
import { getWallets } from 'dist/esm/index.evm'
import { mock, resetMocks, trigger } from '@depay/web3-mock'
import { supported as supportedBlockchains } from 'src/blockchains'

describe('MetaMask (evm)', () => {

  supportedBlockchains.evm.forEach((blockchain)=>{

    describe(blockchain, ()=> {

      let wallet

      const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      beforeEach(resetMocks)
      beforeEach(async()=>{
        mock({ blockchain, wallet: 'metamask', accounts: { return: [account] } })
        wallet = (await getWallets())[0]
      })

      it('should detect the wallet type', () => {
        expect(wallet.name).toBe('MetaMask')
      })

      it('provides a connect function', async () => {
        expect(await wallet.connect()).toStrictEqual(ethers.utils.getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'))
      })

      it('provides an account function', async () => {
        expect(await wallet.account()).toStrictEqual(ethers.utils.getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'))
      })

      it('provides an logo', async () => {
        expect(wallet.logo).toStrictEqual("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNDIgMTM3Ij4KICA8cGF0aCBmaWxsPSIjRkY1QzE2IiBkPSJtMTMyLjI0IDEzMS43NTEtMzAuNDgxLTkuMDc2LTIyLjk4NiAxMy43NDEtMTYuMDM4LS4wMDctMjMtMTMuNzM0LTMwLjQ2NyA5LjA3NkwwIDEwMC40NjVsOS4yNjgtMzQuNzIzTDAgMzYuMzg1IDkuMjY4IDBsNDcuNjA3IDI4LjQ0M2gyNy43NTdMMTMyLjI0IDBsOS4yNjggMzYuMzg1LTkuMjY4IDI5LjM1NyA5LjI2OCAzNC43MjMtOS4yNjggMzEuMjg2WiIvPgogIDxwYXRoIGZpbGw9IiNGRjVDMTYiIGQ9Im05LjI3NCAwIDQ3LjYwOCAyOC40NjMtMS44OTMgMTkuNTM0TDkuMjc0IDBabTMwLjQ2OCAxMDAuNDc4IDIwLjk0NyAxNS45NTctMjAuOTQ3IDYuMjR2LTIyLjE5N1ptMTkuMjczLTI2LjM4MUw1NC45ODkgNDguMDFsLTI1Ljc3IDE3Ljc0LS4wMTQtLjAwN3YuMDEzbC4wOCAxOC4yNiAxMC40NS05LjkxOGgxOS4yOFpNMTMyLjI0IDAgODQuNjMyIDI4LjQ2M2wxLjg4NyAxOS41MzRMMTMyLjI0IDBabS0zMC40NjcgMTAwLjQ3OC0yMC45NDggMTUuOTU3IDIwLjk0OCA2LjI0di0yMi4xOTdabTEwLjUyOS0zNC43MjNoLjAwNy0uMDA3di0uMDEzbC0uMDA2LjAwNy0yNS43Ny0xNy43MzlMODIuNSA3NC4wOTdoMTkuMjcybDEwLjQ1NyA5LjkxNy4wNzMtMTguMjU5WiIvPgogIDxwYXRoIGZpbGw9IiNFMzQ4MDciIGQ9Im0zOS43MzUgMTIyLjY3NS0zMC40NjcgOS4wNzZMMCAxMDAuNDc4aDM5LjczNXYyMi4xOTdaTTU5LjAwOCA3NC4wOWw1LjgyIDM3LjcxNC04LjA2Ni0yMC45Ny0yNy40OS02LjgyIDEwLjQ1Ni05LjkyM2gxOS4yOFptNDIuNzY0IDQ4LjU4NSAzMC40NjggOS4wNzYgOS4yNjgtMzEuMjczaC0zOS43MzZ2MjIuMTk3Wk04Mi41IDc0LjA5bC01LjgyIDM3LjcxNCA4LjA2NS0yMC45NyAyNy40OTEtNi44Mi0xMC40NjMtOS45MjNIODIuNVoiLz4KICA8cGF0aCBmaWxsPSIjRkY4RDVEIiBkPSJtMCAxMDAuNDY1IDkuMjY4LTM0LjcyM2gxOS45M2wuMDczIDE4LjI2NiAyNy40OTIgNi44MiA4LjA2NSAyMC45NjktNC4xNDYgNC42MTgtMjAuOTQ3LTE1Ljk1N0gwdi4wMDdabTE0MS41MDggMC05LjI2OC0zNC43MjNoLTE5LjkzMWwtLjA3MyAxOC4yNjYtMjcuNDkgNi44Mi04LjA2NiAyMC45NjkgNC4xNDUgNC42MTggMjAuOTQ4LTE1Ljk1N2gzOS43MzV2LjAwN1pNODQuNjMyIDI4LjQ0M0g1Ni44NzVMNTQuOTkgNDcuOTc3bDkuODM5IDYzLjhINzYuNjhsOS44NDUtNjMuOC0xLjg5My0xOS41MzRaIi8+CiAgPHBhdGggZmlsbD0iIzY2MTgwMCIgZD0iTTkuMjY4IDAgMCAzNi4zODVsOS4yNjggMjkuMzU3aDE5LjkzbDI1Ljc4NC0xNy43NDVMOS4yNjggMFptNDMuOTggODEuNjY1aC05LjAyOWwtNC45MTYgNC44MTkgMTcuNDY2IDQuMzMtMy41MjEtOS4xNTV2LjAwNlpNMTMyLjI0IDBsOS4yNjggMzYuMzg1LTkuMjY4IDI5LjM1N2gtMTkuOTMxTDg2LjUyNiA0Ny45OTcgMTMyLjI0IDBaTTg4LjI3MyA4MS42NjVoOS4wNDJsNC45MTYgNC44MjUtMTcuNDg2IDQuMzM4IDMuNTI4LTkuMTd2LjAwN1ptLTkuNTA3IDQyLjMwNSAyLjA2LTcuNTQyLTQuMTQ2LTQuNjE4SDY0LjgybC00LjE0NSA0LjYxOCAyLjA1OSA3LjU0MiIvPgogIDxwYXRoIGZpbGw9IiNDMEM0Q0QiIGQ9Ik03OC43NjYgMTIzLjk2OXYxMi40NTNINjIuNzM1di0xMi40NTNoMTYuMDNaIi8+CiAgPHBhdGggZmlsbD0iI0U3RUJGNiIgZD0ibTM5Ljc0MiAxMjIuNjYyIDIzLjAwNiAxMy43NTR2LTEyLjQ1M2wtMi4wNi03LjU0MS0yMC45NDYgNi4yNFptNjIuMDMxIDAtMjMuMDA3IDEzLjc1NHYtMTIuNDUzbDIuMDYtNy41NDEgMjAuOTQ3IDYuMjRaIi8+Cjwvc3ZnPgo=")
      })

      it('registers a callback and informs about active connected account changes', async () => {
        let accountChangedTo

        wallet.on('account', (newAccount)=>{
          accountChangedTo = newAccount
        })

        trigger('accountsChanged', ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'])

        expect(accountChangedTo).toEqual(ethers.utils.getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'))
      })

      it('provides the blockchains that are supported by the wallet', () => {
        expect(wallet.blockchains).toEqual(supportedBlockchains.evm)
      })
    })
  })
})
