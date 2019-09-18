
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

const clientCache: Record<string, ClientType> = {}

export const makeClient = (uri: string): ClientType => {
  if (!(uri in clientCache)) {
    console.log('makeClient for ', uri)
    clientCache[uri] = new ApolloClient({
      link: createHttpLink({ uri, fetch, credentials: 'include' }),
      cache: new InMemoryCache()
    })
  }
  return clientCache[uri]
}

// We want to provide an apollo client to everything in the app, but
// we can't just use ApolloProvider, as that would conflict with the user's
// ApolloProvider (if they are using apollo).
export const UMApolloContext = createContext<ClientType | undefined>(undefined)

export const UMTokenContext = createContext<AuthTokenData | undefined>(undefined)
export const UMTokenConsumer = UMTokenContext.Consumer

export const UMSiteIdContext = createContext<string | undefined>(undefined)

const WrappedUsermaticAuthProvider: React.FC<{children: ReactNode}> = ({children}) => {

  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)

  const {data, error, loading} = useQuery(SESSION_QUERY,
    { variables: { siteId }, client })

  const tokenValue: AuthTokenData = { error, loading }
  if (!loading && !error && data.svcGetSessionJWT) {
    const { user_jwt } = data.svcGetSessionJWT
    const { id } = jwt.decode(user_jwt) as Record<string, string>
    tokenValue.id = id
    tokenValue.userJwt = user_jwt
  }

  return <UMTokenContext.Provider value={tokenValue}>
    {children}
  </UMTokenContext.Provider>
}

type UsermaticAuthProviderProps = {
  children: ReactNode,
  uri: string,
  siteId: string
}

export const UsermaticAuthProvider: React.FC<UsermaticAuthProviderProps> = ({children, uri, siteId}) => {

  // creating the client in the same component that uses it can cause an infinite render() loop,
  // so we put the uses of the client in a wrapper component.
  const client = makeClient(uri)

  return (
    <UMSiteIdContext.Provider value={siteId}>
    <UMApolloContext.Provider value={client}>
      <WrappedUsermaticAuthProvider>
        {children}
      </WrappedUsermaticAuthProvider>
    </UMApolloContext.Provider>
    </UMSiteIdContext.Provider>
  )
}
