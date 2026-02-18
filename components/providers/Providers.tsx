'use client'

import {
  WalletAccountProvider,
  WalletProviderMode,
} from '@/components/providers/WalletAccountProvider'
import { WebsiteProvider } from '@/components/providers/WebsiteProvider'
import { getAllSupportedChains } from '@/lib/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, useState } from 'react'
import { createClient, http } from 'viem'
import { createConfig, WagmiProvider } from 'wagmi'
import { injected } from 'wagmi/connectors'
import dynamic from 'next/dynamic'
import { ErrorHandlerProvider } from './ErrorHandlerProvider'

const DogeosProvider = dynamic(
  () =>
    import('./DogeosProvider').then((mod) => ({
      default: mod.DogeosProvider,
    })),
  { ssr: false }
)

type ProvidersProps = {
  children: ReactNode
}

const walletMode: WalletProviderMode =
  process.env.NEXT_PUBLIC_WALLET_PROVIDER === 'dogeos' ? 'dogeos' : 'wagmi'

export const defaultWagmiConfig = () => {
  return createConfig({
    chains: getAllSupportedChains(),
    connectors: walletMode === 'wagmi' ? [injected()] : [],
    ssr: true,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    },
  })
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [wagmiConfig] = useState(() => defaultWagmiConfig())

  const inner = (
    <WalletAccountProvider mode={walletMode}>
      <ErrorHandlerProvider>{children}</ErrorHandlerProvider>
    </WalletAccountProvider>
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WagmiProvider config={wagmiConfig}>
          <WebsiteProvider>
            {walletMode === 'dogeos' ? (
              <DogeosProvider>{inner}</DogeosProvider>
            ) : (
              inner
            )}
          </WebsiteProvider>
        </WagmiProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
