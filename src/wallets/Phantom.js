import WindowSolana from './WindowSolana'

export default class Phantom extends WindowSolana {

  static info = {
    name: 'Phantom',
    logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMjggMTI4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMjggMTI4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0FCOUZGMjt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMy43LDEwOWMxMy42LDAsMjMuOS0xMS45LDMwLTIxLjJjLTAuNywyLjEtMS4yLDQuMS0xLjIsNi4xYzAsNS41LDMuMSw5LjQsOS4zLDkuNGM4LjUsMCwxNy42LTcuNSwyMi4zLTE1LjUKCWMtMC4zLDEuMi0wLjUsMi4yLTAuNSwzLjJjMCwzLjgsMi4xLDYuMiw2LjUsNi4yYzEzLjgsMCwyNy43LTI0LjUsMjcuNy00NS45YzAtMTYuNy04LjQtMzEuNC0yOS42LTMxLjQKCWMtMzcuMiwwLTc3LjMsNDUuNS03Ny4zLDc0LjhDMTEuMSwxMDYuMywxNy4zLDEwOSwyMy43LDEwOXogTTc1LjUsNDkuNWMwLTQuMSwyLjMtNy4xLDUuNy03LjFjMy4zLDAsNS42LDIuOSw1LjYsNy4xCgljMCw0LjEtMi4zLDcuMS01LjYsNy4xQzc3LjgsNTYuNyw3NS41LDUzLjcsNzUuNSw0OS41eiBNOTMuMiw0OS41YzAtNC4xLDIuMy03LjEsNS43LTcuMWMzLjMsMCw1LjYsMi45LDUuNiw3LjEKCWMwLDQuMS0yLjMsNy4xLTUuNiw3LjFDOTUuNSw1Ni43LDkzLjIsNTMuNyw5My4yLDQ5LjV6Ii8+Cjwvc3ZnPgo=',
    blockchains: ['solana']
  }

  static isAvailable = async()=>{
    return (
      window.phantom &&
      !window.glow &&
      !window?.solana?.isGlow &&
      !['isBitKeep'].some((identifier)=>window.solana && window.solana[identifier])
    )
  }
}
