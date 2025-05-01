// https://github.com/worldcoin/minikit-js/blob/main/packages/core/helpers/siwe/siwe.ts
const generateSiweMessage = (siweMessageData) => {
  let siweMessage = ''

  if (siweMessageData.scheme) {
    siweMessage += `${siweMessageData.scheme}://${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`
  } else {
    siweMessage += `${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`
  }

  // NOTE: This differs from the ERC-4361 spec where the address is required
  if (siweMessageData.address) {
    siweMessage += `${siweMessageData.address}\n`
  } else {
    siweMessage += '{address}\n'
  }
  siweMessage += '\n'

  if (siweMessageData.statement) {
    siweMessage += `${siweMessageData.statement}\n`
  }

  siweMessage += '\n'

  siweMessage += `URI: ${siweMessageData.uri}\n`
  siweMessage += `Version: ${siweMessageData.version}\n`
  siweMessage += `Chain ID: ${siweMessageData.chain_id}\n`
  siweMessage += `Nonce: ${siweMessageData.nonce}\n`
  siweMessage += `Issued At: ${siweMessageData.issued_at}\n`

  if (siweMessageData.expiration_time) {
    siweMessage += `Expiration Time: ${siweMessageData.expiration_time}\n`
  }

  if (siweMessageData.not_before) {
    siweMessage += `Not Before: ${siweMessageData.not_before}\n`
  }

  if (siweMessageData.request_id) {
    siweMessage += `Request ID: ${siweMessageData.request_id}\n`
  }

  return siweMessage
};

// https://github.com/worldcoin/minikit-js/blob/main/packages/core/helpers/transaction/validate-payload.ts
const isValidHex = (str) => {
  return /^0x[0-9A-Fa-f]+$/.test(str)
}
const processTransactionPayload = (payload) => {
  // Handle primitives directly
  if (
    typeof payload === 'boolean' ||
    typeof payload === 'string' ||
    payload === null ||
    payload === undefined
  ) {
    return payload
  }

  // Convert numbers to strings to prevent overflow issues
  if (typeof payload === 'number' || typeof payload === 'bigint') {
    return String(payload)
  }

  // Handle arrays by processing each element
  if (Array.isArray(payload)) {
    return payload.map((value) => processTransactionPayload(value))
  }

  // Handle objects
  if (typeof payload === 'object') {
    const result = { ...payload }

    // Special handling for transaction value fields
    if ('value' in result && result.value !== undefined) {
      // Ensure it's a string
      if (typeof result.value !== 'string') {
        result.value = String(result.value)
      }

      if (!isValidHex(result.value)) {
        console.error(
          'Transaction value must be a valid hex string',
          result.value,
        )
        throw new Error(
          `Transaction value must be a valid hex string: ${result.value}`,
        )
      }
    }

    // Process all object properties recursively
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = processTransactionPayload(result[key])
      }
    }

    return result
  }

  // Fallback for any other types
  return payload
};

// https://github.com/worldcoin/minikit-js/blob/main/packages/core/helpers/send-webview-event.ts
const sendMiniKitEvent = function(payload) {
  if (window.webkit) {
    if (
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.minikit &&
      window.webkit.messageHandlers.minikit.postMessage
    ) {
      window.webkit.messageHandlers.minikit.postMessage(payload)
    }
  } else if (window.Android && window.Android.postMessage) {
    window.Android.postMessage(JSON.stringify(payload))
  }
}

// https://github.com/worldcoin/minikit-js/blob/main/packages/core/types/commands.ts
let Command = {
  "Verify": 'verify',
  "Pay": 'pay',
  "WalletAuth": 'wallet-auth',
  "SendTransaction": 'send-transaction',
  "SignMessage": 'sign-message',
  "SignTypedData": 'sign-typed-data',
  "ShareContacts": 'share-contacts',
  "RequestPermission": 'request-permission',
  "GetPermissions": 'get-permissions',
  "SendHapticFeedback": 'send-haptic-feedback',
  "ShareFiles": 'share-files',
}

// https://github.com/worldcoin/minikit-js/blob/main/packages/core/types/responses.ts
let ResponseEvent = {
  "MiniAppVerifyAction": "miniapp-verify-action",
  "MiniAppPayment": "miniapp-payment",
  "MiniAppWalletAuth": "miniapp-wallet-auth",
  "MiniAppSendTransaction": "miniapp-send-transaction",
  "MiniAppSignMessage": "miniapp-sign-message",
  "MiniAppSignTypedData": "miniapp-sign-typed-data",
  "MiniAppShareContacts": "miniapp-share-contacts",
  "MiniAppRequestPermission": "miniapp-request-permission",
  "MiniAppGetPermissions": "miniapp-get-permissions",
  "MiniAppSendHapticFeedback": "miniapp-send-haptic-feedback",
  "MiniAppShareFiles": "miniapp-share-files",
}

// https://github.com/worldcoin/minikit-js/blob/main/packages/core/index.ts
// https://github.com/worldcoin/minikit-js/blob/main/packages/core/minikit.ts

class MiniKit {

