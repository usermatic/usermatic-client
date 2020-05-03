
import url  from 'url'
import React, {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'

import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-unfetch'
import { createHttpLink } from "apollo-link-http"
import { ApolloClient, NormalizedCacheObject } from 'apollo-boost'
import { InMemoryCache } from "apollo-cache-inmemory"

import { ApolloError } from 'apollo-client'
import { useQuery } from '@apollo/react-hooks'
import { getApolloContext } from '@apollo/react-common'

import { ReauthCacheProvider } from './reauth'
import { ErrorMessage } from './errors'
import { SESSION_QUERY } from './fragments'
import { CsrfContext } from './hooks'

export type ClientType =
  ApolloClient<NormalizedCacheObject> |
  ApolloClient<object> // used in the tests.

export type AuthTokenData = {
  error?: ApolloError,
  loading: boolean,

  id?: string,
  userJwt?: string,
}

export type AppConfig = {
  minPasswordStrength?: number
  fbLoginEnabled: boolean
  fbLoginUrl: string
  googleLoginEnabled: boolean
  googleLoginUrl: string
  githubLoginEnabled: boolean
  githubLoginUrl: string
}

const defaultAppConfig = {
  fbLoginEnabled: false,
  fbLoginUrl: 'https://usermatic.io/auth/facebook',
  googleLoginEnabled: false,
  googleLoginUrl: 'https://usermatic.io/auth/google',
  githubLoginEnabled: false,
  githubLoginUrl: 'https://usermatic.io/auth/github',
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

export const TokenContext = createContext<AuthTokenData | undefined>(undefined)

const AppConfigContext = createContext<AppConfig>(defaultAppConfig)

export const AppConfigConsumer = AppConfigContext.Consumer

export const AppIdContext = createContext<string | undefined>(undefined)

export const useAppId = (): string | undefined => {
  return useContext(AppIdContext)
}

export const useToken = (): AuthTokenData => {
  const tokenData = useContext(TokenContext)
  if (!tokenData) {
    throw new Error("useToken must be called inside a TokenContext.Provider")
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

const HttpWarning: React.FC<{}> = ({}) => {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    if (dismissed != null) {
      return
    }
    if (location.protocol === 'https:' ||
        /^(localhost|[-a-zA-Z0-9.]+\.local)(:[0-9]+)?$/.test(location.hostname)) {
      setDismissed(true)
    }
  })

  if (dismissed == null || dismissed) {
    return null
  }

  return <div className="usermatic-diagnostics alert alert-danger p-4">
    <strong>Usermatic is being used on an unencrypted (<code>http:</code>) page.</strong>
    <button type="button" className="close" aria-label="Close"
            onClick={(e) => { e.preventDefault(); setDismissed(true) }}>
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
}

const Diagnostics: React.FC<{appId?: string, error?: ApolloError}> = ({appId, error}) => {

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
    <ErrorMessage error={error}/>
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

const WrappedAuthProvider: React.FC<{children: ReactNode, showDiagnostics: boolean}> =
  ({children, showDiagnostics}) => {

  const client = useContext(UMApolloContext)
  const appId = useContext(AppIdContext)

  const {data, error, loading, refetch} = useQuery(SESSION_QUERY,
    { variables: { appId }, client })

  let appConfig = { ...defaultAppConfig }

  const tokenValue: AuthTokenData = { error, loading }
  let csrfToken
  if (!loading && !error && data.svcGetSessionJWT) {
    csrfToken = data.svcGetSessionJWT.csrfToken
    // TODO: if csrfToken is missing, most/all subsequent requests will fail.
    const { auth, config } = data.svcGetSessionJWT
    if (auth) {
      const { userJwt } = auth
      const { id } = jwt.decode(userJwt) as Record<string, string>
      tokenValue.id = id
      tokenValue.userJwt = userJwt
    }
    appConfig = config
  }

  useEffect(() => {
    if (error) {
      console.error("Usermatic is not configured correctly.")
      console.error("Error:", error)
      if (!showDiagnostics) {
        console.error('To enable diagnostics, add the `showDiagnostics`'
          + 'property to your <AuthProvider> component, as follows:\n\n'
          + '  <AuthProvider showDiagnostics appId={appId}>')
      }
    }
  }, [error, showDiagnostics])

  return <CsrfContext.Provider value={{ csrfToken, refetch }}>
    <AppConfigContext.Provider value={appConfig}>
      <TokenContext.Provider value={tokenValue}>
        <ReauthCacheProvider>
          <HttpWarning />
          {error && showDiagnostics && <Diagnostics appId={appId} error={error} />}
          {children}
        </ReauthCacheProvider>
      </TokenContext.Provider>
    </AppConfigContext.Provider>
  </CsrfContext.Provider>
}

type AuthProviderProps = {
  children: ReactNode,
  uri?: string,
  appId: string,
  showDiagnostics?: boolean
}

export const AuthProvider: React.FC<AuthProviderProps> =
  ({children, uri, appId, showDiagnostics = false}) => {

  if (!uri) {
    uri = 'https://api.usermatic.io/graphql'
  }

  const apolloCtx = getApolloContext()
  const apolloVal = useContext(apolloCtx)
  const client = apolloVal.client ?? makeClient(uri, appId)

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

export const useAppConfig = () => {
  return useContext(AppConfigContext)
}
