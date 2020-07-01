
import React, { ReactNode, useEffect, useState, MouseEvent } from 'react'
import { Formik, FormikValues, FormikErrors } from 'formik'

import { useToken, useAppConfig, useAppId } from '../auth'
import { usePrimaryEmail } from '../user'
import { useCsrfMutation } from '../hooks'
import { ErrorMessage, ErrorMessageCase } from '../errors'
import { useGetRecoveryCodeCount } from '../recoverycodes'
import { ReauthContext } from '../reauth'
import { DebouncedPasswordScore, RequestPasswordResetForm } from './password-components'
import { MFAForm } from './totp-components'
import { useReauthToken } from '../reauth'
import { useComponents } from './component-lib'
import { Components } from './component-types'

import { useClearTotpMutation } from '../../gen/operations'

import {
  useCreateAccount,
  useOauthToken,
  useLogin,
  useLogout
} from '../login'

import {
  CreateAccountMutationVariables,
  LoginMutationVariables
} from '../../gen/operations'

const getId = (prefix: string | undefined, suffix: string) => {
  if (prefix) {
    return `${prefix}-${suffix}`
  } else {
    // add some random goobledygook to avoid conflicts with other component
    // libraries.
    return `um3kfiekd-${suffix}`
  }
}

export type LoginFormProps = {
  /**
   * onLogin is called after the user successfully logs in.
   */
  onLogin?: () => void

  // If for some reason, you have conflicts with the IDs nodes generated by
  // LoginForm, you can add a id prefix.
  // This can also be useful if you need to embed more than one AccountCreationForm
  // in the same page.
  idPrefix?: string

  /**
   * Display components for LoginForm. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components,

  /**
   * onChangeMode is called when the LoginForm switches "modes". For instance,
   * if the user clicks the "Forgot Password" button, onChangeMode will be called with
   * the `'forgotpw'` argument.
   */
  onChangeMode?: (mode: LoginMode) => void
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

const makeLoginFn = (childWindow: ChildWindow, appId: string, url: string) => (
  (e: MouseEvent) => {
    e.preventDefault()
    const nonce = makeNonce()
    window.localStorage.umAuthNonce = nonce
    const childUrl = `${url}?appId=${appId}&nonce=${nonce}`

    childWindow.open(childUrl)
  }
)

const SocialButtons: React.FC<{
  popupWindow: ChildWindow,
  components?: Components
}> = ({popupWindow, components}) => {

  const {
    SocialButtonsComponent,
    GithubButton,
    FacebookButton,
    GoogleButton
  } = useComponents(components)

  const appId = useAppId()

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
    return <SocialButtonsComponent
      githubButton={githubLoginEnabled && <GithubButton onClick={loginWithGithub} />}
      facebookButton={fbLoginEnabled && <FacebookButton onClick={loginWithFacebook} />}
      googleButton={googleLoginEnabled && <GoogleButton onClick={loginWithGoogle} />}
    />
  }
}

// Return a child window that, when opened, can initiate the oauth redirect,
// and sends the oauthToken back to the opener once it is received.
const useGetOauthToken = (onToken: (token: string) => void) => {

  const popupWindow = usePopupWindow({onToken})

  // oauthToken becomes non-null in the child window after the oauth redirect
  // completes
  const oauthToken = useOauthToken()

  // Send the token back to window.opener once we have it. This will never
  // execute in the parent window.
  useEffect(() => {
    if (oauthToken && window.opener != null) {
      window.opener.postMessage({ oauthToken })
      window.close()
    }
  }, [oauthToken])

  return { popupWindow }
}

type OauthLoginProps = LoginFormProps & { children: ReactNode }

const OauthCreateAccount: React.FC<OauthLoginProps> = ({
  onLogin, children, components
}) => {

  const {
    AlertComponent
  } = useComponents(components)

  const [submit, { loading, error }] = useLogin({
    onCompleted: () => { onLogin?.() }
  })
  const [oauthToken, setOauthToken] = useState<string | undefined>()
  const { popupWindow } = useGetOauthToken(setOauthToken)

  useEffect(() => {
    if (oauthToken) {
      submit({
        credential: { oauthToken },
        stayLoggedIn: false,
      })
    }
  }, [oauthToken])

  if (oauthToken == null) {
    return <>
      <SocialButtons popupWindow={popupWindow} components={components} />
      {children}
    </>
  } else {
    return <>
      <ErrorMessage error={error} />
      { loading && <AlertComponent role="info">
        Please wait while we process your login...
      </AlertComponent> }
    </>
  }
}

