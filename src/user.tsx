
import { useContext } from 'react'
import { ApolloError } from 'apollo-client'

import { UMApolloContext, useToken } from './auth'
import { PROFILE_QUERY } from './fragments'
import { useCsrfQuery } from './hooks'

// TODO: set up graphql codegen instead of doing this by hand
type CredentialType = {
  id: string
  type: 'PASSWORD' | 'OAUTH'
  email?: string
  emailIsVerified?: boolean
  provider?: string
  providerID?: string
  photoURL?: string
}

export const useProfile = (): {
  loading: boolean
  error?: ApolloError
  profile?: {
    id: string
    primaryEmail: string
    credentials: CredentialType[]
  }
} => {
  const client = useContext(UMApolloContext)
  const { id } = useToken()
  const ret = useCsrfQuery(PROFILE_QUERY, { client, skip: id == null })

  const { loading, error, data } = ret
  let profile
  if (!loading && !error && data?.svcGetAuthenticatedUser) {
    profile = data.svcGetAuthenticatedUser
  }
  return { loading, profile, error }
}

export const usePrimaryEmail = (): {
  loading: boolean,
  error?: ApolloError,
  email?: string
} => {
  const { loading, error, profile } = useProfile()
  return { loading, error, email: profile?.primaryEmail }
}

export type PasswordCredential = {
  type: string,
  id: string,
  email: string,
  emailIsVerified: boolean
}

export type OauthCredential = {
  type: string,
  id: string,
  provider: string,
  providerID: string,
  photoURL?: string
}

export type Credential = PasswordCredential | OauthCredential

export const isPasswordCredential = (c: Credential): c is PasswordCredential => {
  return c.type === 'PASSWORD'
}

export const isOauthCredential = (c: Credential): c is OauthCredential => {
  return c.type === 'OAUTH'
}

export const useCredentials = (): {
  loading: boolean,
  error?: ApolloError,
  credentials?: Credential[]
} => {
  const { loading, error, profile } = useProfile()

  if (!loading && !error && profile) {
    return {
      loading,
      error,
      credentials: profile.credentials.map((c): Credential => {
        if (c.type === 'PASSWORD') {
          return {
            type: c.type,
            id: c.id,
            email: c.email ?? '<unknown>',
            emailIsVerified: Boolean(c.emailIsVerified)
          }
        } else {
          return {
            type: c.type,
            id: c.id,
            provider: c.provider ?? '<unknown>',
            providerID: c.providerID ?? '<unknown>',
            photoURL: c.photoURL
          }
        }
      })
    }
  } else {
    return { loading, error }
  }
}

export const usePasswordCredential = (): {
  loading: boolean,
  error?: ApolloError,
  passwordCredential?: PasswordCredential
} => {
  const { loading, error, credentials } = useCredentials()

  if (!loading && !error && credentials) {
    for (const c of credentials) {
      if (isPasswordCredential(c)) {
        return { loading, error, passwordCredential: c }
      }
    }
  }

  return { loading, error }
}

export const useProfilePhotos = (): {
  loading: boolean,
  error?: ApolloError,
  photos?: string[]
} => {

  const { loading, error, credentials } = useCredentials()

  const photos = credentials?.filter((c): c is OauthCredential => isOauthCredential(c))
    .map((c: OauthCredential) => c.photoURL)
    .filter((c?: string): c is string => c != null)

  return { loading, error, photos }

}

