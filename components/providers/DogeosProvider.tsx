'use client'

import { DogeosReadyContext } from '@/lib/dogeosReady'
import { getAllSupportedChains } from '@/lib/chains'
import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react'

import type { WalletConnectKitConfig } from '@dogeos/dogeos-sdk'

let WalletConnectProvider: ComponentType<{
  children: ReactNode
  config?: WalletConnectKitConfig
}> | null = null
let getChainsFn: typeof import('@dogeos/dogeos-sdk').getChains | null = null
let getConnectorsFn: typeof import('@dogeos/dogeos-sdk').getConnectors | null =
  null

// eslint-disable-next-line no-var
var sdkReady: Promise<void> | null = null
if (typeof window !== 'undefined') {
  sdkReady = import('@dogeos/dogeos-sdk')
    .then(async (mod) => {
      WalletConnectProvider = mod.WalletConnectProvider
      getChainsFn = mod.getChains
      getConnectorsFn = mod.getConnectors
      await import('@dogeos/dogeos-sdk/style.css')
    })
    .catch((err) => {
      console.error('DogeosProvider: Failed to load SDK bundle', err)
      throw err
    })
}

type DogeosProviderProps = {
  children: ReactNode
}

export function DogeosProvider({ children }: DogeosProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [chains, setChains] =
    useState<WalletConnectKitConfig['chains']>(undefined)
  const [connectors, setConnectors] =
    useState<WalletConnectKitConfig['connectors']>(undefined)

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!sdkReady) {
        if (!cancelled) {
          setInitError('Dogeos SDK is unavailable in this browser context.')
        }
        return
      }

      try {
        // Wait for dynamic import
        await sdkReady
      } catch (err) {
        if (!cancelled) {
          setInitError('Dogeos SDK failed to load. Check console for details.')
        }
        console.error('DogeosProvider: SDK load failed', err)
        return
      }

      // Fetch chains and connectors in parallel, catch individually
      const [chainsResult, connectorsResult] = await Promise.allSettled([
        getChainsFn?.(),
        getConnectorsFn?.(),
      ])

      if (cancelled) return

      if (chainsResult.status === 'fulfilled' && chainsResult.value) {
        // EVM-only: filter to only evm chains
        setChains({ evm: chainsResult.value.evm || [] })
      } else {
        // EVM-only fallback: use full viem chain objects
        setChains({
          evm: getAllSupportedChains().map((c) => ({
            id: c.id,
            name: c.name,
            nativeCurrency: c.nativeCurrency,
            rpcUrls: {
              default: { http: [...c.rpcUrls.default.http] },
            },
          })),
        })
        if (chainsResult.status === 'rejected') {
          console.error(
            'DogeosProvider: Failed to fetch chains, using EVM defaults',
            chainsResult.reason
          )
        }
      }

      if (connectorsResult.status === 'fulfilled') {
        setConnectors(connectorsResult.value)
      } else {
        console.error(
          'DogeosProvider: Failed to fetch connectors, using SDK defaults',
          connectorsResult.reason
        )
      }

      setIsReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  const config = useMemo<WalletConnectKitConfig>(
    () => ({
      connectors,
      chains,
      defaultConnectChain: 'evm' as const,
      metadata: {
        name: 'App Template',
        description: 'Powered by Snag Solutions',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [],
      },
      login: {
        basicLogins: ['email', 'externalWallets'],
        socialLogins: [{ type: 'google' }, { type: 'x' }],
      },
    }),
    [chains, connectors]
  )

  if (initError) {
    return (
      <DogeosReadyContext.Provider value={false}>
        <div className="w-full rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {initError}
        </div>
        {children}
      </DogeosReadyContext.Provider>
    )
  }

  if (!isReady || !WalletConnectProvider) {
    return (
      <DogeosReadyContext.Provider value={false}>
        {children}
      </DogeosReadyContext.Provider>
    )
  }

  return (
    <DogeosReadyContext.Provider value={true}>
      <WalletConnectProvider config={config}>{children}</WalletConnectProvider>
    </DogeosReadyContext.Provider>
  )
}
