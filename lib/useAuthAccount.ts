import { useWalletAccount } from '@/components/providers/WalletAccountProvider'
import { getCsrfToken, signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo } from 'react'
import { SiweMessage } from 'siwe'

const isEvmAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)

const uint8ArrayToHex = (arr: Uint8Array): string =>
  '0x' +
  Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

/**
 * Get the wallet authentication signature
 */
export const getWalletAuthSignature = async (
  account: ReturnType<typeof useWalletAccount>
) => {
  if (!account.signMessage) {
    throw new Error('signMessage is not available')
  }

  const nonce = await getCsrfToken()
  const message = new SiweMessage({
    domain: window.location.host,
    statement: 'Sign in to the app. Powered by Snag Solutions.',
    uri: window.location.origin,
    version: '1',
    chainId: Number(account.chainId ?? 1),
    nonce,
    address: account.address,
  })

  const preparedMessage = message.prepareMessage()
  const result = await account.signMessage({
    message: preparedMessage,
    nonce,
  })

  const signatureOrToken =
    result instanceof Uint8Array ? uint8ArrayToHex(result) : result

  return {
    signatureOrToken,
    message,
    walletAddress: account.address,
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
    message: message ? JSON.stringify(message) : message,
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
  const isAuthenticated = useMemo(
    () => !!session.data?.user,
    [session.data?.user]
  )

  useEffect(() => {
    async function connectWallet() {
      await signInWallet(account)
    }
    if (
      account.address &&
      isEvmAddress(account.address) &&
      account.chainType === 'evm' &&
      session.status === 'unauthenticated'
    )
      connectWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.address, account.chainType, session.status])

  return {
    isAuthenticated,
    userId: session.data?.user?.id,
    walletAddress: session?.data?.address,
    account,
    isLoading: session.status === 'loading',
    connect: async () => {
      try {
        account.requestConnect()
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
    disconnect: async () => {
      try {
        await signOut({
          redirect: false,
        })
        await account.disconnectWallet()
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
  }
}
