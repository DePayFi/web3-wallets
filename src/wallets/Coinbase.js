import Web3Wallet from './Web3Wallet'

export default class Coinbase extends Web3Wallet {
  name = 'Coinbase Wallet'
  logo =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3C!-- Generator: Adobe Illustrator 23.0.6, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 150 150' style='enable-background:new 0 0 150 150;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:url(%23SVGID_1_);%7D .st1%7Bfill:%232059EB;%7D %3C/style%3E%3Cg id='Layer_1'%3E%3C/g%3E%3Cg id='Layer_5'%3E%3Cg%3E%3ClinearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='75' y1='149' x2='75' y2='1'%3E%3Cstop offset='0' style='stop-color:%231447EA'%3E%3C/stop%3E%3Cstop offset='1' style='stop-color:%232B65FB'%3E%3C/stop%3E%3C/linearGradient%3E%3Cpath class='st0' d='M75,1C34.1,1,1,34.1,1,75s33.1,74,74,74s74-33.1,74-74S115.9,1,75,1z M75,118.3c-23.9,0-43.3-19.4-43.3-43.3 S51.1,31.7,75,31.7s43.3,19.4,43.3,43.3S98.9,118.3,75,118.3z'%3E%3C/path%3E%3Cpath class='st1' d='M85.5,88.9H64.5c-1.8,0-3.3-1.5-3.3-3.3V64.5c0-1.8,1.5-3.3,3.3-3.3h21.1c1.8,0,3.3,1.5,3.3,3.3v21.1 C88.9,87.4,87.4,88.9,85.5,88.9z'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E "
  blockchains = ['ethereum', 'bsc']
  install = 'https://wallet.coinbase.com'
}
