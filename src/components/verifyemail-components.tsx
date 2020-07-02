
import React, { useEffect } from 'react'

import url from 'url'

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
  /**
   * The token to be used. If omitted, EmailVerifier looks for a token in the
   * query string of window.location.href with the name 'token'.
   */
  token?: string,
  /**
   * Custom display components for EmailVerifier. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components
}> = ({token: tokenProp, components}) => {

  const {
    EmailVerificationComponent,
    LoadingMessageComponent
  } = useComponents(components)

  const isBrowser = typeof window !== 'undefined'

  const [submit, { error, loading, success, called, data }] = useEmailVerifier()
  const { csrfToken } = useCsrfToken()

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    let token = tokenProp ?? url.parse(window.location.href, true).query['token']
    if (Array.isArray(token)) {
      token = token[0]
    }

    if (!token) {
      console.error("No verification token found in url or in EmailVerifier props")
      return
    }

    if (!called && csrfToken) {
      submit({variables: { token }})
    }

    if (success && data) {
      const { redirectUri } = data.verifyEmail
      setTimeout(() => {
        window.location.replace(redirectUri)
      }, 1000)
    }
  }, [isBrowser, called, csrfToken, success, data, submit, tokenProp])

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
