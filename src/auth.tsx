
import url  from 'url'
import React, {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react'

import jwtDecode from 'jwt-decode'
import fetch from 'isomorphic-unfetch'
import { createHttpLink } from "apollo-link-http"
import { ApolloClient, NormalizedCacheObject } from 'apollo-boost'

import {
  InMemoryCache,
  defaultDataIdFromObject
} from 'apollo-cache-inmemory'

import { ApolloError } from 'apollo-client'
import { getApolloContext } from '@apollo/react-common'

import {
  ComponentProvider
} from './components/component-lib'

import {
  Components
} from './components/component-types'

import {
  useGetAppConfigQuery,
  useGetSessionJwtMutation,
  useGetAuthenticatedUserQuery,
  AppConfig
} from '../gen/operations'

import { ReauthCacheProvider } from './reauth'
import { ErrorMessage } from './errors'
import { CsrfContext, useCsrfQuery, useCsrfToken } from './hooks'

export type ClientType =
  ApolloClient<NormalizedCacheObject> |
  ApolloClient<object> // used in the tests.

export type AuthTokenData = {
  error?: ApolloError,
  loading: boolean,

  id?: string,
  userJwt?: string,
}

const defaultAppConfig: AppConfig = {
  totpEnabled: false,
  fbLoginEnabled: false,
  fbLoginUrl: 'https://usermatic.io/auth/facebook',
  googleLoginEnabled: false,
  googleLoginUrl: 'https://usermatic.io/auth/google',
  githubLoginEnabled: false,
  githubLoginUrl: 'https://usermatic.io/auth/github',
}

const makeClient = (uri: string, appId: string): ClientType => {
  const parsed = url.parse(uri, true)
  delete parsed.search
  parsed.query.appId = appId

  const finalUri = url.format(parsed)

  const cache = new InMemoryCache({
    dataIdFromObject: object => {
      switch (object.__typename) {
        case 'Query': return 'ROOT_QUERY'
        default: return defaultDataIdFromObject(object)
      }
    },
  })

  return new ApolloClient({
    link: createHttpLink({
      uri: finalUri,
      fetch,
      credentials: 'include',
      headers: { 'X-Usermatic': 'Usermatic' }
    }),
    cache
  })
}

// We want to provide an apollo client to everything in the app, but
// we can't just use ApolloProvider, as that would conflict with the user's
// ApolloProvider (if they are using apollo).
export const UMApolloContext = createContext<ClientType | undefined>(undefined)

export const AppIdContext = createContext<string | undefined>(undefined)

/**
 * Gets the current application ID (as passed to the <Usermatic> component).
 */
export const useAppId = (): string => {
  const ret = useContext(AppIdContext)
  if (typeof ret !== 'string') {
    throw new Error("useAppId() must be used from within an Usermatic")
  }
  return ret
}

/**
 * Returns the logged-in user's user id, as well as their signed
 * authentication token.
 *
 * @example
 *
 * const { userJwt } = useToken()
 *
 * if (userJwt) {
 *   // Send a query to our backend and include the logged in user's authToken
 *   fetch('/api/hello', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Accept': 'application/json',
 *       'Authorization': userJwt
 *     },
 *     body: JSON.stringify({query: "{ hello }"})
 *   }).then((result) => {
 *     return result.json()
 *   }).then((json) => {
 *     setResponse(json)
 *   })
 * }
 */
export const useToken = (): AuthTokenData => {
  const { data, loading, error } = useAuthenticatedUser()

  let userJwt: string | undefined, id: string | undefined

  if (!loading && !error && data?.getAuthenticatedUser) {
    userJwt = data.getAuthenticatedUser.userJwt ?? undefined
    if (userJwt) {
      try {
        const decoded = jwtDecode(userJwt) as Record<string, string>
        id = decoded.id
      } catch (err) {
        console.error(`invalid token '${userJwt}'`, err)
      }
    }
  }
  return {
    error,
    loading,
    id,
    userJwt
  }
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
          {' '}to <code>&lt;Usermatic&gt;</code>, but
          it is either not a known appId, or the app to which it refers is not configured to accept
          authentication requests from the current origin, which is <code>{document.location.origin}</code>.
        </>
      : <>
          It appears that you have not provided a valid <code>appId</code> property to
          the <code>&lt;Usermatic&gt;</code> component.
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

export const AuthenticatedUserContext = React.createContext<
  ReturnType<typeof useGetAuthenticatedUserQuery> | undefined
>(undefined)

export const useAuthenticatedUser = () => {
  const ret = useContext(AuthenticatedUserContext)
  if (!ret) {
    throw new Error("useAuthenticatedUser must be inside AuthenticatedUserProvider")
  }
  return ret
}

const AuthenticatedUserProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const { csrfToken } = useCsrfToken()
  const value = useCsrfQuery(useGetAuthenticatedUserQuery, { skip: !csrfToken })
  return <AuthenticatedUserContext.Provider value={value}>
    {children}
  </AuthenticatedUserContext.Provider>
}

const CsrfTokenProvider: React.FC<{
  appId: string,
  showDiagnostics: boolean,
  children: ReactNode
}> = ({appId, showDiagnostics, children}) => {

  const client = useContext(UMApolloContext)

  const [submit, {data, error, loading}] = useGetSessionJwtMutation(
    { client }
  )

  useEffect(() => {
    submit({ variables: { appId } })
  }, [appId])

  let csrfToken: string | undefined
  if (!loading && !error && data && data.getSessionJWT) {
    csrfToken = data.getSessionJWT.csrfToken
  }

  useEffect(() => {
    if (error) {
      console.error("Usermatic is not configured correctly.")
      console.error("Error:", error)
      if (!showDiagnostics) {
        console.error('To enable diagnostics, add the `showDiagnostics`'
          + 'property to your <Usermatic> component, as follows:\n\n'
          + '  <Usermatic showDiagnostics appId={appId}>')
      }
    }
  }, [error, showDiagnostics])

  const value = useMemo(() => ({ csrfToken }), [csrfToken])
  return <CsrfContext.Provider value={value}>
    {error && showDiagnostics && <Diagnostics appId={appId} error={error} />}
    {children}
  </CsrfContext.Provider>
}

const UMApolloProvider: React.FC<{
  uri?: string,
  appId: string,
  children: ReactNode
}> = ({uri: uriArg, appId, children}) => {

  let uri = uriArg ?? 'https://api.usermatic.io/graphql'
  if (appId === demoAppId) {
    uri = uri.replace(/graphql$/, 'graphql-demo')
  }

  const apolloVal = useContext(getApolloContext())

  const client = useMemo(() => {
    if (apolloVal.client) {
      return apolloVal.client
    } else {
      return makeClient(uri, appId)
    }
  }, [apolloVal, uri, appId])

  return <UMApolloContext.Provider value={client}>
    {children}
  </UMApolloContext.Provider>
}

export const demoAppId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

export type UsermaticProps = {
  /**
   * The React components within which Usermatic will be used.
   * (Typically your entire application).
   */
  children: ReactNode,
  /**
   * The URI of the Usermatic API endpoint. For development use only.
   */
  uri?: string,
  /**
   * The ID of the Usermatic Application.
   */
  appId: string,
  /**
   * If true, add bootstrap class names to Usermatic components. Use this
   * if your application uses bootstrap. Defaults to true.
   */
  useBootstrapClasses?: boolean,
  /**
   * If true, add class names begining with the `um-` prefix to Usermatic
   * HTML elements, so that you can style Usermatic with your own CSS.
   * Defaults to false.
   */
  useUmClasses?: boolean,
  /**
   * If true, insert Usermatic diagnostics into your application. Defaults
   * to false.
   */
  showDiagnostics?: boolean,
  /**
   * Provide custom display components to use when rendering Usermatic
   * components.
   */
  components?: Components
}

/**
 * Usermatic is the wrapper component for all Usermatic applications.
 */
export const Usermatic: React.FC<UsermaticProps> = ({
  children,
  uri,
  appId,
  components,
  useBootstrapClasses = true,
  useUmClasses = false,
  showDiagnostics = false
}) => (
  <AppIdContext.Provider value={appId}>
    <UMApolloProvider uri={uri} appId={appId}>
      <CsrfTokenProvider appId={appId} showDiagnostics={showDiagnostics}>
        <AuthenticatedUserProvider>
          <ReauthCacheProvider>
            <HttpWarning />
            <ComponentProvider
              components={components}
              bootstrapClasses={useBootstrapClasses}
              usermaticClasses={useUmClasses}
            >
              {children}
            </ComponentProvider>
          </ReauthCacheProvider>
        </AuthenticatedUserProvider>
      </CsrfTokenProvider>
    </UMApolloProvider>
  </AppIdContext.Provider>
)

export const useAppConfig = (): AppConfig => {
  const appId = useAppId()
  const { loading, error, data } = useCsrfQuery(useGetAppConfigQuery, {
    variables: { appId }
  })
  if (loading || error || !data) {
    return defaultAppConfig
  } else {
    return data.getAppConfig
  }
}
