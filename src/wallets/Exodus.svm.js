import logos from '../logos'
import WindowSolana from './WindowSolana'
import { supported } from '../blockchains'

export default class ExodusSVM extends WindowSolana {

  static info = {
    name: 'Exodus',
    logo: logos.exodus,
    blockchains: supported.svm,
    platform: 'svm',
  }

  static isAvailable = async()=>{ return window?.solana?.isExodus }
}
