'use client'

import { createContext, useContext } from 'react'
import { Chain, Hex } from 'viem'

export type WalletProviderMode = 'wagmi' | 'dogeos'

export interface WalletAccountContextType {
  address: Hex
  chainId?: number | string
  chainType?: string
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  isReconnecting: boolean
  status: 'connected' | 'reconnecting' | 'connecting' | 'disconnected'
  switchNetwork: (
    // eslint-disable-next-line no-unused-vars
    opts: { networkChainId?: string | number; networkChain?: Chain }
  ) => Promise<void>
  disconnectWallet: () => Promise<void>
  signMessage?: (
    // eslint-disable-next-line no-unused-vars
    params: { message: string; nonce?: string }
  ) => Promise<string | Uint8Array>
  requestConnect: () => void
}

export const WalletAccountContext = createContext<
  WalletAccountContextType | undefined
>(undefined)

export const useWalletAccount = (): WalletAccountContextType => {
  const context = useContext(WalletAccountContext)
  if (context === undefined) {
    throw new Error(
      'useWalletAccount must be used within a WalletAccountProvider'
    )
  }
  return context
}
