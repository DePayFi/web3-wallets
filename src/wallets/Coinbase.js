import Web3Wallet from './Web3Wallet'

export default class Coinbase extends Web3Wallet {
  name = 'Coinbase Wallet'
  logo =
    "data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 488.96 488.96'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:url(%23linear-gradient);%7D.cls-2%7Bfill:%234361ad;%7D%3C/style%3E%3ClinearGradient id='linear-gradient' x1='250' y1='7.35' x2='250' y2='496.32' gradientTransform='matrix(1, 0, 0, -1, 0, 502)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%233d5ba9'/%3E%3Cstop offset='1' stop-color='%234868b1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath class='cls-1' d='M250,5.68C114.87,5.68,5.52,115,5.52,250.17S114.87,494.65,250,494.65,494.48,385.29,494.48,250.17,385.13,5.68,250,5.68Zm0,387.54A143.06,143.06,0,1,1,393.05,250.17,143.11,143.11,0,0,1,250,393.22Z' transform='translate(-5.52 -5.68)'/%3E%3Cpath class='cls-2' d='M284.69,296.09H215.31a11,11,0,0,1-10.9-10.9V215.48a11,11,0,0,1,10.9-10.91H285a11,11,0,0,1,10.9,10.91v69.71A11.07,11.07,0,0,1,284.69,296.09Z' transform='translate(-5.52 -5.68)'/%3E%3C/svg%3E"
  blockchains = ['ethereum', 'bsc']
  install = 'https://wallet.coinbase.com'
}
