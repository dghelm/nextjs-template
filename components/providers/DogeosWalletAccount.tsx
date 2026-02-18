'use client'

import {
  isSupportedChain,
  ViemChainByChainId,
  SupportedChainId,
} from '@/lib/chains'
import { DogeosReadyContext } from '@/lib/dogeosReady'
import { ReactNode, useContext } from 'react'
import { Hex } from 'viem'
import {
  useAccount as useDogeosAccount,
  useWalletConnect,
} from '@dogeos/dogeos-sdk'
import {
  WalletAccountContext,
  WalletAccountContextType,
} from './WalletAccountContext'

const parseChainId = (chainId?: string): number | undefined => {
  if (!chainId) return undefined
  if (chainId.startsWith('0x')) return parseInt(chainId, 16)
  return parseInt(chainId, 10)
}

function FallbackWalletAccountInner({ children }: { children: ReactNode }) {
  const value: WalletAccountContextType = {
    address: '' as Hex,
    chainId: undefined,
    chainType: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: 'disconnected',
    switchNetwork: async () => {},
    disconnectWallet: async () => {},
    signMessage: undefined,
    requestConnect: () => {},
  }

  return (
    <WalletAccountContext.Provider value={value}>
      {children}
    </WalletAccountContext.Provider>
  )
}

function DogeosWalletAccountInner({ children }: { children: ReactNode }) {
  const dogeosAccount = useDogeosAccount()
  const walletConnect = useWalletConnect()

  const chainId = parseChainId(dogeosAccount.chainId)
  const isConnected = walletConnect.isConnected
  const isConnecting = walletConnect.isConnecting

  const switchNetwork = async ({
    networkChainId,
  }: {
    networkChainId?: string | number
  }) => {
    try {
      const numChainId = Number(networkChainId)
      if (!isSupportedChain(numChainId)) {
        alert('This chain is not supported in this demo.')
        return
      }
      const chainInfo = ViemChainByChainId[numChainId as SupportedChainId]
      if (chainInfo) {
        await dogeosAccount.switchChain({
          chainType: 'evm',
          chainInfo: {
            id: chainInfo.id,
            name: chainInfo.name,
            nativeCurrency: chainInfo.nativeCurrency,
            rpcUrls: {
              default: {
                http: [...chainInfo.rpcUrls.default.http],
              },
            },
          },
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const disconnectWallet = async () => {
    try {
      await walletConnect.disconnect()
    } catch (e) {
      console.error(e)
    }
  }

  const value: WalletAccountContextType = {
    address: (dogeosAccount.address || '') as Hex,
    chainId,
    chainType: dogeosAccount.chainType,
    isConnected,
    isConnecting,
    isDisconnected: !isConnected && !isConnecting,
    isReconnecting: false,
    status: isConnected
      ? 'connected'
      : isConnecting
        ? 'connecting'
        : 'disconnected',
    switchNetwork,
    disconnectWallet,
    signMessage: dogeosAccount.signMessage,
    requestConnect: () => {
      walletConnect.openModal()
    },
  }

  return (
    <WalletAccountContext.Provider value={value}>
      {children}
    </WalletAccountContext.Provider>
  )
}

export default function DogeosWalletAccountOuter({
  children,
}: {
  children: ReactNode
}) {
  const isDogeosReady = useContext(DogeosReadyContext)

  if (!isDogeosReady) {
    return <FallbackWalletAccountInner>{children}</FallbackWalletAccountInner>
  }

  return <DogeosWalletAccountInner>{children}</DogeosWalletAccountInner>
}
