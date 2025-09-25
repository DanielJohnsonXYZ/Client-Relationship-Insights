import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'

export interface BasecampProfile {
  id: number
  name: string
  email_address: string
  avatar_url?: string
  company?: {
    id: number
    name: string
  }
  accounts: Array<{
    id: number
    name: string
    href: string
    product: string
  }>
}

export default function BasecampProvider<P extends BasecampProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'basecamp',
    name: 'Basecamp',
    type: 'oauth',
    version: '2.0',
    authorization: {
      url: 'https://launchpad.37signals.com/authorization/new',
      params: {
        scope: 'read',
        response_type: 'code',
      },
    },
    token: 'https://launchpad.37signals.com/authorization/token',
    userinfo: 'https://launchpad.37signals.com/authorization.json',
    client: {
      token_endpoint_auth_method: 'client_secret_post',
    },
    async profile(profile: P) {
      return {
        id: profile.id.toString(),
        name: profile.name,
        email: profile.email_address,
        image: profile.avatar_url,
        // Store Basecamp accounts for API access
        basecampAccounts: profile.accounts,
      }
    },
    style: {
      logo: '/basecamp-logo.svg',
      logoDark: '/basecamp-logo.svg',
      bg: '#fff',
      text: '#5CB85C',
      bgDark: '#000',
      textDark: '#5CB85C',
    },
    options,
  }
}