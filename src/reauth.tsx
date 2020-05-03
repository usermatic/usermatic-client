
import React, {
  ReactNode,
  useContext,
  MouseEvent,
  createContext,
  useMemo
} from 'react'

import { OperationVariables } from '@apollo/react-common'
import classNames from 'classnames'
import jwt from 'jsonwebtoken'
import ms from 'ms'

import { Formik, Form, Field, FormikValues, FormikErrors } from 'formik'

import { ErrorMessage } from './errors'
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

export const ReauthCacheProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const cache = useMemo(() => { return new ReauthTokenCache() }, [])
  return <ReauthCacheContext.Provider value={cache}>
    {children}
  </ReauthCacheContext.Provider>
}

type useReauthenticateOptions = {
  password?: string
}

export const useCachedReauthToken = (contents: string | object, maxAge?: string) => {
  const cacheKey = JSON.stringify(contents)
  const cache = useContext(ReauthCacheContext)
  return cache.getToken(cacheKey, maxAge)
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

const ReauthContext = React.createContext<string | undefined>(undefined)

export const useReauthToken = () => {
  return useContext(ReauthContext)
}

type ReauthenticateGuardProps = {
  children: ReactNode
  tokenContents: string | object
  maxTokenAge?: string
  onClose?: () => void
}

// Hides some other component behind a reauthentication prompt. After the
// user reauthenticates successfully, the children are displayed, and the
// reauthentication token is provided in a context, and can be retrieved by
// calling useReauthToken().
export const ReauthenticateGuard: React.FC<ReauthenticateGuardProps> =
({children, tokenContents, maxTokenAge = "2m", onClose}) => {

  const [submit, { data, called, loading, error }] = useReauthenticate(tokenContents)
  const cachedToken = useCachedReauthToken(tokenContents, maxTokenAge)

  const token = cachedToken != null
    ? cachedToken
    : (called && !error && !loading) ? data.signReauthenticationToken : null

  if (token) {
    return <ReauthContext.Provider value={token}>
      {children}
    </ReauthContext.Provider>
  }

  const initialValues = {
    password: ''
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {};

    if (!values.password) {
      errors.password = 'Required';
    }

    return errors;
  }

  const onSubmit = (variables: FormikValues) => {
    submit({ variables })
  }

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    if (onClose) { onClose() }
  }

  const buttonClasses = classNames("btn btn-primary", loading && "disabled")
  const cancelButtonClasses = "btn btn-secondary"

  return <div>
    <ErrorMessage error={error} />
    <div className="mb-3">Please enter your password:</div>
    <Formik onSubmit={onSubmit} initialValues={initialValues} validate={validate} >
      {(props) => (
        <Form id="reauth-guard-form">
          <div className="form-label-group">
            <Field id="reauth-guard-password" name="password" type="password"
                   className="form-control" placeholder="password" autoFocus />
          </div>
          <div className="d-flex justify-content-between">
            <button className={buttonClasses} type="submit">
              { loading ? 'Please wait...' : 'Submit' }
            </button>
            <button className={cancelButtonClasses} onClick={onClick}>
              Cancel
            </button>
          </div>
        </Form>
      )}
    </Formik>
  </div>
}
