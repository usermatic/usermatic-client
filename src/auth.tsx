
import url  from 'url'
import React, { ReactNode, createContext, useContext } from 'react'

if (typeof window != 'undefined') {
  const w = window as any
  w.React1 = React
}

import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-unfetch'
import { createHttpLink } from "apollo-link-http"
import { ApolloClient, NormalizedCacheObject } from 'apollo-boost'
import { InMemoryCache } from "apollo-cache-inmemory"

import { ApolloError } from 'apollo-client'
import { useQuery } from '@apollo/react-hooks'

import { SESSION_QUERY } from './fragments'

export type ClientType = ApolloClient<NormalizedCacheObject>

export type AuthTokenData = {
  error?: ApolloError,
  loading: boolean,

  id?: string,
  userJwt?: string,
}

export const makeClient = (uri: string, siteId: string, csrfToken?: string): ClientType => {
  const headers = csrfToken && { 'x-csrf-token': csrfToken }
  const parsed = url.parse(uri, true)
  delete parsed.search
  parsed.query.siteId = siteId
  return new ApolloClient({
    link: createHttpLink({ uri: url.format(parsed), fetch, credentials: 'include', headers }),
    cache: new InMemoryCache()
  })
}

// We want to provide an apollo client to everything in the app, but
// we can't just use ApolloProvider, as that would conflict with the user's
// ApolloProvider (if they are using apollo).
export const UMApolloContext = createContext<ClientType | undefined>(undefined)

export const UMTokenContext = createContext<AuthTokenData | undefined>(undefined)
export const UMTokenConsumer = UMTokenContext.Consumer

export const UMSiteIdContext = createContext<string | undefined>(undefined)
export const UMUriContext = createContext<string | undefined>(undefined)

export const useCredentials = (): AuthTokenData => {
  const tokenData = useContext(UMTokenContext)
  if (!tokenData) {
    throw new Error("useCredentials must be called inside a UMTokenContext.Provider")
  }
  return tokenData
}

const WrappedUsermaticAuthProvider: React.FC<{children: ReactNode}> = ({children}) => {

  const uri = useContext(UMUriContext)
  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)

  const {data, error, loading} = useQuery(SESSION_QUERY,
    { variables: { siteId }, client })

  const tokenValue: AuthTokenData = { error, loading }
  let csrfToken
  if (!loading && !error && data.svcGetSessionJWT) {
    csrfToken = data.svcGetSessionJWT.csrfToken
    // TODO: if csrfToken is missing, most/all subsequent requests will fail. the graphql
    // schema should ensure we have it however.
    const { auth } = data.svcGetSessionJWT
    if (auth) {
      const { userJwt } = auth
      const { id } = jwt.decode(userJwt) as Record<string, string>
      tokenValue.id = id
      tokenValue.userJwt = userJwt
    }
  }

  if (!uri) {
    throw new Error("WrappedUsermaticAuthProvider must be inside a UMUriContext")
  }
  if (!siteId) {
    throw new Error("WrappedUsermaticAuthProvider must be inside a UMSiteIdContext")
  }

  // Now that we have a csrfToken, we need to mask the previous client with one that will
  // always send the csrf token as a header.
  const csrfClient = makeClient(uri, siteId, csrfToken)

  return <UMApolloContext.Provider value={csrfClient}>
    <UMTokenContext.Provider value={tokenValue}>
      {children}
    </UMTokenContext.Provider>
  </UMApolloContext.Provider>
}

type UsermaticAuthProviderProps = {
  children: ReactNode,
  uri: string,
  siteId: string
}

export const UsermaticAuthProvider: React.FC<UsermaticAuthProviderProps> = ({children, uri, siteId}) => {

  // creating the client in the same component that uses it can cause an infinite render() loop,
  // so we put the uses of the client in a wrapper component.
  const client = makeClient(uri, siteId)

  return (
    <UMUriContext.Provider value={uri}>
    <UMSiteIdContext.Provider value={siteId}>
    <UMApolloContext.Provider value={client}>
      <WrappedUsermaticAuthProvider>
        {children}
      </WrappedUsermaticAuthProvider>
    </UMApolloContext.Provider>
    </UMSiteIdContext.Provider>
    </UMUriContext.Provider>
  )
}
