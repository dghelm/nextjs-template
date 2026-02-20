'use client'

import { WalletAccountProvider } from '@/components/providers/WalletAccountProvider'
import { WebsiteProvider } from '@/components/providers/WebsiteProvider'
import { WalletConnectProvider } from '@dogeos/dogeos-sdk'
import type { WalletConnectKitConfig } from '@dogeos/dogeos-sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { base, mainnet } from 'viem/chains'
import { ErrorHandlerProvider } from './ErrorHandlerProvider'

const config: WalletConnectKitConfig = {
  clientId: process.env.NEXT_PUBLIC_DOGEOS_CLIENT_ID!,
  metadata: {
    name: 'Snag Solutions',
    description: 'Web3 Loyalty Program',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    icons: [],
  },
  chains: {
    evm: [mainnet, base],
  },
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
        <WalletConnectProvider config={config}>
          <WebsiteProvider>
            <WalletAccountProvider>
              <ErrorHandlerProvider>{children}</ErrorHandlerProvider>
            </WalletAccountProvider>
          </WebsiteProvider>
        </WalletConnectProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
