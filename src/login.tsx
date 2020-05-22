
import urllib from 'url'
import { useEffect, useState } from 'react'
import jwtDecode from 'jwt-decode'

import { useCsrfMutation } from './hooks'

import {
  useLogoutMutation,
  useLoginMutation,
  useCreateAccountMutation,
  LoginMutationVariables,
  LoginMutationOptions,
  CreateAccountMutationOptions,
  CreateAccountMutationVariables
} from '../gen/operations'

export const useLogout = () => {
  const [submit, ret] = useCsrfMutation(useLogoutMutation)

  const { loading, error, data } = ret

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useLogin = (options: LoginMutationOptions = {}) => {

  const [submitLogin, ret] = useCsrfMutation(useLoginMutation, options)

  const { loading, error, data } = ret

  const submit = (variables: LoginMutationVariables) => {
    submitLogin({ variables })
  }

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  // typescript can't infer tuples :(
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useCreateAccount = (options: CreateAccountMutationOptions = {}) => {
  const [submitCreateAccount, ret] = useCsrfMutation(useCreateAccountMutation, options)

  const { loading, error, data } = ret

  const submit = (variables: CreateAccountMutationVariables) => {
    submitCreateAccount({ variables })
  }

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  // typescript can't infer tuples :(
  return [submit, retObj] as [typeof submit, typeof retObj]
}

const singleString = (s?: string | string[]): string | undefined => {
  if (s == null) {
    return
  }
  if (Array.isArray(s)) {
    if (s.length !== 1) {
      throw new Error("array arg must have length 1")
    }
    return s[0]
  } else {
    return s
  }
}

export const useOauthToken = () => {
  if (typeof window === 'undefined') {
    return
  }

  const [token, setToken] = useState<string | undefined>()

  useEffect(() => {
    if (token != null) { return }

    const parsed = urllib.parse(location.href, true)
    const umOauthToken = singleString(parsed.query.umOauthToken)
    if (umOauthToken == null) {
      return
    }

    const { nonce } = jwtDecode(umOauthToken) as { nonce: string }

    const { umAuthNonce } = window.localStorage

    if (umAuthNonce == null || nonce == null || umAuthNonce !== nonce) {
      // TODO: give up and redirect somewhere
      return
    }

    setToken(umOauthToken)
  })

  return token
}
