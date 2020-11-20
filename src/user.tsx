
import { useMemo } from 'react'

import { ApolloError } from 'apollo-client'

import { useAuthenticatedUser } from './auth'

import { useCsrfMutation } from './hooks'

import {
  useUpdateUserProfileMutation,
  UpdateUserProfileMutationOptions,
  UpdateUserProfileMutationVariables
} from '../gen/operations'

export const useProfile = () => {
  const ret = useAuthenticatedUser()

  const { loading, error, data } = ret
  let profile
  if (!loading && !error && data?.getAuthenticatedUser) {
    profile = data.getAuthenticatedUser
  }
  return { loading, profile, error }
}

/**
 * Returns the primary email of the currently logged in user.
 *
 * If the user has an email/password credential, this will return
 * that email.
 *
 * Otherwise, if they have only OAuth credentials, this will return
 * the first email from their first OAuth credential.
 *
 * @preview-noinline
 *
 * function PrimaryEmailPreview () {
 *   const { loading, email } = usePrimaryEmail()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <div>Hello {email}</div>
 *   }
 * }
 *
 * render(<PrimaryEmailPreview/>)
 */
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
  email?: string,

  accessToken?: string,
  refreshToken?: string,
}

export type TotpCredential = {
  type: string,
  id: string,
}

export type Credential = PasswordCredential | OauthCredential | TotpCredential

/**
 * Type guard function to check if a credential is a password credential
 */
export const isPasswordCredential = (c: Credential): c is PasswordCredential => {
  return c.type === 'PASSWORD'
}

/**
 * Type guard function to check if a credential is an Oauth credential
 */
export const isOauthCredential = (c: Credential): c is OauthCredential => {
  return c.type === 'OAUTH'
}

/**
 * Type guard function to check if a credential is a TOTP credential
 */
export const isTotpCredential = (c: Credential): c is TotpCredential => {
  return c.type === 'TOTP'
}

/**
 * Return all credentials associated with the currently logged-in user.
 *
 * @preview-noinline
 *
 * function CredentialPreview () {
 *   const { loading, credentials } = useCredentials()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <pre>{JSON.stringify(credentials, null, '  ')}</pre>
 *   }
 * }
 *
 * render(<CredentialPreview/>)
 */
export const useCredentials = (): {
  loading: boolean,
  error?: ApolloError,
  credentials?: Credential[]
} => {
  const { loading, error, profile } = useProfile()

  return useMemo(() => {
    const profileCredentials = profile?.credentials

    if (loading || error || !profileCredentials) {
      return { loading, error }
    }

    const credentials =
      profileCredentials == null
      ? undefined
      : profileCredentials.map((c): Credential => {
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
              accessToken: c.accessToken ?? undefined,
              refreshToken: c.refreshToken ?? undefined,
            }
          }
      })

    return {
      loading,
      error,
      credentials
    }
  }, [loading, error, profile])
}

/**
 * Return the TOTP credential, if any, that is associated with the currently
 * logged-in user.
 *
 * @preview-noinline
 *
 * function TotpPreview () {
 *   const { loading, totpCredential } = useTotpCredential()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else if (!totpCredential) {
 *     return <div>You have not enabled TOTP</div>
 *   } else {
 *     return <pre>{JSON.stringify(credentials, null, '  ')}</pre>
 *   }
 * }
 *
 * render(<TotpPreview/>)
 */
export const useTotpCredential = (): {
  loading: boolean,
  error?: ApolloError,
  totpCredential?: TotpCredential
} => {

  const { loading, error, credentials } = useCredentials()

  if (!loading && !error && credentials) {
    for (const c of credentials) {
      if (isTotpCredential(c)) {
        return { loading, error, totpCredential: c }
      }
    }
  }

  return { loading, error }
}

/**
 * Return all Oauth credentials that are associated with the currently
 * logged-in user.
 *
 * @preview-noinline
 *
 * function OauthPreview () {
 *   const { loading, oauthCredentials } = useOauthCredentials()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <pre>{JSON.stringify(oauthCredentials, null, '  ')}</pre>
 *   }
 * }
 *
 * render(<OauthPreview/>)
 */
