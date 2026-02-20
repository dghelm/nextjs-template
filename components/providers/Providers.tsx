'use client'

import { WalletAccountProvider } from '@/components/providers/WalletAccountProvider'
import { WebsiteProvider } from '@/components/providers/WebsiteProvider'
import { getAllSupportedChains } from '@/lib/chains'
import { WalletConnectProvider } from '@dogeos/dogeos-sdk'
import type { WalletConnectKitConfig } from '@dogeos/dogeos-sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { createClient, http } from 'viem'
import { createConfig, WagmiProvider } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ErrorHandlerProvider } from './ErrorHandlerProvider'

export const defaultWagmiConfig = () => {
  return createConfig({
    chains: getAllSupportedChains(),
    connectors: [injected()],
    ssr: true,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    },
  })
}

const dogeConfig: WalletConnectKitConfig = {
  clientId: process.env.NEXT_PUBLIC_DOGEOS_CLIENT_ID!,
  metadata: {
    name: 'Snag Solutions',
    description: 'Web3 Loyalty Program',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    icons: [],
  },
  chains: { evm: getAllSupportedChains() },
  defaultConnectChain: 'evm',
  login: {
    basicLogins: ['email', 'externalWallets'],
    socialLogins: [{ type: 'google' }, { type: 'x' }],
  },
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WagmiProvider config={defaultWagmiConfig()}>
          <WalletConnectProvider config={dogeConfig}>
            <WebsiteProvider>
              <WalletAccountProvider>
                <ErrorHandlerProvider>{children}</ErrorHandlerProvider>
              </WalletAccountProvider>
            </WebsiteProvider>
          </WalletConnectProvider>
        </WagmiProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
