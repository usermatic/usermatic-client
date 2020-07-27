
import urllib from 'url'
import { useEffect, useState, useCallback, useMemo } from 'react'
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

/**
 * Apollo mutation hook for logging out.
 *
 * In many cases, you can use <LogoutButton> instead of using this hook directly.
 *
 * @preview-noinline
 *
 * function LogoutPreview () {
 *   const [submit, { success }] = useLogout()
 *   if (success) {
 *     return <div>You have been logged out</div>
 *   }
 *
 *   return <button
 *     className="btn btn-primary"
 *     onClick={(e) => {
 *       e.preventDefault()
 *       submit()
 *     }}
 *   >
 *    Logout
 *   </button>
 * }
 *
 * render(<LogoutPreview/>)
 */
export const useLogout = () => {
  const [submit, ret] = useCsrfMutation(useLogoutMutation)

  const { loading, error, data } = ret

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

/**
 * Apollo mutation hook for logging in.
 *
 * NB: You should almost certainly use <LoginForm> rather than calling this
 * hook directly, as correctly logging with anything other than a plain
 * email/password login is somewhat complicated.
 */
export const useLogin = (options: LoginMutationOptions = {}) => {

  const [submitLogin, ret] = useCsrfMutation(useLoginMutation, options)

  const { loading, error, data } = ret

  const submit = useCallback((variables: LoginMutationVariables) => {
    submitLogin({ variables })
  }, [submitLogin])

  const success = Boolean(!loading && !error && data)
  return useMemo(() => {
    const retObj = { ...ret, success }
    return [submit, retObj] as [typeof submit, typeof retObj]
  }, [ret, success, submit])
}

/**
 * Apollo mutation hook for creating an account.
 *
 * NB: You should almost certainly use <AccountCreationForm> rather than calling this
 * hook directly.
 */
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
