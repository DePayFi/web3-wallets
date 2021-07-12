let apiKey = undefined

function setApiKey(key) {
  apiKey = key
}

function getApiKey() {
  if (apiKey === undefined) {
    throw 'CryptoWallets: No apiKey set. Please set an apiKey with setApiKey (see documentation)!'
  }
  return apiKey
}

export { setApiKey, getApiKey }
