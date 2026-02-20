'use client'

import {
  useAccount,
  useWalletConnect,
} from '@dogeos/dogeos-sdk'
import React, { createContext, ReactNode, useContext } from 'react'
import { Hex } from 'viem'

interface WalletAccountContextType {
  address: Hex
  chainId?: number | string
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  isReconnecting: boolean
  status: 'connected' | 'reconnecting' | 'connecting' | 'disconnected'
  switchNetwork: (params: {
    networkChainId?: string | number
  }) => Promise<void>
  disconnectWallet: () => Promise<void>
  signMessage?: (params: { message: string }) => Promise<string | Uint8Array>
  chainType?: string
}

const WalletAccountContext = createContext<
  WalletAccountContextType | undefined
>(undefined)

export const WalletAccountProvider: React.FC<{
  children: ReactNode
}> = ({ children }) => {
  const dogeAccount = useAccount()
  const { isConnected, isConnecting, disconnect } = useWalletConnect()

  const switchNetwork = async ({
    networkChainId,
  }: {
    networkChainId?: string | number
  }) => {
    try {
      if (dogeAccount.switchChain && networkChainId) {
        await dogeAccount.switchChain({
          chainType: 'evm',
          chainInfo: { id: Number(networkChainId) } as any,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnect()
    } catch (e) {}
  }

  const status: WalletAccountContextType['status'] = isConnected
    ? 'connected'
    : isConnecting
      ? 'connecting'
      : 'disconnected'

  const value: WalletAccountContextType = {
    address: (dogeAccount.address ?? '') as Hex,
    chainId: dogeAccount.chainId ? Number(dogeAccount.chainId) : undefined,
    isConnected,
    isConnecting,
    isDisconnected: !isConnected && !isConnecting,
    isReconnecting: false,
    status,
    switchNetwork,
    disconnectWallet,
    signMessage: dogeAccount.signMessage,
    chainType: dogeAccount.chainType,
  }

  return (
    <WalletAccountContext.Provider value={value}>
      {children}
    </WalletAccountContext.Provider>
  )
}

export const useWalletAccount = (): WalletAccountContextType => {
  const context = useContext(WalletAccountContext)
  if (context === undefined) {
    throw new Error(
      'useWalletAccount must be used within a WalletAccountProvider'
    )
  }
  return context
}
