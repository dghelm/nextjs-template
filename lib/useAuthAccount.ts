import { useWalletAccount } from '@/components/providers/WalletAccountProvider'
import { useWalletConnect } from '@dogeos/dogeos-sdk'
import { getCsrfToken, signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo } from 'react'
import { SiweMessage } from 'siwe'
import { getAddress } from 'viem'

/**
 * Get the wallet authentication signature
 */
export const getWalletAuthSignature = async (
  account: ReturnType<typeof useWalletAccount>
) => {
  const message = new SiweMessage({
    domain: window.location.host,
    statement: 'Sign in to the app. Powered by Snag Solutions.',
    uri: window.location.origin,
    version: '1',
    chainId: Number(account.chainId ?? 1),
    nonce: await getCsrfToken(),
    address: getAddress(account.address),
  })

  if (!account.signMessage) {
    throw new Error('Sign message not available')
  }

  const signatureOrToken = await account.signMessage({
    message: message.prepareMessage(),
  })

  return {
    signatureOrToken: signatureOrToken as string,
    message,
    walletAddress: getAddress(account.address),
  }
}

/**
 * Sign in the user with the wallet address and signature
 */
export const signInWallet = async (
  account: ReturnType<typeof useWalletAccount>
) => {
  const { signatureOrToken, message, walletAddress } =
    await getWalletAuthSignature(account)

  const token = await signIn('credentials', {
    message: !!message ? JSON.stringify(message) : message,
    accessToken: signatureOrToken,
    signature: signatureOrToken,
    walletAddress: walletAddress,
    redirect: false,
    callbackUrl: '/protected',
  })
  return token
}

/**
 * Hook to get the authentication account
 *
 * @returns {object} The authentication account
 */
export const useAuthAccount = () => {
  const session = useSession()
  const account = useWalletAccount()
  const { openModal, disconnect: disconnectConnection } = useWalletConnect()
  const isAuthenticated = useMemo(
    () => !!session.data?.user,
    [session.data?.user]
  )

  const isEvmWallet = account.chainType === 'evm'

  useEffect(() => {
    async function connectWallet() {
      await signInWallet(account)
    }
    if (account.address && isEvmWallet && session.status === 'unauthenticated')
      connectWallet()
  }, [account.address, isEvmWallet, session.status])

  return {
    isAuthenticated,
    userId: session.data?.user?.id,
    walletAddress: session?.data?.address,
    account,
    isLoading: session.status === 'loading',
    connect: async () => {
      try {
        openModal()
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
    disconnect: async () => {
      try {
        await signOut({ redirect: false })
        await disconnectConnection()
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
  }
}
