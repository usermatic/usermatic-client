
import React, { useEffect } from 'react'

import { useCsrfToken } from '../hooks'

import {
  useEmailVerifier
} from '../verifyemail'

export const EmailVerifier: React.FC<{token: string}> = ({token}) => {

  const [submit, { error, success, called, data }] = useEmailVerifier()
  const { csrfToken } = useCsrfToken()

  useEffect(() => {
    if (!called && csrfToken) {
      submit({variables: { token }})
    }

    if (success) {
      const { redirectUri } = data.svcVerifyEmail
      setTimeout(() => {
        window.location.replace(redirectUri)
      }, 1000)
    }
  }, [called, csrfToken, success])

  if (success) {
    const { redirectUri } = data.svcVerifyEmail
    return <div>Your email is now verified! You will be automatically
      redirected to <a href={redirectUri}>{redirectUri}</a>.
      (Please click the above link if you are not redirected shortly.)
    </div>
  } else if (error) {
    return <div>We could not verify your email address - The link you clicked may be expired.</div>
  }

  return <>
    <div><h4>Verifying email, please wait...</h4></div>
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </>
}
