
import url  from 'url'
import React, { ReactNode, createContext, useContext, useState } from 'react'

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
import { CsrfContext, useCsrfQuery } from './hooks'

export type ClientType = ApolloClient<NormalizedCacheObject>

export type AuthTokenData = {
  error?: ApolloError,
  loading: boolean,

  id?: string,
  email?: string,
  userJwt?: string,
}

const clientCache: Record<string, any> = {}

export const makeClient = (uri: string, appId: string): ClientType => {
  const parsed = url.parse(uri, true)
  delete parsed.search
  parsed.query.appId = appId

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

const CredentialContext = createContext<AuthTokenData | undefined>(undefined)
export const CredentialConsumer = CredentialContext.Consumer

export const AppIdContext = createContext<string | undefined>(undefined)

export const useCredentials = (): AuthTokenData => {
  const tokenData = useContext(CredentialContext)
  if (!tokenData) {
    throw new Error("useCredentials must be called inside a CredentialContext.Provider")
  }
  return tokenData
}

const formatAppId = (appId: string | undefined) => {
  if (!appId) { return 'undefined' }
  return appId
}

const isValidAppId = (appId: string | undefined) => {
  if (!appId) {
    return false
  }

  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return re.test(appId)
}

const Diagnostics: React.FC<{appId: string | undefined}> = ({appId}) => {

  const [dismissed, setDismissed] = useState(false)
  if (dismissed) {
    return null
  }

  return <div className="usermatic-diagnostics alert alert-danger p-4">
    <strong>Usermatic is not configured correctly.</strong>
    <button type="button" className="close" aria-label="Close"
            onClick={(e) => { e.preventDefault(); setDismissed(true) }}>
      <span aria-hidden="true">&times;</span>
    </button>
    <p/>
    { isValidAppId(appId)
      ? <>
          You've provided the valid-looking <code>appId</code> property <code>{formatAppId(appId)}</code>
          {' '}to <code>&lt;AuthProvider&gt;</code>, but
          it is either not a known appId, or the app to which it refers is not configured to accept
          authentication requests from the current origin, which is <code>{document.location.origin}</code>.
        </>
      : <>
          It appears that you have not provided a valid <code>appId</code> property to
          the <code>&lt;AuthProvider&gt;</code> component.
          <p/>
          The <code>appId</code> propertry should be a UUID such as <code>e3ede2c8-2809-498c-a047-4994e4fee393</code>.
          <p/>
          You provided <code>{formatAppId(appId)}</code>
        </>
    }
    <p/>
    Please visit the <a href="https://usermatic.io/dashboard">Usermatic Dashboard</a> to
    get the correct app ID for your application, or to configure the application to work with
    the current origin.
    <p/>
    <a className="font-italic" href="https://usermatic.io/docs#hideDiagnostics">I want to hide this message permanently</a>
  </div>
}

const WrappedAuthProvider: React.FC<{children: ReactNode, showDiagnostics?: boolean}> =
  ({children, showDiagnostics}) => {

  if (showDiagnostics == null) {
    showDiagnostics = true
  }

  const client = useContext(UMApolloContext)
  const appId = useContext(AppIdContext)

  const {data, error, loading} = useQuery(SESSION_QUERY,
    { variables: { appId }, client })

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

  return <CsrfContext.Provider value={csrfToken}>
    <CredentialContext.Provider value={tokenValue}>
      {error && showDiagnostics && <Diagnostics appId={appId} />}
      {children}
    </CredentialContext.Provider>
  </CsrfContext.Provider>
}

type AuthProviderProps = {
  children: ReactNode,
  uri?: string,
  appId: string,
  showDiagnostics?: boolean
}

export const AuthProvider: React.FC<AuthProviderProps> =
  ({children, uri, appId, showDiagnostics}) => {

  if (!uri) {
    uri = 'https://api.usermatic.com/graphql'
  }

  const client = makeClient(uri, appId)

  return (
    <AppIdContext.Provider value={appId}>
    <UMApolloContext.Provider value={client}>
      <WrappedAuthProvider showDiagnostics={showDiagnostics}>
        {children}
      </WrappedAuthProvider>
    </UMApolloContext.Provider>
    </AppIdContext.Provider>
  )
}

export const useProfile = () => {
  const client = useContext(UMApolloContext)
  return useCsrfQuery(PROFILE_QUERY, { client })
}
