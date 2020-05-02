
import React, { useState, useEffect } from 'react'
import { Formik, Form, Field, FormikValues, FormikErrors } from 'formik'

import { DocumentNode } from 'graphql'
import jwt from 'jsonwebtoken'
import classNames from 'classnames'

import { OperationVariables } from '@apollo/react-common'

import { useAppConfig } from './auth'
import { usePasswordCredential, usePrimaryEmail } from './user'
import { useCsrfMutation } from './hooks'
import { useForm, InputValueMap, InputLabel } from './forms'
import { ErrorMessage } from './errors'
import { useLogin } from './login'
import { useDebounce } from './use-debounce'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import {
  ADD_PW_MUT,
  CHANGE_PW_MUT,
  RESET_PW_MUT,
  REQUEST_PW_RESET_EMAIL
} from './fragments'

const getId = (prefix: string | undefined, suffix: string) => {
  if (prefix) {
    return `${prefix}-${suffix}`
  } else {
    // add some random goobledygook to avoid conflicts with other component
    // libraries.
    return `um9akc83a-${suffix}`
  }
}

const useApiMutation = (mut: DocumentNode, options: OperationVariables) => {
  const [submit, ret] = useCsrfMutation(mut, options)
  const {loading, error, data} = ret
  const submitWrapper = (values: InputValueMap) => {
    submit({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submit, typeof retObj]
}

export const useChangePassword = (options: OperationVariables = {}) => {
  return useApiMutation(CHANGE_PW_MUT, options)
}

export const useAddPassword = (options: OperationVariables = {}) => {
  return useApiMutation(ADD_PW_MUT, options)
}

export const useRequestPasswordResetEmail = (options: OperationVariables = {}) => {
  return useApiMutation(REQUEST_PW_RESET_EMAIL, options)
}

export const useResetPassword = (token: string, options: OperationVariables = {}) => {
  const [submitResetPassword, ret] = useCsrfMutation(RESET_PW_MUT, options)
  const {loading, error, data} = ret
  const submit = (values: InputValueMap) => {
    submitResetPassword({ variables: { ...values, token } })
  }
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

const useAddOrChangePassword = (options: OperationVariables = {}) => {
  const { passwordCredential } = usePasswordCredential()

  const change = useChangePassword(options)
  const add = useAddPassword(options)

  if (passwordCredential != null) {
    return change
  } else {
    return add
  }
}

type LoginState = {
  email: string
  password: string
  stayLoggedIn: string
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

  return <Formik initialValues={initialValues} onSubmit={submit} validate={validate}>
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
  allowLoginAfterReset?: boolean
  redirectAfterReset?: boolean
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> =
  ({token, onLogin, idPrefix, labelsFirst, allowLoginAfterReset,
    redirectAfterReset}) => {

  if (labelsFirst == null) { labelsFirst = true }
  if (allowLoginAfterReset == null) { allowLoginAfterReset = true }
  if (redirectAfterReset == null) { redirectAfterReset = false }

  if (redirectAfterReset && allowLoginAfterReset) {
    throw new Error(`
      The \`redirectAfterReset\` and \`allowLoginAfterReset\`
      properties are mutually exclusive.
    `)
  }

  const [loginData, setLoginData] = useState<LoginState | undefined>()

  const [submit, { error, success, data }] = useResetPassword(token)

  const [submitLogin, { error: loginError, success: loginSuccess }] = useLogin()

  useEffect(() => {
    if (success) {
      if (redirectAfterReset) {
        const { redirectUri } = data.svcResetPassword
        setTimeout(() => {
         window.location.replace(redirectUri)
        }, 1000)
      } else {
        if (loginData) {
          setLoginData(undefined)
          // TODO: this should get cleaned up when we switch this form to Formik
          submitLogin({ ...loginData, stayLoggedIn: Boolean(loginData.stayLoggedIn)})
        }
      }
    }

    if (loginSuccess) {
      if (onLogin != null) {
        onLogin()
      }
    }
  })

  const submitWrapper = (values: InputValueMap) => {
    const decoded = jwt.decode(token)
    if (!decoded || typeof decoded != 'object') {
      console.error("password reset token was invalid")
      submit({}) // do a bogus submit to force an error
      return
    }

    const { email } = decoded
    const { newPassword, stayLoggedIn } = values
    if (allowLoginAfterReset && Boolean(values.loginAfterReset)) {
      setLoginData({ password: newPassword, stayLoggedIn, email })
    }
    submit({ newPassword })
  }

  const {onSubmit, onChange, values} = useForm(submitWrapper)

  if (success) {
    const redirectUri = data.resetPassword && data.resetPassword.redirectUri
    return <div className="alert alert-success">
      Your password has been reset successfully.
      { redirectUri &&
        <>You will be redirected to <a href="{redirectUri}">{redirectUri}</a> shortly.</>
      }
    </div>
  }

  return <div>
    <ErrorMessage error={error} />
    <ErrorMessage error={loginError} />
    <form onSubmit={onSubmit}>
      <div className="form-label-group">
        <InputLabel flip={labelsFirst}>
          <input type="password" data-var="newPassword" className="form-control"
                 value={values.newPassword || ''} onChange={onChange}
                 id={getId(idPrefix, "reset-password-new-password")}
                 placeholder="New Password" required autoFocus />
          <label htmlFor={getId(idPrefix, "reset-password-new-password")}>New Password</label>
        </InputLabel>
      </div>

      { allowLoginAfterReset &&

      <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
        <input type="checkbox" className="custom-control-input" data-var="loginAfterReset"
               id={getId(idPrefix, "reset-password-login-after-reset")}
               onChange={onChange} checked={Boolean(values.loginAfterReset)} />
        <label className="custom-control-label" htmlFor={getId(idPrefix, "reset-password-login-after-reset")}>
          Log in now?
        </label>
      </div> }

      { Boolean(values.loginAfterReset) ?
        <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
          <input type="checkbox" className="custom-control-input" data-var="stayLoggedIn"
                 id={getId(idPrefix, "reset-password-stay-logged-in")}
                 onChange={onChange} checked={Boolean(values.stayLoggedIn)} />
          <label className="custom-control-label" htmlFor={getId(idPrefix, "reset-password-stay-logged-in")}>
            Remember me
          </label>
        </div>
        : null }

      <button className="btn btn-primary" type="submit">Reset Password</button>
    </form>
  </div>
}

type RequestPasswordResetFormProps = {
  idPrefix?: string,
  labelsFirst?: boolean,
  onCancel?: () => void,
}

export const RequestPasswordResetForm: React.FC<RequestPasswordResetFormProps> =
  ({idPrefix, labelsFirst, onCancel}) => {

  if (labelsFirst == null) {
    labelsFirst = true
  }

  const [submit, { loading, error, success }] = useRequestPasswordResetEmail()

  const [submittedEmail, setSubmittedEmail] = useState('')

  const {onSubmit, onChange, values} = useForm(submit)

  return <>
    <ErrorMessage error={error} />
    <form onSubmit={(e) => {onSubmit(e); setSubmittedEmail(values.email)}}>
      <div className="form-label-group">
        <InputLabel flip={labelsFirst}>
          <input type="email" data-var="email" className="form-control"
                 value={values.email || ''} onChange={onChange}
                 id={getId(idPrefix, "request-password-reset-email")}
                 placeholder="Email address" required autoFocus />
          <label htmlFor={getId(idPrefix, "request-password-reset-email")}>Email address</label>
        </InputLabel>
      </div>

      <div className="d-flex justify-content-between">
        <button className={`btn btn-primary ${ loading ? 'disabled' : ''}`}
                type="submit">
          { loading ? 'Please wait...' : 'Submit' }
        </button>
        {onCancel &&
          <button className="btn btn-outline-secondary" type="button"
                  onClick={(e) => { e.preventDefault(); onCancel(); }}>
            Cancel
          </button>
        }
      </div>
    </form>

    {success
      ? <div className="alert alert-success m-3">A password reset link was sent to {submittedEmail}. Please look for it in your
            inbox, and click the link to reset your password.
        </div>
      : null }
  </>
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
