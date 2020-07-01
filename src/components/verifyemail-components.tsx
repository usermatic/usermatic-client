
import React, { useEffect } from 'react'

import { useCsrfToken } from '../hooks'
import { ErrorMessage } from '../errors'
import { useComponents } from './component-lib'
import { Components } from './component-types'

import {
  useEmailVerifier
} from '../verifyemail'

/**
 * <EmailVerifier> uses a email verification token from the URL to
 * tell the Usermatic API server that the user's email address is now
 * verified.
 *
 * This component should be placed on the page located at the
 * "Verification Target URI" setting in your Usermatic application settings.
 */
export const EmailVerifier: React.FC<{
  token: string,
  components?: Components
}> = ({token, components}) => {

  const {
    EmailVerificationComponent,
    LoadingMessageComponent
  } = useComponents(components)

  const [submit, { error, loading, success, called, data }] = useEmailVerifier()
  const { csrfToken } = useCsrfToken()

  useEffect(() => {
    if (!called && csrfToken) {
      submit({variables: { token }})
    }

    if (success && data) {
      const { redirectUri } = data.verifyEmail
      setTimeout(() => {
        window.location.replace(redirectUri)
      }, 1000)
    }
  }, [called, csrfToken, success])

  if (loading) {
    return <LoadingMessageComponent/>
  }

  const redirectUri = data?.verifyEmail?.redirectUri
  return <EmailVerificationComponent
    success={success}
    redirectUri={redirectUri}
    error={<ErrorMessage error={error}/>}
  />
}
