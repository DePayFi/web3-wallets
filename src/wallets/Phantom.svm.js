import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class PhantomSVM extends WindowSolana {

  static info = {
    name: 'Phantom',
    logo: logos.phantom,
    blockchains: supported.svm,
    platform: 'svm',
  }

  static isAvailable = async()=>{
    return (
      window.phantom &&
      !window.glow &&
      !window?.solana?.isGlow &&
      !window?.solana?.isExodus &&
      ! window?.ethereum?.isMagicEden &&
      ! window?.okxwallet &&
      !['isBitKeep'].some((identifier)=>window.solana && window.solana[identifier])
    )
  }

  getProvider() { 
    return window?.phantom?.solana || window.solana
  }
}
