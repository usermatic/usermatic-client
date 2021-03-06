
import url from 'url'

import React, { useState, useEffect, useMemo, MouseEvent } from 'react'
import { Formik, FormikValues, FormikErrors } from 'formik'

import jwtDecode from 'jwt-decode'

import { useAppConfig, useToken } from '../auth'
import { ErrorMessage, ErrorMessageCase } from '../errors'
import { useDebounce } from '../use-debounce'

import { useComponents } from './component-lib'
import { Components } from './component-types'

import {
  usePasswordCredential,
  usePrimaryEmail
} from '../user'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import { ZXCVBNResult } from 'zxcvbn'

import {
  useChangePassword,
  useAddPassword,
  useRequestPasswordResetEmail,
  useResetPassword
} from '../passwords'

import {
  ChangePwMutationVariables,
  AddPasswordMutationVariables
} from '../../gen/operations'

const getId = (prefix: string | undefined, suffix: string) => {
  if (prefix) {
    return `${prefix}-${suffix}`
  } else {
    // add some random goobledygook to avoid conflicts with other component
    // libraries.
    return `um9akc83a-${suffix}`
  }
}

// Ensure that we only call zxcvbnAsync.load() once.
let loadingPromise: Promise<any> | undefined = undefined
const loadZxcvbn = async () => {
  if (loadingPromise == null) {
    loadingPromise = zxcvbnAsync.load({})
  }
  return loadingPromise
}

type UseOrChangeVariables = ChangePwMutationVariables & AddPasswordMutationVariables

export type ChangePasswordFormProps = {
  /**
   * Function to be called after password is successfully changed.
   */
  onSuccess?: () => void,
  idPrefix?: string,
  /**
   * Display components for ChangePasswordForm. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components

  /**
   * If true, add the `autoFocus` property to the email input of the login form.
   * Defaults to false
   */
  autoFocus?: boolean

  /**
   * onCancel() can be used to hook ChangePasswordForm up to a modal.
   * It is called when the user clicks the "Cancel" button displayed by
   * <ChangePasswordForm>
   */
  onCancel?: () => void
}

