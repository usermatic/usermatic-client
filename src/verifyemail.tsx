
import React, { useContext, useEffect } from 'react'

import { UMApolloContext } from './auth'
import { useCsrfMutation } from './hooks'

import { VERIFY_EMAIL_MUT } from './fragments'


export const useEmailVerifier = () => {
  const client = useContext(UMApolloContext)

  const [submit, {loading, error, data, called} ] =
    useCsrfMutation(VERIFY_EMAIL_MUT, { client })

  const success = !loading && !error && data
  return { submit, loading, error, data, success, called }
}

export const UMEmailVerifier: React.FC<{token: string}> = ({token}) => {

  const { submit, loading, error, success, called, data } = useEmailVerifier()

  useEffect(() => {
    if (!called) {
      submit({variables: { token }})
    }

    if (success) {
      console.log("data", data)
    }
  })

  if (loading) {
    return <div>Verifying email, please wait...</div>
  } else if (success) {
    return <div>Email verified.</div>

  } else if (error) {
    return <div>Email verification failed</div>
  }
  return null
}
