
import urllib from 'url'
import { useContext, useEffect, useState } from 'react'
import jwt from 'jsonwebtoken'

import { useToken, AppIdContext, useAppId } from './auth'
import { useCsrfToken, useCsrfMutation } from './hooks'

import {
  LOGIN_MUT,
  OAUTH_LOGIN_MUT,
  LOGOUT_MUT,
  CREATE_ACCOUNT_MUT,
  SESSION_QUERY
} from './fragments'

export const useLogout = () => {
  const appId = useContext(AppIdContext)

  const [submit, ret] =
    useCsrfMutation(
      LOGOUT_MUT,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      }
    )

  const { loading, error, data } = ret

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export type LoginSubmitArgs = {
  email: string
  password: string
  stayLoggedIn: boolean
}

export const useLogin = () => {
  const appId = useContext(AppIdContext)

  const [submitLogin, ret] =
    useCsrfMutation(
      LOGIN_MUT,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      }
    )

  const { loading, error, data } = ret

  const submit = (values: LoginSubmitArgs) => {
    submitLogin({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  // typescript can't infer tuples :(
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export type CreateAccountArgs = LoginSubmitArgs

export const useCreateAccount = () => {
  const appId = useContext(AppIdContext)
  const [submitCreateAccount, ret] =
    useCsrfMutation(
      CREATE_ACCOUNT_MUT,
      {
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      })

  const { loading, error, data } = ret

  const submit = (values: CreateAccountArgs) => {
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

    const { nonce } = jwt.decode(umOauthToken) as { nonce: string }

    const { umAuthNonce } = window.localStorage

    if (umAuthNonce == null || nonce == null || umAuthNonce !== nonce) {
      // TODO: give up and redirect somewhere
      return
    }

    setToken(umOauthToken)
  })

  return token
}

export const useOauthLogin = ({onLogin, oauthToken}: { onLogin?: () => void, oauthToken?: string }) => {
  const { csrfToken } = useCsrfToken()
  const appId = useAppId() as string
  const { id, loading: tokenLoading } = useToken()

  const [submit, { data, loading, error, called }] = useCsrfMutation(
    OAUTH_LOGIN_MUT,
    {
      refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
    }
  )

  useEffect(() => {
    // need to wait until the login mutation is complete *and* we've updated the
    // token.
    if (called && !loading && !error && id && !tokenLoading) {
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
  }, [called, loading, error, id, tokenLoading, onLogin])

  useEffect(() => {
    if (oauthToken == null || csrfToken == null || called) { return }
    submit({ variables: { oauthToken } })
  }, [oauthToken, csrfToken, called])

  return { error, loading, data }
}