  static MINIKIT_VERSION = 1;

  static miniKitCommandVersion = {
    [Command.Verify]: 1,
    [Command.Pay]: 1,
    [Command.WalletAuth]: 1,
    [Command.SendTransaction]: 1,
    [Command.SignMessage]: 1,
    [Command.SignTypedData]: 1,
    [Command.ShareContacts]: 1,
    [Command.RequestPermission]: 1,
    [Command.GetPermissions]: 1,
    [Command.SendHapticFeedback]: 1,
    [Command.ShareFiles]: 1,
  }

  static listeners = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
    [ResponseEvent.MiniAppWalletAuth]: () => {},
    [ResponseEvent.MiniAppSendTransaction]: () => {},
    [ResponseEvent.MiniAppSignMessage]: () => {},
    [ResponseEvent.MiniAppSignTypedData]: () => {},
    [ResponseEvent.MiniAppShareContacts]: () => {},
    [ResponseEvent.MiniAppRequestPermission]: () => {},
    [ResponseEvent.MiniAppGetPermissions]: () => {},
    [ResponseEvent.MiniAppSendHapticFeedback]: () => {},
    [ResponseEvent.MiniAppShareFiles]: () => {},
  }

  static appId = null
  static user = {}
  static isReady = false

  static install(appId) {

    if (typeof window === "undefined" || Boolean(window.MiniKit)) {
      return {
        success: false,
        errorCode: 'already_installed',
        errorMessage: 'MiniKit is already installed.'
      }
    }

    if (!appId) {
      console.warn("App ID not provided during install")
    } else {
      MiniKit.appId = appId
    }

    if (!window.WorldApp) {
      return {
        success: false,
        errorCode: 'outside_of_worldapp',
        errorMessage: 'MiniApp launched outside of WorldApp.'
      }
    }

    // Set user properties
    MiniKit.user.optedIntoOptionalAnalytics = window.WorldApp.is_optional_analytics
    MiniKit.user.deviceOS = window.WorldApp.device_os
    MiniKit.user.worldAppVersion = window.WorldApp.world_app_version

    try {
      window.MiniKit = MiniKit
      this.sendInit()
    } catch (error) {
      console.error(
        'Failed to install MiniKit.',
        error
      )

      return {
        success: false,
        errorCode: 'unknown',
        errorMessage: 'Failed to install MiniKit.'
      }
    }

    MiniKit.isReady = true
    return { success: true }
  }

  static sendInit() {
    sendMiniKitEvent({
      command: 'init',
      payload: { version: this.MINIKIT_VERSION },
    })
  }

  static subscribe(event, handler) {
    if (event === ResponseEvent.MiniAppWalletAuth) {
      const originalHandler = handler;
      const wrappedHandler = async (payload) => {
        if (payload.status === 'success') {
          MiniKit.user.walletAddress = payload.address
        }
        originalHandler(payload)
      }
      this.listeners[event] = wrappedHandler
    } else if (event === ResponseEvent.MiniAppVerifyAction) {
      const originalHandler = handler
      const wrappedHandler = (payload) => {
        originalHandler(payload)
      }
      this.listeners[event] = wrappedHandler
    } else {
      this.listeners[event] = handler
    }
  }

  static unsubscribe(event) {
    delete this.listeners[event]
  }

  static trigger(event, payload) {
    if (!this.listeners[event]) {
      console.error(
        `No handler for event ${event}, payload: ${JSON.stringify(payload)}`
      )
      return
    }
    this.listeners[event](payload)
  }

  static commands = {

    walletAuth: (payload) => {

      let protocol = null
      try {
        const currentUrl = new URL(window.location.href)
        protocol = currentUrl.protocol.split(':')[0]
      } catch (error) {
        console.error('Failed to get current URL', error)
        return null
      }

      const siweMessage = generateSiweMessage({
        scheme: protocol,
        domain: window.location.host,
        statement: payload.statement ?? undefined,
        uri: window.location.href,
        version: '1',
        chain_id: 480,
        nonce: payload.nonce,
        issued_at: new Date().toISOString(),
        expiration_time: payload.expirationTime?.toISOString(),
        not_before: payload.notBefore?.toISOString(),
        request_id: payload.requestId ?? undefined,
      })

      const walletAuthPayload = { siweMessage }
      sendMiniKitEvent({
        command: Command.WalletAuth,
        version: this.miniKitCommandVersion[Command.WalletAuth],
        payload: walletAuthPayload,
      })

      return walletAuthPayload
    },

    sendTransaction: (payload) => {

      const validatedPayload = processTransactionPayload(payload)

      sendMiniKitEvent({
        command: Command.SendTransaction,
        version: this.miniKitCommandVersion[Command.SendTransaction],
        payload: validatedPayload,
      })

      return validatedPayload
    },

    signMessage: (payload) => {

      sendMiniKitEvent({
        command: Command.SignMessage,
        version: this.miniKitCommandVersion[Command.SignMessage],
        payload,
      })

      return payload
    },
  };
}

export {
  MiniKit,
  ResponseEvent
}