const usePopupWindow = ({onToken}: { onToken: (token: string) => void }) => (
  useChildWindow('social-login-popup',
    async (msg: any) => {
      if (msg.oauthToken) {
        onToken(msg.oauthToken)
      }
    }
  )
)

const loginInitialValues = {
  email: '',
  password: '',
  stayLoggedIn: false
}

type LoginSubmitArgs = typeof loginInitialValues

const validateLogin = (values: FormikValues) => {
  const errors: FormikErrors<typeof loginInitialValues> = {}

  if (!values.password) {
    errors.password = 'Required'
  }

  if (!values.email) {
    errors.email = 'Required'
  } else if (!/.+@.+/.test(values.email)) {
    errors.email = 'Please enter an email address'
  }

  return errors
}

export type LoginMode = 'login' | 'forgotpw' | 'totp'

const PostRecoveryCode: React.FC<{
  dismiss: () => void,
  components?: Components
}> = ({dismiss, components}) => {

  const {
    Button,
    PostRecoveryCodeFormComponent
  } = useComponents(components)

  const reauthToken = useReauthToken()
  const { count, loading: countLoading } = useGetRecoveryCodeCount()
  const [submit, { called, loading, error }] = useCsrfMutation(useClearTotpMutation)

  const reset2FA = (e: MouseEvent) => {
    e.preventDefault()
    submit({ variables: { reauthToken } })
  }

  const onClickDismiss = (e: MouseEvent) => {
    e.preventDefault()
    dismiss()
  }

  return <PostRecoveryCodeFormComponent
    mfaDisabled={Boolean(called && !loading && !error)}
    error={<ErrorMessage error={error} />}
    recoveryCodesRemaining={countLoading ? undefined : count}

    dismissButton={
      <Button role="dismiss" name="dismiss-2fa-disabled" onClick={onClickDismiss}>
        Okay
      </Button>
    }

    resetButton={
      <Button role="secondary" name="reset-2fa" disabled={loading} onClick={reset2FA}>
        { loading
          ? 'Please wait...'
          : 'I lost my phone and need to turn 2FA off for now.' }
      </Button>
    }

    dontResetButton={
      <Button
        role="dismiss"
        name="leave-2fa-enabled"
        disabled={called}
        onClick={dismiss}
      >
        I still have my phone, but not with me. Leave 2FA on.
      </Button>
    }
  />
}

