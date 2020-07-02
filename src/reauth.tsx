
import React, {
  ReactNode,
  useContext,
  createContext,
  useMemo
} from 'react'

import jwtDecode from 'jwt-decode'
import ms from 'ms'

import { useCsrfMutation } from './hooks'
import {
  useSignReauthenticationTokenMutation,
  SignReauthenticationTokenMutationVariables
} from '../gen/operations'

type CacheEntry = {
  token: string
  iat: number
}

class ReauthTokenCache {

  cache: Record<string, CacheEntry>

  constructor () {
    this.cache = {}
  }

  cacheToken (key: string, token: string): void {
    const decoded = jwtDecode(token) as { iat: number }
    if (!decoded) {
      throw new Error("invalid token")
    }

    if (typeof decoded === 'string') {
      this.cache[key] = { token, iat: Date.now() / 1000 }
    } else {
      this.cache[key] = { token, iat: decoded.iat }
    }
  }

  getToken (key: string = '', maxAge?: string): string | null {
    const entry = this.cache[key]
    if (entry == null) { return null }

    const { token, iat } = entry

    if (maxAge == null) { return token }

    const now = Date.now() / 1000
    var milliseconds = ms(maxAge)
    if (milliseconds == null) {
      throw new Error("maxAge should be a string like '60s', '2m', etc")
    }
    const maxAgeSeconds = milliseconds / 1000
    const tokenAge = now - iat
    if (tokenAge > maxAgeSeconds) {
      return null
    }

    return token
  }
}

const ReauthCacheContext = createContext<ReauthTokenCache>(new ReauthTokenCache)

/**
 * Return a cached reauthentication token, if one exists, which has the given
 * contents and is no older than `maxAge`.
 *
 * NB: You should usually use <ReauthenticateGuard> instead of using this hook directly.
 * <ReauthenticateGuard> will check for a cached token before prompting the user
 * for their password.
 */
export const useCachedReauthToken = (
  contents: string | object,
  maxAge?: string
) => {
  const cacheKey = JSON.stringify(contents)
  const cache = useContext(ReauthCacheContext)
  return cache.getToken(cacheKey, maxAge)
}

export const ReauthCacheProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const cache = useMemo(() => { return new ReauthTokenCache() }, [])
  return <ReauthCacheContext.Provider value={cache}>
    {children}
  </ReauthCacheContext.Provider>
}

/**
 * Apollo Mutation hook for obtaining a reauthentication token by submitting
 * the user's password.
 *
 * NB: You should usually use <ReauthenticateGuard> instead of using this hook
 * directly.
 */
export const useReauthenticate = (contentsArg: string | object) => {
  const contents = JSON.stringify(contentsArg)

  const cache = useContext(ReauthCacheContext)
  const ret = useCsrfMutation(useSignReauthenticationTokenMutation, {})
  const { data } = ret[1]
  if (data && data.signReauthenticationToken) {
    cache.cacheToken(contents, data.signReauthenticationToken.token)
  }

  const [submit, obj] = ret
  const submitWrapper = (
    variables: Omit<SignReauthenticationTokenMutationVariables, 'contents'>) => {
    submit({ variables: {
      ...variables,
      contents
    }})
  }

  return [submitWrapper, obj] as [typeof submitWrapper, typeof obj]
}

export const ReauthContext = React.createContext<string | undefined>(undefined)

/**
 * Obtain the reauthentication token provided by <ReauthenticateGuard>.
 *
 * This token can be sent to your application backend in order to guard
 * sensitive actions, by proving that the user's password was entered within
 * some recent period of time.
 *
 * NB: See the <ReauthenticateGuard> documentation for an example of how to use
 * this hook.
 */
export const useReauthToken = (): string => {
  const ret = useContext(ReauthContext)
  if (ret == null) {
    throw new Error('useReauthToken must be within a ReauthContext')
  }
  return ret
}

