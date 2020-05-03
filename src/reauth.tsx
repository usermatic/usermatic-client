
import React, {
  ReactNode,
  useContext,
  createContext,
  useMemo
} from 'react'

import { OperationVariables } from '@apollo/react-common'
import jwt from 'jsonwebtoken'
import ms from 'ms'

import { useCsrfMutation } from './hooks'
import { SIGN_REAUTH_TOKEN_QUERY } from './fragments'

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
    const decoded = jwt.decode(token)
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

export const useCachedReauthToken = (contents: string | object, maxAge?: string) => {
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

type useReauthenticateOptions = {
  password?: string
}

export const useReauthenticate = (contents: string | object, options: useReauthenticateOptions = {}) => {
  contents = JSON.stringify(contents)

  const variables: OperationVariables = { contents }
  if (options.password != null) {
    variables.password = options.password
  }
  const cache = useContext(ReauthCacheContext)
  const ret = useCsrfMutation(SIGN_REAUTH_TOKEN_QUERY, { variables })
  const { data } = ret[1]
  if (data && data.signReauthenticationToken) {
    cache.cacheToken(contents, data.signReauthenticationToken)
  }
  return ret
}

export const ReauthContext = React.createContext<string | undefined>(undefined)

export const useReauthToken = () => {
  return useContext(ReauthContext)
}

