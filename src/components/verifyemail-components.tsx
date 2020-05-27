
import React, { useEffect } from 'react'

import { useCsrfToken } from '../hooks'
import { ErrorMessage } from '../errors'
import {
  useComponents,
  FormComponents
} from './form-util'

import {
  useEmailVerifier
} from '../verifyemail'

export const EmailVerifier: React.FC<{
  token: string,
  components: FormComponents
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
