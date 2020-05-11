
import React, { useState, useEffect, useMemo } from 'react'
import { Formik, Form, Field, FormikValues, FormikErrors } from 'formik'

import jwtDecode from 'jwt-decode'
import classNames from 'classnames'

import { useAppConfig, useToken } from '../auth'
import { usePasswordCredential, usePrimaryEmail } from '../user'
import { InputLabel } from './form-util'
import { ErrorMessage } from '../errors'
import { useDebounce } from '../use-debounce'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import {
  useChangePassword,
  useAddPassword,
  useRequestPasswordResetEmail,
  useResetPassword
} from '../passwords'

import {
  ChangePwMutationOptions,
  AddPasswordMutationOptions
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

type UseOrChangeOptions = ChangePwMutationOptions & AddPasswordMutationOptions

const useAddOrChangePassword = (options: UseOrChangeOptions) => {
  const { passwordCredential } = usePasswordCredential()

  const change = useChangePassword(options)
  const add = useAddPassword(options)

  if (passwordCredential != null) {
    return change
  } else {
    return add
  }
}

type ChangePasswordFormProps = {
  onSuccess?: () => void,
  idPrefix?: string,
  labelsFirst?: boolean
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> =
  ({onSuccess, idPrefix, labelsFirst: labelsFirstArg}) => {

  const { email: primaryEmail } = usePrimaryEmail()
  const { loading: pwLoading, error: pwError, passwordCredential } = usePasswordCredential()
  const [submit, { loading, error }] = useAddOrChangePassword({
    onCompleted: () => { if (onSuccess) { onSuccess() } }
  })

  const labelsFirst = labelsFirstArg ?? true

  if (pwLoading) { return null }
  if (pwError) { return <ErrorMessage error={pwError}/> }

  const email = passwordCredential?.email ?? primaryEmail

  const initialValues = {
    email: passwordCredential ? undefined : email,
    oldPassword: passwordCredential ? '' : undefined,
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

  const onSubmit = (values: FormikValues) => {
    const variables = values as NonNullable<UseOrChangeOptions['variables']>
    submit(variables)
  }

  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {(props) => (
      <Form>
        { // if there is no password credential, ChangePassword adds a password to the account
        passwordCredential
        ? <div className="form-label-group">
            <InputLabel flip={labelsFirst}>
              <Field type="password" className="form-control" name="oldPassword"
                     id={getId(idPrefix, "change-password-old-password")}
                     placeholder="Old Password" required autoFocus />
              <label htmlFor={getId(idPrefix, "change-password-old-password")}>Old Password</label>
            </InputLabel>
          </div>
        : <div className="form-label-group">
            <InputLabel flip={labelsFirst}>
              <Field type="text" className="form-control" name="email"
                     id={getId(idPrefix, "change-password-email")}
                     placeholder="email" required />
              <label htmlFor={getId(idPrefix, "change-password-email")}>Email</label>
            </InputLabel>
          </div>
        }

        <div className="form-label-group">
          <InputLabel flip={labelsFirst}>
            <Field type="password" className="form-control" name="newPassword"
                   id={getId(idPrefix, "change-password-new-password")}
                   placeholder="New Password" required
                   autoFocus={passwordCredential ? undefined : true} />
            <label htmlFor={getId(idPrefix, "change-password-new-password")}>New Password</label>
          </InputLabel>
        </div>
        <DebouncedPasswordScore password={props.values.newPassword} username={email} />

        <button className={`btn btn-lg btn-primary ${ loading ? 'disabled' : '' }`} type="submit">
          { loading
            ? 'Please wait...'
            : (passwordCredential ? 'Change Password' : 'Set Password') }
        </button>
        <ErrorMessage error={error} />
      </Form>
    )}
  </Formik>
}

type ResetPasswordFormProps = {
  token: string
  onLogin?: () => void
  idPrefix?: string
  labelsFirst?: boolean
  // The default value of loginAfterReset checkbox
  loginAfterReset?: boolean
  // whether to expose the loginAfterReset checkbox
  exposeLoginAfterReset?: boolean
  redirectAfterReset?: boolean
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onLogin,
  idPrefix,
  labelsFirst: labelsFirstArg = true,
  loginAfterReset: loginAfterResetArg = true,
  exposeLoginAfterReset: allowLoginAfterResetArg = true,
  redirectAfterReset: redirectAfterResetArg = false
}) => {

  const labelsFirst = labelsFirstArg
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

  if (email == null) {
    return <div className="alert alert-danger">
      Invalid token <pre>{token}</pre>
    </div>
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

  return <div>
    <ErrorMessage error={error} />
    <Formik initialValues={initialValues} validate={validate} onSubmit={submitWrapper}>
    {(props) => {
      if (success) {
        const redirectUri = data?.resetPassword && data?.resetPassword.redirectUri
        return <div className="alert alert-success">
          Your password has been reset successfully.
          { redirectAfterReset && redirectUri &&
            <>You will be redirected to <a href="{redirectUri}">{redirectUri}</a> shortly.</>
          }
        </div>
      }

      return <Form id="reset-password-form">
        <div className="form-label-group">
          <InputLabel flip={labelsFirst}>
            <Field type="password" name="newPassword" className="form-control"
                   id={getId(idPrefix, "reset-password-new-password")}
                   placeholder="New Password" required autoFocus />
            <label htmlFor={getId(idPrefix, "reset-password-new-password")}>New Password</label>
          </InputLabel>
        </div>

        { exposeLoginAfterReset &&
          <>
            <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
              <Field type="checkbox" className="custom-control-input" name="loginAfterReset"
                     id={getId(idPrefix, "reset-password-login-after-reset")} />
              <label className="custom-control-label" htmlFor={getId(idPrefix, "reset-password-login-after-reset")}>
                Log in now?
              </label>
            </div>

            <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
              <Field type="checkbox" className="custom-control-input" name="stayLoggedIn"
                     disabled={!props.values.loginAfterReset}
                     id={getId(idPrefix, "reset-password-stay-logged-in")} />
              <label className="custom-control-label" htmlFor={getId(idPrefix, "reset-password-stay-logged-in")}>
                Remember me
              </label>
            </div>
          </>
        }

        <button className="btn btn-primary btn-block" type="submit">Reset Password</button>
      </Form>
    }}
    </Formik>
  </div>
}

type RequestPasswordResetFormProps = {
  idPrefix?: string,
  labelsFirst?: boolean,
  onCancel?: () => void,
}

export const RequestPasswordResetForm: React.FC<RequestPasswordResetFormProps> =
  ({idPrefix, labelsFirst: labelsFirstArg, onCancel}) => {

  const labelsFirst = labelsFirstArg ?? true

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

  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate} >
    {(props) => <>
      <ErrorMessage error={error} />
      <Form id={getId(idPrefix, "request-password-reset-form")}>
        <div className="form-label-group mb-2">
          <InputLabel flip={labelsFirst}>
            <Field type="email" name="email" className="form-control"
                   id={getId(idPrefix, "request-password-reset-email")}
                   placeholder="Email address" required autoFocus />
            <label htmlFor={getId(idPrefix, "request-password-reset-email")}>Email address</label>
          </InputLabel>
        </div>

        <div className="d-flex justify-content-between mb-3">
          <button className={`btn btn-primary ${ loading ? 'disabled' : ''}`}
                  id="request-pw-reset-button" type="submit">
            { loading ? 'Please wait...' : 'Submit' }
          </button>
          {onCancel &&
            <button className="btn btn-outline-secondary" type="button"
                    onClick={(e) => { e.preventDefault(); onCancel(); }}>
              Cancel
            </button>
          }
        </div>
      </Form>

      {success
        ? <div className="alert alert-success m-3">A password reset link was sent to {submittedEmail}. Please look for it in your
              inbox, and click the link to reset your password.
          </div>
        : null }
    </>}
  </Formik>
}

type PwScoreRecord = Record<string, any>

const PasswordStrengthText: React.FC<{pwScore: PwScoreRecord}> = ({pwScore}) => {
  const { score } = pwScore
  const scoreDisplay = (() => {
    switch (score) {
      case 0: return 'Very weak'
      case 1: return 'Very weak'
      case 2: return 'Weak'
      case 3: return 'Moderate'
      case 4: return 'Strong'
      case 5: return 'Very strong'
      default:
        console.error(`unexpected password score ${score}`)
        return '???'
    }
  })()

  const classes = ['badge']
  if (score > 3) {
    classes.push('badge-success')
  } else if (score > 2) {
    classes.push('badge-warning')
  } else {
    classes.push('badge-danger')
  }

  return <div className="small p-1">
    Password Strength <span className={classNames(classes)}>{scoreDisplay}</span>
  </div>
}

const PasswordStrengthCheck: React.FC<{pwScore: PwScoreRecord}> = ({pwScore}) => {

  const config = useAppConfig()
  if (config == null) {
    return null
  }
  let { minPasswordStrength } = config
  if (minPasswordStrength == null) {
    minPasswordStrength = 0
  }

  if (pwScore.score >= minPasswordStrength || pwScore.feedback == null) {
    return null
  }

  return <div className="alert alert-warning">
    <div>Please choose a stronger password.</div>
    <div>{pwScore.feedback.warning}</div>
    {pwScore.feedback.suggestions && pwScore.feedback.suggestions.length > 0 &&
    <>
      <div>Suggestions:</div>
      <ul>
        { pwScore.feedback.suggestions.map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </>}
  </div>
}

type PasswordScoreProps = {
  password?: string,
  username?: string
}

export const PasswordScore: React.FC<PasswordScoreProps> = ({password, username}) => {

  const [passwordScore, setPasswordScore] = useState({} as Record<string, any>)

  useEffect(() => {
    if (password == null) {
      return
    }
    const scorePassword = async () => {
      const loaded = await zxcvbnAsync.load({})
      const dict = ['usermatic']
      if (username) {
        dict.push(username)
      }
      const results = loaded(password, dict)
      setPasswordScore(results)
    }
    scorePassword()
  }, [password, username])

  if (password == null || passwordScore.score == null) {
    return null
  }

  return <div className="text-muted mb-2">
    <PasswordStrengthText pwScore={passwordScore} />
    <PasswordStrengthCheck pwScore={passwordScore} />
  </div>
}

const DebouncedPasswordScore: React.FC<PasswordScoreProps> = ({password, username}) => {
  const debouncedPw = useDebounce(password, 300)
  return <PasswordScore password={debouncedPw} username={username} />
}
