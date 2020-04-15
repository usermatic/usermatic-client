
import urllib from 'url'
import React, { ReactNode, useContext, useEffect, useState, MouseEvent } from 'react'
import { ApolloError } from 'apollo-client'
import { GraphQLError } from 'graphql'
import classNames from 'classnames'
import jwt from 'jsonwebtoken'

import { useToken, UMApolloContext, AppIdContext, useAppConfig, useAppId } from './auth'
import { useCrsfToken, useCsrfMutation } from './hooks'
import { useForm, InputValueMap, InputLabel } from './forms'
import { ErrorMessage } from './errors'
import { PasswordScore, RequestPasswordResetForm } from './passwords'

import { FaFacebookSquare as FbLogo, FaGoogle as GoogleLogo } from 'react-icons/fa'
import { GoMarkGithub as GithubLogo } from 'react-icons/go'

import {
  LOGIN_MUT,
  OAUTH_LOGIN_MUT,
  LOGOUT_MUT,
  CREATE_ACCOUNT_MUT,
  SESSION_QUERY
} from './fragments'

const getId = (prefix: string | undefined, suffix: string) => {
  if (prefix) {
    return `${prefix}-${suffix}`
  } else {
    // add some random goobledygook to avoid conflicts with other component
    // libraries.
    return `um3kfiekd-${suffix}`
  }
}

