'use client'

import { isSupportedChain } from '@/lib/chains'
import React, { ReactNode, useEffect } from 'react'
import { Chain, Hex } from 'viem'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import dynamic from 'next/dynamic'
import {
  WalletAccountContext,
  WalletAccountContextType,
} from './WalletAccountContext'

export type {
  WalletProviderMode,
  WalletAccountContextType,
} from './WalletAccountContext'
export { useWalletAccount } from './WalletAccountContext'

const DogeosWalletAccountOuter = dynamic(
  () => import('./DogeosWalletAccount'),
  { ssr: false }
)

function WagmiWalletAccountInner({ children }: { children: ReactNode }) {
  const account = useAccount()
  const { disconnectAsync } = useDisconnect()
  const { connectors, connectAsync } = useConnect()
  const signMessageWagmi = useSignMessage()

  useEffect(() => {
    if (account?.chainId) {
      let chainId = account?.chainId
      if (!isSupportedChain(chainId)) chainId = 1

      switchNetwork({ networkChainId: chainId }).catch((error) => {
        console.error('Failed to switch network on account change:', error)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.chainId])

  const switchNetwork = async ({
    networkChainId,
    networkChain,
  }: {
    networkChainId?: string | number
    networkChain?: Chain
  }) => {
    if (!isSupportedChain(networkChainId)) {
      const chainName = networkChain?.name || 'Unknown Chain'
      const message = `${chainName} is not supported in this demo.`
      alert(message)
      throw new Error(message)
    }
    if (account?.connector && account.chainId != networkChainId) {
      await account?.connector?.switchChain?.({
        chainId: +(networkChainId ?? 1),
      })
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnectAsync?.()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const value: WalletAccountContextType = {
    address: account?.address as Hex,
    chainId: account?.chainId,
    chainType: 'evm',
    isConnected: account?.isConnected,
    isConnecting: account?.isConnecting,
    isDisconnected: account?.isDisconnected,
    isReconnecting: account?.isReconnecting,
    status: account?.status as
      | 'connected'
      | 'reconnecting'
      | 'connecting'
      | 'disconnected',
    switchNetwork,
    disconnectWallet,
    signMessage: async ({ message }) => {
      return signMessageWagmi.signMessageAsync({ message })
    },
    requestConnect: async () => {
      const connector = connectors?.[0]
      if (!connector) {
        throw new Error('No wallet connector available.')
      }
      await connectAsync({ connector })
    },
  }

  return (
    <WalletAccountContext.Provider value={value}>
      {children}
    </WalletAccountContext.Provider>
  )
}

export const WalletAccountProvider: React.FC<{
  children: ReactNode
  mode?: 'wagmi' | 'dogeos'
}> = ({ children, mode = 'wagmi' }) => {
  if (mode === 'dogeos') {
    return <DogeosWalletAccountOuter>{children}</DogeosWalletAccountOuter>
  }

  return <WagmiWalletAccountInner>{children}</WagmiWalletAccountInner>
}