/**
 * ChangePasswordForm allows the user to change their password.
 *
 * @preview
 *
 * <ChangePasswordForm/>
 *
 * @customization
 *
 * <ChangePasswordForm> uses the following layout components for customization:
 * - [AddPasswordFormComponent](/apiref#AddPasswordFormType)
 * - [ChangePasswordFormComponent](/apiref#ChangePasswordFormType)
 * - [EmailAddressInput](/apiref#InputComponentType) (Defaults to InputComponent)
 * - [PasswordInput](/apiref#InputComponentType) (Defaults to InputComponent)
 * - [Button](/apiref#ButtonType)
 *
 */
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  idPrefix,
  components,
  onCancel,
  autoFocus = false
}) => {

  const {
    EmailAddressInput,
    PasswordInput,
    Button,
    ChangePasswordFormComponent,
    AddPasswordFormComponent
  } = useComponents(components)

  const { email: primaryEmail } = usePrimaryEmail()
  const { loading: pwLoading, error: pwError, passwordCredential } = usePasswordCredential()

  const onCompleted = () => { if (onSuccess) { onSuccess() } }
  const change = useChangePassword({ onCompleted })
  const add = useAddPassword({ onCompleted })

  if (pwLoading) {
    return null
  }
  if (pwError) { return <ErrorMessage error={pwError}/> }

  const addPasswordMode = passwordCredential == null

  const { loading, error } = addPasswordMode ? add[1] : change[1]

  const email = passwordCredential?.email ?? primaryEmail ?? ''

  const initialValues = {
    email,
    oldPassword: '',
    newPassword: ''
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {};
    if (passwordCredential && !values.oldPassword) {
      errors.oldPassword = 'Required'
    }
    if (!values.newPassword) {
      errors.newPassword = 'Required'
    }
    return errors
  }

  const onSubmit = (values: UseOrChangeVariables) => {
    const { email, oldPassword, newPassword } = values
    if (addPasswordMode) {
      add[0]({ email, newPassword })
    } else {
      change[0]({ oldPassword, newPassword })
    }
  }

  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {(props) => {
      const { handleReset, handleSubmit } = props
      const formProps = {
        onSubmit: handleSubmit,
        onReset: handleReset,
      }

      const oldPasswordInput = <PasswordInput
         type="password"
         autoComplete="password"
         id={getId(idPrefix, "change-password-old-password")}
         placeholder="Old Password" required
         autoFocus={autoFocus}
         labelText="Old Password"
         {...props.getFieldProps('oldPassword')}
      />

      const newPasswordInput = <PasswordInput
         type="password"
         autoComplete="new-password"
         id={getId(idPrefix, "change-password-new-password")}
         placeholder="New Password" required
         labelText="New Password"
         {...props.getFieldProps('newPassword')}
      />

      const passwordScore = <PasswordScore
        password={props.values.newPassword}
        username={email}
      />

      if (addPasswordMode) {
        return <AddPasswordFormComponent formProps={formProps}
          emailInput={
            <EmailAddressInput
               type="email"
               id={getId(idPrefix, "change-password-email")}
               placeholder="Email" required
               autoFocus={autoFocus}
               labelText="Email"
               {...props.getFieldProps('email')}
            />
          }

          newPasswordInput={newPasswordInput}
          passwordScore={passwordScore}

          submitButton={
            <Button role="submit" name="set-password"
              disabled={loading} type="submit">
              { loading ? 'Please wait...' : 'Set Password' }
            </Button>
          }

          cancelButton={
            <Button role="cancel" name="cancel-change-password"
              onClick={(e) => {
                e.preventDefault()
                onCancel?.()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          }

          error={
            <ErrorMessage error={error}>
              <ErrorMessageCase code='EMAIL_EXISTS'>
                The email address {props.values.email} is already in use.
              </ErrorMessageCase>
            </ErrorMessage>
          }
        />
      } else {
        return <ChangePasswordFormComponent formProps={formProps}
          oldPasswordInput={oldPasswordInput}
          newPasswordInput={newPasswordInput}
          passwordScore={passwordScore}

          submitButton={
            <Button role="submit" name="change-password"
              disabled={loading} type="submit">
              { loading ? 'Please wait...' : 'Change Password' }
            </Button>
          }

          cancelButton={
            <Button role="cancel" name="cancel-change-password"
              onClick={(e) => {
                e.preventDefault()
                onCancel?.()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          }

          error={<ErrorMessage error={error} />}
        />
      }
    }}
  </Formik>
}

export type ResetPasswordFormProps = {
  /**
   * The password-reset token, contained in the reset link that was sent to the
   * user via email. If omitted, ResetPasswordForm attempts to find the token
   * in window.location.href, in the 'token' query parameter.
   */
  token?: string
  /**
   * Called after the user is successfully logged in (which will only happen
   * if the `loginAfterReset` property is true.)
   */
  onLogin?: () => void
  idPrefix?: string
  /**
   * If true, the user will be automatically logged in after resetting their
   * password. Note: This will not work if the user has enabled MFA on their
   * account. In that case, they will have to log in via <LoginForm>
   */
  loginAfterReset?: boolean
  /**
   * If true, render the "login after reset" option. If the user checks this
   * box, it has the same effect as if the `loginAfterReset` property had been
   * set to true.
   */
  exposeLoginAfterReset?: boolean
  /**
   * If true, the user will be automatically redirected to the URI that has
   * been configured the Usermatic application settings after resetting
   * their password.
   */
  redirectAfterReset?: boolean

  /**
   * Display components for ResetPasswordForm. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components

  /**
   * If true, add the `autoFocus` property to the email input of the login form.
   * Defaults to false
   */
  autoFocus?: boolean
}

/**
 * <ResetPasswordForm> allows the user to reset their password using a reset
 * token that they have obtained via email. This component should be placed
 * at the location pointed to by the Reset Password URI setting in your
 * Usermatic application settings.
 *
 * @preview
 *
 * <ResetPasswordForm token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAaG9zdC5jb20iLCJjcmVkZW50aWFsSWQiOiJlZGZlZjg3YS03YWViLTRlNjYtYmE3MS0yMGI0MGVmNmRlNWMiLCJpZCI6IjE5ZTFjODA0LTBiMzAtNDYyYS05ODFiLWU1Y2MxZDg1ZWIzZiIsImFwcElkIjoiZDQ0MWZjZWQtNTZjNy00NzVjLThjODctNjE3OWI2NDU2Mzk5IiwiYWN0aW9uIjoiUkVTRVRfUFciLCJpYXQiOjE1OTM3MDIyNzF9.B4jCukSRelG9X4tAGjBhkU2wjhdLwKOj9x2kvDladwg"/>
 *
 * @customization
 *
 * <ResetPasswordForm> uses the following layout components for customization:
 *
 * - [AlertComponent](/apiref#AlertComponentType)
 * - [Button](/apiref#ButtonType)
 * - [PasswordInput](/apiref#InputComponentType) (Defaults to InputComponent)
 * - [CheckboxComponent](/apiref#InputComponentType)
 * - [ResetPasswordFormComponent](/apiref#ResetPasswordFormType)
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token: tokenProp,
  onLogin,
  idPrefix,
  components,
  loginAfterReset: loginAfterResetArg = true,
  exposeLoginAfterReset: allowLoginAfterResetArg = true,
  redirectAfterReset: redirectAfterResetArg = false,
  autoFocus = false
}) => {

  const {
    AlertComponent,
    Button,
    PasswordInput,
    CheckboxComponent,
    ResetPasswordFormComponent
  } = useComponents(components)

  const loginAfterReset = loginAfterResetArg
  const exposeLoginAfterReset = allowLoginAfterResetArg
  const redirectAfterReset = redirectAfterResetArg

  const [token, setToken] = useState<string | undefined>(tokenProp)

  const [submit, { error, success, data }] = useResetPassword()

  const isBrowser = typeof window !== 'undefined'

  useEffect(() => {
    if (!isBrowser || tokenProp) {
      return
    }

    let token = tokenProp ?? url.parse(window.location.href, true).query['token']
    if (Array.isArray(token)) {
      setToken(token[0])
    } else {
      setToken(token)
    }
  }, [isBrowser, tokenProp])

  const email = useMemo(() => {
    if (!token) {
      console.error("No verification token found in url or in ResetPasswordForm props")
      return
    }

    const decoded = jwtDecode(token) as { email?: string }
    if (!decoded || typeof decoded != 'object') {
      console.error("password reset token was invalid")
      submit({} as any) // do a bogus submit to force an error
      return
    }

    return decoded.email
  }, [isBrowser, token])

  const redirectUri = data?.resetPassword?.redirectUri

  const { id, loading: tokenLoading } = useToken()

  useEffect(() => {
    if (success && id && !tokenLoading && onLogin) {
      onLogin()
    }
  }, [success, id, tokenLoading, onLogin])

  useEffect(() => {
    if (success && redirectAfterReset && redirectUri) {
      setTimeout(() => {
       window.location.replace(redirectUri)
      }, 1000)
    }
  }, [redirectAfterReset, success, redirectUri])

  const successMessage = useMemo(() => {
    if (!success) {
      return null
    }
    return <AlertComponent role="success">
      Your password has been reset successfully.
      { redirectAfterReset && redirectUri && <>
        You will be redirected to <a href="{redirectUri}">{redirectUri}</a> shortly.
        </>
      }
    </AlertComponent>
  }, [AlertComponent, success, redirectAfterReset, redirectUri])

  if (token == null) {
    return <AlertComponent role="error">
      No reset token found
    </AlertComponent>
  }

  if (email == null) {
    return <AlertComponent role="error">
      Invalid token <pre>{token}</pre>
    </AlertComponent>
  }

  const submitWrapper = (values: FormikValues) => {
    const { newPassword, loginAfterReset, stayLoggedIn } = values
    submit({ token, newPassword, loginAfterReset, stayLoggedIn })
  }

  const initialValues = {
    newPassword: '',
    loginAfterReset,
    stayLoggedIn: false
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {};
    if (!values.newPassword) {
      errors.newPassword = 'Required'
    }
    return errors
  }

  return <Formik initialValues={initialValues} validate={validate} onSubmit={submitWrapper}>
    {(props) => {
      const { handleSubmit, handleReset } = props

      const formProps = {
        onSubmit: handleSubmit,
        onReset: handleReset,
        id: getId(idPrefix, "reset-password-form")
      }
      return <ResetPasswordFormComponent
        formProps={formProps}
        error={<ErrorMessage error={error} />}
        successMessage={successMessage}

        newPasswordInput={
          <PasswordInput
            type="password"
            autoComplete="new-password"
            id={getId(idPrefix, "reset-password-new-password")}
            placeholder="New Password"
            labelText="New Password"
            required
            autoFocus={autoFocus}
            {...props.getFieldProps('newPassword')}
          />
        }

        passwordScore={
          <PasswordScore
            password={props.values.newPassword}
            username={email}
          />
        }

        loginAfterResetInput={exposeLoginAfterReset
          ? <CheckboxComponent
              type="checkbox"
              id={getId(idPrefix, "reset-password-login-after-reset")}
              labelText="Log in now?"
              {...props.getFieldProps('loginAfterReset')}
            />
          : null
        }

        stayLoggedInInput={exposeLoginAfterReset
          ? <CheckboxComponent
              type="checkbox"
              id={getId(idPrefix, "reset-password-stay-logged-in")}
              labelText="Remember me"
              {...props.getFieldProps('stayLoggedIn')}
            />
          : null
        }

        submitButton={
          <Button role="submit" name="reset-password" type="submit">Reset Password</Button>
        }
      />
    }}
  </Formik>
}

export type RequestPasswordResetFormProps = {
  idPrefix?: string,
  /**
   * Called when the user clicks the cancel button instead of submitting their
   * email.
   */
  onCancel?: () => void,
  /**
   * Custom display components. See 'Customizing Usermatic' for more information.
   */
  components?: Components

  /**
   * If true, add the `autoFocus` property to the email input of the login form.
   * Defaults to false
   */
  autoFocus?: boolean
}

/**
 * <RequestPasswordResetForm> allows the user to request a password reset email.
 * Normally, you do not need to embed this component directly, as <LoginForm>
 * will display it when the user clicks "Forgot Password"
 *
 * @preview
 *
 * <RequestPasswordResetForm/>
 *
 * @customization
 *
 * <RequestPasswordResetForm> uses the following layout components for customization:
 *
 * - [EmailAddressInput](/apiref#InputComponentType)
 * - [Button](/apiref#ButtonType)
 * - [ForgotPasswordFormComponent](/apiref#ForgotPasswordFormType)
 */
export const RequestPasswordResetForm: React.FC<RequestPasswordResetFormProps> = ({
  idPrefix,
  onCancel,
  components,
  autoFocus = false
}) => {

  const {
    EmailAddressInput,
    Button,
    ForgotPasswordFormComponent
  } = useComponents(components)

  const [submit, { loading, error, success }] = useRequestPasswordResetEmail()

  const [submittedEmail, setSubmittedEmail] = useState('')

  const initialValues = { email: '' }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {};
    if (!values.email) {
      errors.email = 'Required';
    } else if (!/.+@.+/.test(values.email)) {
      errors.email = 'Please enter an email address';
    }
    return errors
  }

  const onSubmit = (variables: FormikValues) => {
    const { email } = variables
    submit({ email })
    setSubmittedEmail(variables.email)
  }

  const onClickCancel = (e: MouseEvent) => {
    e.preventDefault()
    onCancel?.()
  }
  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate} >
    {(props) => {
      const { handleReset, handleSubmit } = props
      const formProps = {
        onSubmit: handleSubmit,
        onReset: handleReset,
        id: getId(idPrefix, "request-password-reset-form")
      }
      return <ForgotPasswordFormComponent
        formProps={formProps}
        emailInput={
          <EmailAddressInput
            type="email"
            id={getId(idPrefix, "request-password-reset-email")}
            placeholder="Email address" required
            autoFocus={autoFocus}
            labelText="Email address"
            {...props.getFieldProps('email')}
          />
        }

        submitButton={
          <Button role="submit" name="request-password-reset"
            id="request-pw-reset-button" type="submit">
            { loading ? 'Please wait...' : 'Submit' }
          </Button>
        }

        cancelButton={
          onCancel &&
          <Button role="cancel" name="cancel-password-reset"
            type="button" onClick={onClickCancel}>
            Cancel
          </Button>
        }

        error={<ErrorMessage error={error} />}

        successMessage={success ?
          <>
            A password reset link was sent to {submittedEmail}. Please look
            for it in your inbox, and click the link to reset your password.
          </>
        : null }
      />
    }}
  </Formik>
}

type PwScoreRecord = ZXCVBNResult

export type PasswordScoreProps = {
  /**
   * The user's prospective password.
   */
  password?: string,
  /**
   * The user's email address.
   */
  username?: string,
  /**
   * Custom display components. See 'Customizing Usermatic' for more information.
   */
  components?: Components
  /**
   * Debounce time in ms for both the password and username. Defaults to 300ms.
   */
  debounceMs?: number
}

const PasswordScoreInner: React.FC<PasswordScoreProps> = ({
  password, username, components
}) => {

  const {
    PasswordScoreComponent
  } = useComponents(components)

  const [passwordScore, setPasswordScore] = useState<PwScoreRecord | undefined>()

  const config = useAppConfig()

  useEffect(() => {
    if (password == null) { return }
    let mounted = true

    const scorePassword = async () => {
      const loaded = await loadZxcvbn()
      if (!mounted) { return }
      const dict = ['usermatic']
      if (username) {
        dict.push(username)
      }
      const results = loaded(password, dict)
      setPasswordScore(results)
    }
    scorePassword()

    return () => { mounted = false }
  }, [password, username, setPasswordScore])

  if (config == null) {
    return null
  }

  let { minPasswordStrength } = config
  if (minPasswordStrength == null) {
    minPasswordStrength = 0
  }

  if (!password || !passwordScore || passwordScore.score == null) {
    return null
  }

  return <PasswordScoreComponent
    minPasswordStrength={minPasswordStrength}
    passwordScore={passwordScore}
  />
}

/**
 * <PasswordScore> estimates the strength of the user's password using zxcvbn
 * (https://github.com/dropbox/zxcvbn) and displays it using the
 * customizable <PasswordScoreComponent>
 *
 * You generally shouldn't use this compoment directly. All the relevant
 * components (e.g. <AccountCreationForm>, <ChangePasswordForm>, etc) use it
 * automatically.
 *
 * Both the username and password properties are debounced at a default interval
 * of 300ms.
 *
 * @preview
 *
 * <PasswordScore password="hunter2" username="joe@um"/>
 *
 * @customization
 *
 * <PasswordScore> uses the following layout components for customization:
 *
 * - [PasswordScoreComponent](/apiref#PasswordScoreType)
 *
 */
export const PasswordScore: React.FC<PasswordScoreProps> = ({
  password,
  username,
  components,
  debounceMs = 300
}) => {
  const debouncedPw = useDebounce(password, debounceMs)
  const debouncedUsername = useDebounce(username, debounceMs)
  return <PasswordScoreInner
    components={components} password={debouncedPw} username={debouncedUsername}
  />
}
PasswordScore.displayName = 'PasswordScore'
