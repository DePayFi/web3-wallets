import WindowEthereum from './WindowEthereum'

export default class Trust extends WindowEthereum {

  static info = {
    name: 'Trust',
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA5Ni41IDk2LjUiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDk2LjUgOTYuNSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgZmlsbD0iI0ZGRkZGRiIgd2lkdGg9Ijk2LjUiIGhlaWdodD0iOTYuNSIvPgo8cGF0aCBzdHJva2U9IiMzMzc1QkIiIHN0cm9rZS13aWR0aD0iNi4wNjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQgPSIxMCIgZmlsbD0ibm9uZSIgZD0ibTQ4LjUgMjAuMWM5LjYgOCAyMC42IDcuNSAyMy43IDcuNS0wLjcgNDUuNS01LjkgMzYuNS0yMy43IDQ5LjMtMTcuOC0xMi44LTIzLTMuNy0yMy43LTQ5LjMgMy4yIDAgMTQuMSAwLjUgMjMuNy03LjV6Ii8+Cjwvc3ZnPgo=",
    blockchains: ['ethereum', 'bsc', 'polygon', 'velas']
  }

  static isAvailable = ()=>{ return (window?.ethereum?.isTrust || window?.ethereum?.isTrustWallet) }
}
