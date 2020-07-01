
import React, { useState, useEffect, useMemo, MouseEvent } from 'react'
import { Formik, FormikValues, FormikErrors } from 'formik'

import jwtDecode from 'jwt-decode'

import { useAppConfig, useToken } from '../auth'
import { ErrorMessage } from '../errors'
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
}

/**
 * ChangePasswordForm allows the user to change their password.
 *
 * @preview
 *
 * <ChangePasswordForm/>
 */
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  idPrefix,
  components
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
         id={getId(idPrefix, "change-password-old-password")}
         placeholder="Old Password" required autoFocus
         labelText="Old Password"
         {...props.getFieldProps('oldPassword')}
      />

      const newPasswordInput = <PasswordInput
         type="password"
         id={getId(idPrefix, "change-password-new-password")}
         placeholder="New Password" required autoFocus
         labelText="New Password"
         {...props.getFieldProps('newPassword')}
      />

      const passwordScore = <DebouncedPasswordScore
        password={props.values.newPassword}
        username={email}
      />

      if (addPasswordMode) {
        return <AddPasswordFormComponent formProps={formProps}
          emailInput={
            <EmailAddressInput
               type="email"
               id={getId(idPrefix, "change-password-email")}
               placeholder="Email" required autoFocus
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

          error={<ErrorMessage error={error} />}
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

          error={<ErrorMessage error={error} />}
        />
      }
    }}
  </Formik>
}

export type ResetPasswordFormProps = {
  token: string
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
}

/**
 * <ResetPasswordForm> allows the user to reset their password using a reset
 * token that they have obtained via email. This component should be placed
 * at the location pointed to by the Reset Password URI setting in your
 * Usermatic application settings.
 *
 * @preview
 *
 * <ResetPasswordForm/>
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onLogin,
  idPrefix,
  components,
  loginAfterReset: loginAfterResetArg = true,
  exposeLoginAfterReset: allowLoginAfterResetArg = true,
  redirectAfterReset: redirectAfterResetArg = false,
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

  const [submit, { error, success, data }] = useResetPassword()

  const email = useMemo(() => {
    const decoded = jwtDecode(token) as { email?: string }
    if (!decoded || typeof decoded != 'object') {
      console.error("password reset token was invalid")
      submit({} as any) // do a bogus submit to force an error
      return
    }

    return decoded.email
  }, [token])

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
            id={getId(idPrefix, "reset-password-new-password")}
            placeholder="New Password"
            labelText="New Password"
            required autoFocus
            {...props.getFieldProps('newPassword')}
          />
        }

        passwordScore={
          <DebouncedPasswordScore
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
}

/**
 * <RequestPasswordResetForm/> allows the user to request a password reset email.
 * Normally, you do not need to embed this component directly, as <LoginForm>
 * will display it when the user clicks "Forgot Password"
 *
 * @preview
 *
 * <RequestPasswordResetForm/>
 */
export const RequestPasswordResetForm: React.FC<RequestPasswordResetFormProps> = ({
  idPrefix,
  onCancel,
  components
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
            placeholder="Email address" required autoFocus
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
}

/**
 * <PasswordScore> estimates the strength of the user's password using zxcvbn
 * (https://github.com/dropbox/zxcvbn) and displays it using the
 * customizable <PasswordScoreComponent>
 *
 * You generally shouldn't use this form directly. All the relevant form
 * components (e.g. <AccountCreationForm>, <ChangePasswordForm>, etc) use it
 * automatically.
 *
 * Furthermore, if you do want to use it directly, you should consider using
 * <DebouncedPasswordScore> for better performance.
 *
 * @preview
 *
 * <PasswordScore password="hunter2" username="joe@um"/>
 *
 */
export const PasswordScore: React.FC<PasswordScoreProps> = ({
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
      const loaded = await zxcvbnAsync.load({})
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
  }, [password, username])

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
 * <DebouncedPasswordScore> is exactly like <PasswordScore>, but it
 * debounces the password input for better performance.
 *
 * @preview
 *
 * <DebouncedPasswordScore password="hunter2" username="joe@um"/>
 */
export const DebouncedPasswordScore: React.FC<PasswordScoreProps & {
  debounceMs?: number
}> = ({password, username, debounceMs = 300}) => {
  const debouncedPw = useDebounce(password, debounceMs)
  return <PasswordScore password={debouncedPw} username={username} />
}
DebouncedPasswordScore.displayName = 'DebouncedPasswordScore'