export const useOauthCredentials = (): {
  loading: boolean,
  error?: ApolloError,
  oauthCredentials?: OauthCredential[]
} => {
  const { loading, error, credentials } = useCredentials()
  return useMemo(() => {
    if (!loading && !error && credentials) {
      const oauthCredentials = credentials.filter(
        (c): c is OauthCredential => isOauthCredential(c)
      )
      return {
        loading,
        error,
        oauthCredentials
      }
    }

    return { loading, error }
  }, [loading, error, credentials])
}

type OauthAccessTokenMap = Record<string, { accessToken?: string, refreshToken?: string }>

export const useOauthAccessTokens = (): {
  loading: boolean,
  error?: ApolloError,
  accessTokens?: OauthAccessTokenMap
} => {
  const { loading, error, oauthCredentials } = useOauthCredentials()
  return useMemo(() => {
    if (!loading && !error && oauthCredentials) {
      const accessTokens: OauthAccessTokenMap = {}
      for (const cred of oauthCredentials) {
        accessTokens[cred.provider] = {
          accessToken: cred.accessToken,
          refreshToken: cred.refreshToken,
        }
      }
      return { loading, error, accessTokens }
    }
    return { loading, error }
  }, [loading, error, oauthCredentials])
}

/**
 * Return the password credential, if any, associated with the currently logged-in user.
 *
 * @preview-noinline
 *
 * function PasswordPreview () {
 *   const { loading, passwordCredential } = usePasswordCredential()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else if (!passwordCredential) {
 *     return <div>You have not added a password to this account</div>
 *   } else {
 *     return <pre>{JSON.stringify(passwordCredential, null, '  ')}</pre>
 *   }
 * }
 *
 * render(<PasswordPreview/>)
 */
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

/**
 * Return the personal details (e.g. name) associated with the currently logged-in user.
 *
 * @preview-noinline
 *
 * function PersonalDetailsPreview () {
 *   const { loading, name } = usePersonalDetails()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <pre>{JSON.stringify(name, null, '  ')}</pre>
 *   }
 * }
 *
 * render(<PersonalDetailsPreview/>)
 */
export const usePersonalDetails = (): {
  loading: boolean,
  error?: ApolloError,
  name: {
    last?: string,
    first?: string,
  }
} => {

  const { loading, error, profile } = useProfile()

  const name = profile?.name ?? {}

  return {
    loading,
    error,
    name: {
      last: name.last ?? undefined,
      first: name.first ?? undefined,
    }
  }
}

/**
 * Return all profile photos from all Oauth credentials associated with the currently
 * logged-in user.
 *
 * @preview-noinline
 *
 * function PhotoPreview () {
 *   const { loading, photos } = useProfilePhotos()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <ul>{photos.map((photo, i) =>
 *       <li key={i}>
 *          <img src={photo} style={{ width: "64px", height: "64px" }}/>
 *       </li>
 *     )}</ul>
 *   }
 * }
 *
 * render(<PhotoPreview/>)
 */
export const useProfilePhotos = (): {
  loading: boolean,
  error?: ApolloError,
  photos: string[]
} => {

  const { loading, error, credentials } = useCredentials()

  const photos = credentials?.filter((c): c is OauthCredential => isOauthCredential(c))
    .map((c: OauthCredential) => c.photoURL)
    .filter((c?: string): c is string => c != null) ?? []

  return { loading, error, photos }
}

export const useUpdateProfile = (options: UpdateUserProfileMutationOptions = {}) => {
  const [submitUpdate, ret] = useCsrfMutation(useUpdateUserProfileMutation, options)

  const submit = (variables: UpdateUserProfileMutationVariables) => {
    submitUpdate({ variables })
  }

  const { loading, error, data } = ret
  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }

  return [submit, retObj] as [typeof submit, typeof retObj]
}
