
import urllib from 'url'
import { useContext, useEffect, useState } from 'react'
import jwtDecode from 'jwt-decode'

import { AppIdContext, useAppId } from './auth'
import { useCsrfMutation } from './hooks'

import {
  SESSION_QUERY
} from './fragments'

import {
  useLogoutMutation,
  useLoginMutation,
  useCreateAccountMutation,
  LoginMutationVariables,
  LoginMutationOptions,
  CreateAccountMutationVariables
} from '../gen/operations'

export const useLogout = () => {
  const appId = useAppId()

  const [submit, ret] =
    useCsrfMutation(
      useLogoutMutation,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      }
    )

  const { loading, error, data } = ret

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useLogin = (options: LoginMutationOptions = {}) => {
  const appId = useContext(AppIdContext)

  if (options.refetchQueries) {
    console.warn('overwriting default options.refetchQueries')
  }

  const [submitLogin, ret] =
    useCsrfMutation(
      useLoginMutation,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }],
        ...options
      }
    )

  const { loading, error, data } = ret

  const submit = (values: LoginMutationVariables) => {
    submitLogin({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  // typescript can't infer tuples :(
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useCreateAccount = () => {
  const appId = useContext(AppIdContext)
  const [submitCreateAccount, ret] =
    useCsrfMutation(
      useCreateAccountMutation,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      })

  const { loading, error, data } = ret

  const submit = (values: CreateAccountMutationVariables) => {
    submitCreateAccount({ variables: values })
  }

  const success = !loading && !error && data
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

/*
type useOauthLoginArgs = {
  onLogin?: () => void,
  oauthToken?: string,
  totpCode?: string
}
*/

/*
export const useOauthLogin = ({onLogin, oauthToken, totpCode}: useOauthLoginArgs) => {
  const { csrfToken } = useCsrfToken()
  const appId = useAppId()
  const { id, loading: tokenLoading } = useToken()

  const [success, setSuccess] = useState<boolean>(false)

  const [submit, { data, loading, error, called }] = useCsrfMutation(
    useLoginOauthMutation,
    {
      refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }],
      onCompleted: () => { setSuccess(true) }
    }
  )

  useEffect(() => {
    // need to wait until the login mutation is complete *and* we've updated the
    // token.
    if (success && id && !tokenLoading) {
      if (onLogin != null) {
        onLogin()
      }

      // we've logged in successfully, remove the token from the url if onLogin
      // hasn't already done so for us.
      // We need a short delay as applications may be using an asynchronous method
      // to update the URL, e.g. router.replace() in nextjs.
      setTimeout(() => {
        const parsed = urllib.parse(location.href, true)
        if (parsed.query.umOauthToken) {
          delete parsed.search
          delete parsed.query.umOauthToken
          location.href = urllib.format(parsed)
        }
      }, 500)
    }
  }, [success, id, tokenLoading, onLogin])

  useEffect(() => {
    if (oauthToken == null || csrfToken == null || success) { return }
    const variables = { oauthToken, totpCode}
    submit({ variables })
  }, [oauthToken, csrfToken, called, totpCode])

  return { error, loading, data }
}
*/
