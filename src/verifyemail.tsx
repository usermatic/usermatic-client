
import React, { useContext, useEffect } from 'react'

import { UMApolloContext } from './auth'
import { useCsrfMutation, UMCsrfContext } from './hooks'

import { VERIFY_EMAIL_MUT, SEND_VERIFICATION_EMAIL_MUT } from './fragments'

export const useSendVerificationEmail = () => {
  const client = useContext(UMApolloContext)

  const [submit, {loading, error, data, called} ] =
    useCsrfMutation(SEND_VERIFICATION_EMAIL_MUT, { client })

  const success = !loading && !error && data
  return { submit, loading, error, data, success, called }
}

export const useEmailVerifier = () => {
  const client = useContext(UMApolloContext)

  const [submit, {loading, error, data, called} ] =
    useCsrfMutation(VERIFY_EMAIL_MUT, { client })

  const success = !loading && !error && data
  return { submit, loading, error, data, success, called }
}

export const UMEmailVerifier: React.FC<{token: string}> = ({token}) => {

  const { submit, loading, error, success, called, data } = useEmailVerifier()
  const csrfToken = useContext(UMCsrfContext)

  useEffect(() => {
    if (!called && csrfToken) {
      submit({variables: { token }})
    }

    if (success) {
      const { redirectUri } = data.svcVerifyEmail
      setTimeout(() => {
        window.location.replace(redirectUri)
      }, 3000)
    }
  })

  if (loading) {
    return <div>Verifying email, please wait...</div>
  } else if (success) {
    const { redirectUri } = data.svcVerifyEmail
    return <div>Your email is now verified! You will be automatically
      redirected to <a href={redirectUri}>{redirectUri}</a>.
      (Please click the above link if you are not redirected shortly.)
    </div>
  } else if (error) {
    return <div>We could not verify your email address - The link you clicked may be expired.</div>
  }
  return null
}