/**
 * <LoginForm/> allows users to log in to your application. It handles both
 * password and Oauth logins. Oauth login buttons are automatically displayed
 * for any Oauth provider that you have enabled for your Usermatic app.
 *
 * @preview
 *
 * <LoginForm/>
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  idPrefix,
  components,
  onChangeMode
}) => {

  const {
    PasswordFormComponent,
    EmailAddressInput,
    PasswordInput,
    StayLoggedInInput,
    Button,
    LoginSuccessComponent
  } = useComponents(components)

  const config = useAppConfig()

  // State
  const [mode, setModeState] = useState<LoginMode>('login')
  const [submittedData, setSubmittedData] =
    useState<LoginMutationVariables | undefined>(undefined)
  const [oauthToken, setOauthToken] = useState<string | undefined>()
  const [successViaRecoveryCodeDismissed, setSuccessViaRecoveryCodeDismissed] =
    useState<boolean>(false)
  const [stayLoggedIn, setStayLoggedIn] = useState<boolean>(false)

  // are we logged in?
  const { id, loading: tokenLoading } = useToken()
  const { email } = usePrimaryEmail()

  // the login mutation
  const [submit, { loading, error, called, success, data }] = useLogin()

  const submitWrapper = (variables: LoginMutationVariables) => {
    submit(variables)
    setSubmittedData(variables)
  }

  const { popupWindow } = useGetOauthToken(setOauthToken)

  const setMode = (mode: LoginMode) => {
    setModeState(mode)
    onChangeMode?.(mode)
  }

  // derived state...
  const totpRequired = Boolean(error?.graphQLErrors.find(
    e => e.extensions?.exception?.code === 'TOTP_REQUIRED'
  ))

  const totpCode = submittedData?.credential.totpCode
  const successViaRecoveryCode = called && success
    && totpCode && /^[-0-9A-Z]{14}$/.test(totpCode)

  // Do the oauth login as soon as we have a token.
  useEffect(() => {
    if (oauthToken) {
      submitWrapper({
        stayLoggedIn,
        ...submittedData,
        credential: { oauthToken }
      })
    }
  }, [oauthToken])

  // We need to wait until the credential context is reporting that we are logged in,
  // (in addition to waiting for useLogin() mutation to finish). Otherwise there's a window
  // during which other components might think we aren't logged in, even though we are
  // about to be.
  const loginFinished = called && success && id && !tokenLoading &&
        (!successViaRecoveryCode || successViaRecoveryCodeDismissed)

  useEffect(() => {
    if (loginFinished && onLogin) {
      onLogin()
    }
  }, [loginFinished, onLogin])

  useEffect(() => {
    if (mode !== 'totp' && totpRequired) {
      setMode('totp')
    }
  }, [totpRequired, mode])

  if (loginFinished) {
    return <LoginSuccessComponent
      email={email ?? ''}
      appName={config.appName}
    />
  }

  if (successViaRecoveryCode) {
    const dismiss = () => {
      setSuccessViaRecoveryCodeDismissed(true)
    }
    return <ReauthContext.Provider value={data?.login?.user.reauthToken ?? ''}>
      <PostRecoveryCode dismiss={dismiss} components={components} />
    </ReauthContext.Provider>
  }

  if (mode === 'totp') {
    const submitCode = (totpCode: string) => {
      if (oauthToken) {
        submitWrapper({
          credential: { oauthToken, totpCode },
          stayLoggedIn
        })
      } else if (submittedData) {
        const variables = {
          ...submittedData,
          credential: {
            ...submittedData.credential,
            totpCode
          }
        }
        submitWrapper(variables)
      } else {
        throw new Error("no oauthToken or saved login data")
      }
    }

    return <MFAForm
       submit={submitCode}
       idPrefix={idPrefix}
       // Don't display the error message that says we need a code...
       error={totpRequired ? undefined : error}
       loading={loading}
       components={components}
    />
  } else if (mode === 'forgotpw') {
    return <RequestPasswordResetForm idPrefix={idPrefix}
            onCancel={() => { setMode('login')}} />
  } else if (mode === 'login') {

    const onSubmit = (values: LoginSubmitArgs) => {
      const { password, email } = values
      const variables = {
        credential: { password: { password, email } },
        stayLoggedIn
      }
      submitWrapper(variables)
    }

    return <>
      <SocialButtons popupWindow={popupWindow} components={components} />
      <Formik initialValues={loginInitialValues}
              onSubmit={onSubmit}
              validate={validateLogin}>
        {(props) => {
          const { handleReset, handleSubmit } = props
          const formProps = {
            onSubmit: handleSubmit,
            onReset: handleReset,
          }

          const {
            onChange: onStayLoggedInChange,
            ...stayLoggedInRest
          } = props.getFieldProps('stayLoggedIn')

          return <PasswordFormComponent
            formProps={formProps}
            emailInput={
              <EmailAddressInput
                type="email"
                id={getId(idPrefix, "login-email")}
                placeholder="Email address" required autoFocus
                labelText="Email address"
                {...props.getFieldProps('email')}
              />
            }

            passwordInput={
              <PasswordInput
                 type="password"
                 id={getId(idPrefix, "login-password")}
                 placeholder="Password" required
                 labelText="Password"
                 {...props.getFieldProps('password')}
              />
            }

            stayLoggedInInput={
              <StayLoggedInInput
                type="checkbox"
                id={getId(idPrefix, "login-stay-logged-in")}
                onChange={(e) => {
                  onStayLoggedInChange(e)
                  // We also need to store this outside the form, so that
                  // oauth logins can use it.
                  setStayLoggedIn(e.target.checked)
                }}
                {...stayLoggedInRest}
                labelText="Remember me"
              />
            }

            signinButton={
              <Button role='submit' name='login' id="login-button" type="submit">
                Sign in
              </Button>
            }

            forgotPasswordButton={
              <Button role="secondary" name="forgot-password"
                      id="forgot-pw-button" type="button"
                      onClick={(e) => { e.preventDefault(); setMode('forgotpw'); }}>
                Forgot Password?
              </Button>
            }

            error={<ErrorMessage error={error} />}
          />
        }}
      </Formik>
    </>
  }
  throw new Error("unreachable")
}

export type AccountCreationFormProps = {
  /**
   * If true, the user will be automatically logged in as soon as their
   * account has been created. Note that if you have set the "Require verified email
   * for login" setting to true in your application settings, this option will
   * not work.
   */
  loginAfterCreation?: boolean
  /**
   * onLogin() is called after the user is successfully logged in.
   */
  onLogin?: () => void

  // If for some reason, you have conflicts with the IDs nodes generated by
  // AccountCreationForm, you can add a id prefix.
  // This can also be useful if you need to embed more than one AccountCreationForm
  // in the same page.
  idPrefix?: string

  /**
   * Display components for AccountCreationForm. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components

  // Render labels before inputs in the form (default true)
  // XXX
  labelsFirst?: boolean

  /**
   * If set, the strength of the user's password is displayed and
   * automatically updated as they modify it.
   */
  showPasswordScore?: boolean
}

