
import { ApolloError } from 'apollo-client'

import { useToken } from './auth'
import { useCsrfQuery } from './hooks'

import {
  useGetProfileQuery
} from '../gen/operations'

export const useProfile = () => {
  const { id } = useToken()
  const ret = useCsrfQuery(useGetProfileQuery, { skip: id == null })

  const { loading, error, data } = ret
  let profile
  if (!loading && !error && data?.getAuthenticatedUser) {
    profile = data.getAuthenticatedUser
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
  photoURL?: string,
  email?: string
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
            photoURL: (c.photoURL != null) ? c.photoURL : undefined,
            email: (c.email != null) ? c.email : undefined,
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

export const usePersonalDetails = (): {
  loading: boolean,
  error?: ApolloError,
  name: {
    family?: string,
    given?: string,
    full?: string
  }
}  => {

  const { loading, error, profile } = useProfile()

  const name = profile?.name ?? {}

  return {
    loading,
    error,
    name: {
      family: name.family ?? undefined,
      given: name.given ?? undefined,
      full: name.full ?? undefined
    }
  }
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

