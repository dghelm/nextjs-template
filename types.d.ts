import { Session as DefaultSession, User as DefaultUser } from 'next-auth'

declare module '@dogeos/dogeos-sdk/style.css' {
  const content: string
  export default content
}

declare module 'next-auth' {
  interface User extends DefaultUser {
    walletAddress?: string
  }
  interface Session extends DefaultSession {
    address?: string
    user: {
      id?: string
      walletAddress?: string
    }
  }
}
