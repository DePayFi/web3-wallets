import WalletConnectV2 from '../../../../src/wallets/WalletConnectV2'
import { SignClient } from '@depay/walletconnect-v2'

jest.mock('@depay/walletconnect-v2', () => ({ SignClient: { init: jest.fn() } }))
jest.mock('../../../../src/wallets/MultiSig', () => ({ getSmartContractWallet: jest.fn() }))
jest.mock('../../../../src/wallets/WalletConnectV2/transaction', () => ({ sendTransaction: jest.fn() }))
jest.mock('@depay/web3-client', () => ({ request: jest.fn() }))

describe('WalletConnect V2 method negotiation', () => {
  const account = '0x0000000000000000000000000000000000000001'
  const methods = ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4']
  let client
  let wallet

  beforeEach(() => {
    localStorage.clear()
    delete window.getSignClientPromise
    client = {
      on: jest.fn(),
      request: jest.fn().mockResolvedValue('0x1234'),
      connect: jest.fn(async ({ requiredNamespaces }) => {
        // A v4-only wallet must not have to advertise the legacy typed-data method.
        const unsupported = requiredNamespaces.eip155.methods.filter(method => !methods.includes(method))
        if (unsupported.length) throw new Error('Unsupported required methods')
        return {
          uri: 'wc:test-pairing-uri',
          approval: async () => ({
            topic: 'test-session',
            namespaces: { eip155: {
              accounts: [`eip155:1:${account}`],
              methods: requiredNamespaces.eip155.methods,
              events: requiredNamespaces.eip155.events,
            } },
          }),
        }
      }),
    }
    SignClient.init.mockResolvedValue(client)
    wallet = new WalletConnectV2()
  })

  afterEach(() => {
    delete window.getSignClientPromise
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('connects a v4-only wallet and passes its pairing URI to the caller', async () => {
    const connect = jest.fn()
    await expect(wallet.connect({ name: 'Oath Wallet', connect })).resolves.toBe(account)
    expect(connect).toHaveBeenCalledWith({ uri: 'wc:test-pairing-uri' })
    const proposal = client.connect.mock.calls[0][0]
    expect(proposal.requiredNamespaces.eip155).toEqual({
      chains: ['eip155:1'], methods, events: ['accountsChanged'],
    })
    expect(proposal.optionalNamespaces.eip155.methods).toEqual(methods)
    expect(proposal.optionalNamespaces.eip155.chains).toContain('eip155:1')
  })

  it('keeps typed-data signing on the negotiated v4 method', async () => {
    await wallet.connect({ name: 'Oath Wallet' })
    const message = { domain: { chainId: 1 }, types: {}, primaryType: 'Example', message: {} }
    await expect(wallet.sign(message)).resolves.toBe('0x1234')
    expect(client.request).toHaveBeenCalledWith({
      topic: 'test-session', chainId: 'eip155:1',
      request: { method: 'eth_signTypedData_v4', params: [account, JSON.stringify(message)] },
    })
  })

  it('keeps plain-text signing on personal_sign', async () => {
    await wallet.connect({ name: 'Oath Wallet' })
    await expect(wallet.sign('hello')).resolves.toBe('0x1234')
    expect(client.request).toHaveBeenCalledWith({
      topic: 'test-session', chainId: 'eip155:1',
      request: { method: 'personal_sign', params: ['0x68656c6c6f', account] },
    })
  })
})