/**
 * <AccountCreationForm> allows users to create accounts on your site.
 *
 * @preview
 *
 * // To preview AccountCreationForm, use any email address, and any
 * // password. If you enter the password 'fail', a simulated failure
 * // will occur.
 *
 * <AccountCreationForm/>
 */
export const AccountCreationForm: React.FC<AccountCreationFormProps> = ({
  loginAfterCreation: loginAfterCreationArg = true,
  onLogin,
  idPrefix,
  components,
  labelsFirst: labelsFirstArg = true,
  showPasswordScore = true
}) => {

  const {
    CreateAccountFormComponent,
    CreateAccountSuccessComponent,
    EmailAddressInput,
    PasswordInput,
    StayLoggedInInput,
    Button
  } = useComponents(components)

  const loginAfterCreation = loginAfterCreationArg

  const { id } = useToken()
  const [submit, { error, success }] = useCreateAccount()
  const config = useAppConfig()

  const accountCreated = success && id

  useEffect(() => {
    if (accountCreated && onLogin) {
      onLogin()
    }
  }, [accountCreated, onLogin])

  const onSubmit = (variables: CreateAccountMutationVariables) => {
    submit(variables)
  }

  const initialValues = {
    ...loginInitialValues,
    loginAfterCreation
  }

  return <OauthCreateAccount onLogin={onLogin} components={components}>
    <Formik initialValues={initialValues}
            onSubmit={onSubmit}
            validate={validateLogin}>
    {(props) => {
      const { handleReset, handleSubmit } = props
      const formProps = {
        onSubmit: handleSubmit,
        onReset: handleReset,
        autoComplete: 'off'
      }

      if (accountCreated) {
        return <CreateAccountSuccessComponent
          email={props.values.email}
          appName={config.appName}
        />
      }

      return <CreateAccountFormComponent
        formProps={formProps}
        emailInput={
          <EmailAddressInput
            type="email"
            id={getId(idPrefix, "account-creation-email")}
            placeholder="Email address" required autoFocus
            labelText="Email address"
            {...props.getFieldProps('email')}
          />
        }

        passwordInput={
          <PasswordInput
             type="password"
             id={getId(idPrefix, "account-creation-password")}
             placeholder="Password" required
             labelText="Password"
             {...props.getFieldProps('password')}
          />
        }

        stayLoggedInInput={
          loginAfterCreation &&
          <StayLoggedInInput
            type="checkbox"
            id={getId(idPrefix, "account-creation-stay-logged-in")}
            labelText="Remember me"
            {...props.getFieldProps('stayLoggedIn')}
          />
        }

        passwordScore={
          showPasswordScore &&
          <DebouncedPasswordScore
            password={props.values.password}
            username={props.values.email}
          />
        }

        createAccountButton={
          <Button role="submit" name="create-account" id="create-account-button" type="submit">
            Create Account
          </Button>
        }

        error={
          <ErrorMessage error={error}>
            <ErrorMessageCase code='EMAIL_EXISTS'>
              An account with the email address {props.values.email} already exists.
            </ErrorMessageCase>
          </ErrorMessage>
        }
      />
    }}
    </Formik>
  </OauthCreateAccount>
}

/**
 * <LogoutButton> allows users to log out of your application.
 *
 * @preview
 * <LogoutButton/>
 */
export const LogoutButton: React.FC<{
  /**
   * Display components for LogoutButton. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components
}> = ({components}) => {

  const {
    Button
  } = useComponents(components)

  const [submit, { error }] = useLogout()

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    submit()
  }

  return <>
    <Button role="secondary" name="logout" onClick={onClick}>Logout</Button>
    <ErrorMessage error={error} />
  </>
}