export const useLogout = () => {
  const client = useContext(UMApolloContext)
  const appId = useContext(AppIdContext)

  const [submit, ret] =
    useCsrfMutation(
      LOGOUT_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      }
    )

  const { loading, error, data } = ret

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useLogin = () => {
  const client = useContext(UMApolloContext)
  const appId = useContext(AppIdContext)

  const [submitLogin, ret] =
    useCsrfMutation(
      LOGIN_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      }
    )

  const { loading, error, data } = ret

  const submit = (values: InputValueMap) => {
    submitLogin({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  // typescript can't infer tuples :(
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useCreateAccount = () => {
  const client = useContext(UMApolloContext)
  const appId = useContext(AppIdContext)
  const [submitCreateAccount, ret] =
    useCsrfMutation(
      CREATE_ACCOUNT_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }]
      })

  const { loading, error, data } = ret

  const submit = (values: InputValueMap) => {
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

const useOauthToken = () => {
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

const useOauthLogin = ({onLogin, oauthToken}: { onLogin?: () => void, oauthToken?: string }) => {
  const client = useContext(UMApolloContext)
  const { csrfToken } = useCrsfToken()
  const appId = useAppId() as string
  const { id, loading: tokenLoading } = useToken()

  const [submit, { data, loading, error, called }] = useCsrfMutation(
    OAUTH_LOGIN_MUT,
    {
      client,
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

type LoginFormProps = {
  onLogin?: () => void

  // If for some reason, you have conflicts with the IDs nodes generated by
  // LoginForm, you can add a id prefix.
  // This can also be useful if you need to embed more than one AccountCreationForm
  // in the same page.
  idPrefix?: string

  // Render labels before inputs in the form (default true)
  labelsFirst?: boolean
}

const SocialLoginButton: React.FC<{
  onClick: (e: MouseEvent) => void,
  buttonClasses: string,
  children: ReactNode
}> = ({onClick, buttonClasses, children}) => (
  <div className="d-flex justify-content-center my-2">
    <button className={classNames("btn btn-block btn-outline-primary d-flex align-items-center justify-content-between", buttonClasses)}
      onClick={onClick}>
      {children}
    </button>
  </div>
)

const makeNonce = () => {
  // @ts-ignore
  const crypto = window.crypto || window.msCrypto

  if (crypto == null) {
    throw new Error("Error: No crypto implementation available")
  }

  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)

  const ret = []
  for (let i = 0; i < arr.length; i++) {
    ret.push(arr[i].toString(16))
  }
  return ret.join('')
}

type ChildWindow = {
  open: (url: string) => void
  close: () => void
}

const useChildWindow = (name: string, callback: (msg: any) => void): ChildWindow => {

  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [childWindow, setChildWindow] = useState<Window | null>(null)
  const [curCallback, setCurCallback] = useState<((event: any) => void) | null>(null)

  const close = () => {
    if (childWindow != null) {
      childWindow.close()
      setChildWindow(null)
      setPrevUrl(null)
    }
  }

  const open = (url: string) => {
    const top = window.screenY + (window.screen.height - 700) / 2
    const left = window.screenX + (window.screen.width - 600) / 2

    const features =
     `toolbar=no, menubar=no, width=600, height=700, top=${top}, left=${left}`

    let newWindow: Window | null = null
    if (childWindow === null || childWindow.closed) {
      // if the pointer to the window object in memory does not exist
      // or if such pointer exists but the window was closed
      newWindow = window.open(url, name, features)
    } else if (prevUrl !== url) {
      // if the resource to load is different,
      // then we load it in the already opened secondary window and then
      // we bring such window back on top/in front of its parent window. */
      newWindow = window.open(url, name, features)
      newWindow?.focus()
    } else {
      // else the window reference must exist and the window
      // is not closed; therefore, we can bring it back on top of any other
      // window with the focus() method. There would be no need to re-create
      // the window or to reload the referenced resource. */
      childWindow.focus()
    }

    if (newWindow != null) {
      if (curCallback != null) {
        window.removeEventListener('message', curCallback, false)
      }

      const callbackWrapper = (event: any) => {
        // We get null events sometimes, i have no idea why
        if (event == null) { return }
        if (event.origin !== window.origin) {
          console.error(`ignored cross-origin message from ${event.origin}`)
          return
        }
        // event.source is documented here at
        // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
        // It matches the WindowProxy we got from window.open, whereas
        // event.srcElement matches the current window, and isn't what we
        // want.
        // TODO: this apparently won't work on IE11. find a workaround
        if (event.source !== newWindow) {
          return
        }
        callback(event.data)
      }

      window.addEventListener('message', callbackWrapper, false)

      setChildWindow(newWindow)
      setPrevUrl(url)
      setCurCallback(callbackWrapper)
    }
  }

  return { open, close }
}

const makeLoginFn = (childWindow: ChildWindow, appId: string, url: string) => (
  (e: MouseEvent) => {
    e.preventDefault()
    const nonce = makeNonce()
    window.localStorage.umAuthNonce = nonce
    const childUrl = `${url}?appId=${appId}&nonce=${nonce}`

    childWindow.open(childUrl)
  }
)



const SocialButtons: React.FC<{popupWindow: ChildWindow}> = ({popupWindow}) => {

  const appId = useAppId() as string

  const {
    fbLoginEnabled,
    fbLoginUrl,
    googleLoginEnabled,
    googleLoginUrl,
    githubLoginEnabled,
    githubLoginUrl,
  } = useAppConfig()

  const loginWithFacebook = makeLoginFn(popupWindow, appId, fbLoginUrl)
  const loginWithGoogle = makeLoginFn(popupWindow, appId, googleLoginUrl)
  const loginWithGithub = makeLoginFn(popupWindow, appId, githubLoginUrl)

  if (!fbLoginEnabled && !googleLoginEnabled && !githubLoginEnabled) {
    return null
  } else {
    // poor man's name mangling... We just need to avoid
    // conflicting with apps that use this library.
    const nonce = '3kdic7az9'
    const buttonClass = (provider: string) => {
      return `${provider}-login-btn-${nonce}`
    }
    return <div className="my-5">
      <style>{`
          .facebook-login-btn-${nonce} {
            color: white !important;
            background-color: #4267b2 !important;
            border-color: #4267b2 !important;
          }
          .facebook-login-btn-${nonce}:hover {
            color: #4267b2 !important;
            background-color: white !important;
          }

          .google-login-btn-${nonce} {
            color: white !important;
            background-color: #ea4335 !important;
            border-color: #ea4335 !important;
          }
          .google-login-btn-${nonce}:hover {
            color: #ea4335 !important;
            background-color: white !important;
          }

          .github-login-btn-${nonce} {
            color: white !important;
            background-color: rgb(21, 20, 19) !important;
            border-color: rgb(21, 20, 19) !important;
          }
          .github-login-btn-${nonce}:hover {
            color: rgb(21, 20, 19) !important;
            background-color: white !important;
          }
      `}</style>
      { githubLoginEnabled &&
        <SocialLoginButton onClick={loginWithGithub} buttonClasses={buttonClass('github')}>
          <GithubLogo size="2em"/>
          <div className="flex-grow-1 font-weight-bold">Login with GitHub</div>
        </SocialLoginButton>
      }
      { fbLoginEnabled &&
        <SocialLoginButton onClick={loginWithFacebook} buttonClasses={buttonClass('facebook')}>
          <FbLogo size="2em"/>
          <div className="flex-grow-1 font-weight-bold">Login with Facebook</div>
        </SocialLoginButton>
      }
      { googleLoginEnabled &&
        <SocialLoginButton onClick={loginWithGoogle} buttonClasses={buttonClass('google')}>
          <GoogleLogo size="2em"/>
          <div className="flex-grow-1 font-weight-bold">Login with Google</div>
        </SocialLoginButton>
      }
    </div>
  }
}

export const OauthLogin: React.FC<{onLogin?: () => void, children: ReactNode}> = ({onLogin, children}) => {
  const oauthToken = useOauthToken()
  const { error, loading } = useOauthLogin({ onLogin, oauthToken })
  if (oauthToken == null) {
    return <>{children}</>
  } else {
    return <>
      <ErrorMessage error={error}/>
      { loading && <div className="alert alert-info">
        Please wait while we process your login...
      </div> }
    </>
  }
}

export const LoginForm: React.FC<LoginFormProps> = ({onLogin, idPrefix, labelsFirst}) => {

  if (labelsFirst == null) {
    labelsFirst = true
  }

  const [isForgotPasswordMode, setForgotPasswordMode] = useState(false)

  const [submit, { loading, error, called }] = useLogin()

  const { onSubmit, onChange, values } = useForm(submit)

  const { id, loading: tokenLoading } = useToken()

  const { refetch } = useCrsfToken()

  useEffect(() => {
    // We need to wait until the credential context is reporting that we are logged in,
    // (in addition to waiting for useLogin() mutation to finish). Otherwise there's a window
    // during which other components might think we aren't logged in, even though we are
    // about to be.
    if (called && !loading && !error && id && !tokenLoading && onLogin) {
      onLogin()
    }
  })

  if (isForgotPasswordMode) {
    return <>
      <div className="p-2">
        Enter your email to get a password reset link.
      </div>
      <RequestPasswordResetForm labelsFirst={false}
        onCancel={() => { setForgotPasswordMode(false)}} />
    </>
  }

  const onLoginWrapper = () => {
    if (window.opener != null) {
      window.opener.postMessage('LOGGED_IN')
      window.close()
    }
    if (onLogin != null) {
      onLogin()
    }
  }

  const popupWindow = useChildWindow('social-login-popup',
    (msg: any) => {
      if (msg === 'LOGGED_IN') {
        // TODO: just update the cache manually instead of refetching the query
        refetch()
      }
    }
  )

  return <OauthLogin onLogin={onLoginWrapper}>
    <SocialButtons popupWindow={popupWindow} />
    <form className="form-signin" onSubmit={onSubmit}>
      <div className="form-label-group mb-2">
        <InputLabel flip={labelsFirst}>
          <input type="email" data-var="email" className="form-control"
                 value={values.email || ''} onChange={onChange}
                 id={getId(idPrefix, "login-email")}
                 placeholder="Email address" required autoFocus />
          <label htmlFor={getId(idPrefix, "login-email")}>Email address</label>
        </InputLabel>
      </div>

      <div className="form-label-group mb-2">
        <InputLabel flip={labelsFirst}>
          <input type="password" data-var="password" className="form-control"
                 value={values.password || ''} onChange={onChange}
                 id={getId(idPrefix, "login-password")}
                 placeholder="Password" required />
          <label htmlFor={getId(idPrefix, "login-password")}>Password</label>
        </InputLabel>
      </div>

      <div className="custom-control custom-checkbox mb-2">
        <input type="checkbox" className="custom-control-input" data-var="stayLoggedIn"
               id={getId(idPrefix, "login-stay-logged-in")}
               onChange={onChange} checked={Boolean(values.stayLoggedIn)} />
        <label className="custom-control-label" htmlFor={getId(idPrefix, "login-stay-logged-in")}>
          Remember me
        </label>
      </div>

      <div className="mb-3 justify-content-between d-flex">
        <button className="btn btn-primary" type="submit">Sign in</button>
        <button className="btn btn-outline-primary" type="button"
                onClick={(e) => { e.preventDefault(); setForgotPasswordMode(true); }}>
          Forgot Password?
        </button>
      </div>
      <ErrorMessage error={error} />
    </form>
  </OauthLogin>
}

// User creation error messages are likely to occur in normal situations,
// so they get a bit more attention than ErrorMessage can give.
const UserCreateError: React.FC<{error?: ApolloError}> = ({error}) => {
  if (!error) { return null }

  const formatMsg = (e: GraphQLError) => {
    if (e.extensions == null) {
      return null
    }
    const { exception } = e.extensions
    if (exception) {
      switch (exception.code) {
        case 'EMAIL_EXISTS':
          return <>
            An account with the email address {e.extensions.email} already exists.
          </>
      }
    }

    return e.message
  }

  return <>
    {error.graphQLErrors.map((e, i) => (
      <div className="alert alert-danger" role="alert" key={i}>
        {formatMsg(e) || 'uknown error'}
      </div>
    ))}
  </>
}

type AccountCreationProps = {
  loginAfterCreation?: boolean
  onLogin?: () => void

  // If for some reason, you have conflicts with the IDs nodes generated by
  // AccountCreationForm, you can add a id prefix.
  // This can also be useful if you need to embed more than one AccountCreationForm
  // in the same page.
  idPrefix?: string

  // Render labels before inputs in the form (default true)
  labelsFirst?: boolean

  // Display the PasswordScore widget.
  showPasswordScore?: boolean
}

export const AccountCreationForm: React.FC<AccountCreationProps> =
  ({loginAfterCreation, onLogin, idPrefix, labelsFirst, showPasswordScore = true}) => {

  if (labelsFirst == null) {
    labelsFirst = true
  }

  if (loginAfterCreation == null) {
    loginAfterCreation = true
  }

  const { id } = useToken()
  const [submit, { error, success }] = useCreateAccount()

  const { onSubmit, onChange, values } = useForm(submit,
    { loginAfterCreation }
  )

  useEffect(() => {
    if (success && id && onLogin) {
      onLogin()
    }
  })

  return <>
    <form className="form-signin" onSubmit={onSubmit}>
      <div className="form-label-group mb-2">
        <InputLabel flip={labelsFirst}>
          <input type="email" data-var="email" className="form-control"
                 id={getId(idPrefix, "account-creation-email")}
                 value={values.email || ''} onChange={onChange}
                 placeholder="Email address" required autoFocus />
          <label htmlFor={getId(idPrefix, "account-creation-email")}>Email address</label>
        </InputLabel>
      </div>

      <div className="form-label-group mb-2">
        <InputLabel flip={labelsFirst}>
          <input type="password" data-var="password" className="form-control"
                 id={getId(idPrefix, "account-creation-password")}
                 value={values.password || ''} onChange={onChange}
                 placeholder="Password" required />
          <label htmlFor={getId(idPrefix, "account-creation-password")}>Password</label>
        </InputLabel>
      </div>

      { loginAfterCreation &&
      <div className="custom-control custom-checkbox mb-2">
        <input type="checkbox" className="custom-control-input" data-var="stayLoggedIn"
               id={getId(idPrefix, "account-creation-stay-logged-in")}
               onChange={onChange} checked={Boolean(values.stayLoggedIn)} />
        <label className="custom-control-label" htmlFor={getId(idPrefix, "account-creation-stay-logged-in")}>
          Remember me
        </label>
      </div> }

      { showPasswordScore && <PasswordScore password={values.password} username={values.email} /> }

      <div className="mb-3">
        <button className="btn btn-primary" type="submit">Create Account</button>
      </div>
    </form>
    <UserCreateError error={error} />
  </>
}

export const LogoutButton: React.FC<{}> = () => {

  const [submit, { error }] = useLogout()

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    submit()
  }

  return <>
    <button className="btn btn-outline-primary" type="button" onClick={onClick}>Logout</button>
    <ErrorMessage error={error} />
  </>
}
