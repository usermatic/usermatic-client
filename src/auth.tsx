
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

import { SESSION_QUERY, PROFILE_QUERY } from './fragments'
import { UMCsrfContext, useCsrfQuery } from './hooks'

export type ClientType = ApolloClient<NormalizedCacheObject>

export type AuthTokenData = {
  error?: ApolloError,
  loading: boolean,

  id?: string,
  email?: string,
  userJwt?: string,
}

const clientCache: Record<string, any> = {}

export const makeClient = (uri: string, siteId: string): ClientType => {
  const parsed = url.parse(uri, true)
  delete parsed.search
  parsed.query.siteId = siteId

  const finalUri = url.format(parsed)
  if (!(finalUri in clientCache)) {
    clientCache[finalUri] = new ApolloClient({
      link: createHttpLink({
        uri: finalUri,
        fetch,
        credentials: 'include',
        headers: { 'X-Usermatic': 'Usermatic' }
      }),
      cache: new InMemoryCache()
    })
  }

  return clientCache[finalUri]
}

// We want to provide an apollo client to everything in the app, but
// we can't just use ApolloProvider, as that would conflict with the user's
// ApolloProvider (if they are using apollo).
export const UMApolloContext = createContext<ClientType | undefined>(undefined)

export const UMTokenContext = createContext<AuthTokenData | undefined>(undefined)
export const UMTokenConsumer = UMTokenContext.Consumer

export const UMSiteIdContext = createContext<string | undefined>(undefined)

export const useCredentials = (): AuthTokenData => {
  const tokenData = useContext(UMTokenContext)
  if (!tokenData) {
    throw new Error("useCredentials must be called inside a UMTokenContext.Provider")
  }
  return tokenData
}

const formatSiteId = (siteId: string | undefined) => {
  if (!siteId) { return 'undefined' }
  return siteId
}

const isValidSiteId = (siteId: string | undefined) => {
  if (!siteId) {
    return false
  }

  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return re.test(siteId)
}

const Diagnostics: React.FC<{siteId: string | undefined}> = ({siteId}) => {

  return <div className="usermatic-diagnostics alert alert-danger p-4">
    <strong>Usermatic is not configured correctly.</strong>
    <p/>
    { isValidSiteId(siteId)
      ? <>
          You've provided the valid-looking <code>siteId</code> property <code>{formatSiteId(siteId)}</code>
          {' '}to <code>&lt;UsermaticAuthProvider&gt;</code>, but
          it is either not a known siteId, or the site to which it refers is not configured to accept
          authentication requests from the current origin, which is <code>{document.location.origin}</code>.
        </>
      : <>
          It appears that you have not provided a valid <code>siteId</code> property to
          the <code>&lt;UsermaticAuthProvider&gt;</code> component.
          <p/>
          The <code>siteId</code> propertry should be a UUID such as <code>e3ede2c8-2809-498c-a047-4994e4fee393</code>.
          <p/>
          You provided <code>{formatSiteId(siteId)}</code>
        </>
    }
    <p/>
    Please visit the <a href="https://usermatic.io/dashboard">Usermatic Dashboard</a> to
    get the correct site ID for your application, or to configure the application to work with
    the current origin.
    <p/>
    <a className="font-italic" href="https://usermatic.io/docs#hideDiagnostics">I want to hide this message permanently</a>
  </div>
}

const WrappedUsermaticAuthProvider: React.FC<{children: ReactNode, showDiagnostics?: boolean}> =
  ({children, showDiagnostics}) => {

  if (showDiagnostics == null) {
    showDiagnostics = true
  }

  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)

  const {data, error, loading} = useQuery(SESSION_QUERY,
    { variables: { siteId }, client })

  const tokenValue: AuthTokenData = { error, loading }
  let csrfToken
  if (!loading && !error && data.svcGetSessionJWT) {
    csrfToken = data.svcGetSessionJWT.csrfToken
    // TODO: if csrfToken is missing, most/all subsequent requests will fail.
    const { auth } = data.svcGetSessionJWT
    if (auth) {
      const { userJwt } = auth
      const { id, email } = jwt.decode(userJwt) as Record<string, string>
      tokenValue.id = id
      tokenValue.email = email
      tokenValue.userJwt = userJwt
    }
  }

  return <UMCsrfContext.Provider value={csrfToken}>
    <UMTokenContext.Provider value={tokenValue}>
      {error && showDiagnostics && <Diagnostics siteId={siteId} />}
      {children}
    </UMTokenContext.Provider>
  </UMCsrfContext.Provider>
}

type UsermaticAuthProviderProps = {
  children: ReactNode,
  uri?: string,
  siteId: string,
  showDiagnostics?: boolean
}

export const UsermaticAuthProvider: React.FC<UsermaticAuthProviderProps> =
  ({children, uri, siteId, showDiagnostics}) => {

  if (!uri) {
    uri = 'https://api.usermatic.com/graphql'
  }

  const client = makeClient(uri, siteId)

  return (
    <UMSiteIdContext.Provider value={siteId}>
    <UMApolloContext.Provider value={client}>
      <WrappedUsermaticAuthProvider showDiagnostics={showDiagnostics}>
        {children}
      </WrappedUsermaticAuthProvider>
    </UMApolloContext.Provider>
    </UMSiteIdContext.Provider>
  )
}

export const useProfile = () => {
  const client = useContext(UMApolloContext)
  return useCsrfQuery(PROFILE_QUERY, { client })
}
