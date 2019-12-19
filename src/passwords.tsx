
import React, { useContext, useState, useEffect } from 'react'

import jwt from 'jsonwebtoken'

import { UMApolloContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, InputValueMap, InputLabel } from './forms'
import { ErrorMessage } from './errors'
import { useLogin } from './login'

import {
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

export const useChangePassword = () => {
  const client = useContext(UMApolloContext)
  const [submitChangePassword, ret] = useCsrfMutation(CHANGE_PW_MUT, { client })
  const {loading, error, data} = ret
  const submit = (values: InputValueMap) => {
    submitChangePassword({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useRequestPasswordResetEmail = () => {
  const client = useContext(UMApolloContext)
  const [submitPasswordResetRequest, ret] = useCsrfMutation(REQUEST_PW_RESET_EMAIL, { client })
  const {loading, error, data} = ret
  const submit = (values: InputValueMap) => {
    submitPasswordResetRequest({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useResetPassword = (token: string) => {
  const client = useContext(UMApolloContext)
  const [submitResetPassword, ret] = useCsrfMutation(RESET_PW_MUT, { client })
  const {loading, error, data} = ret
  const submit = (values: InputValueMap) => {
    submitResetPassword({ variables: { ...values, token } })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

type LoginState = {
  email: string
  password: string
  stayLoggedIn: string
}

export const ChangePasswordForm: React.FC<{idPrefix?: string, labelsFirst?: boolean}> =
  ({idPrefix, labelsFirst}) => {

  if (labelsFirst == null) {
    labelsFirst = true
  }

  const [submitChangePassword, { loading, error }] = useChangePassword()
  const { onSubmit, onChange, values } = useForm(submitChangePassword)

  return <form onSubmit={onSubmit}>
    <div className="form-label-group">
      <InputLabel flip={labelsFirst}>
        <input type="password" data-var="oldPassword" className="form-control"
               value={values.oldPassword || ''} onChange={onChange}
               id={getId(idPrefix, "change-password-old-password")}
               placeholder="Old Password" required autoFocus />
        <label htmlFor={getId(idPrefix, "change-password-old-password")}>Old Password</label>
      </InputLabel>
    </div>

    <div className="form-label-group">
      <InputLabel flip={labelsFirst}>
        <input type="password" data-var="newPassword" className="form-control"
               value={values.newPassword || ''} onChange={onChange}
               id={getId(idPrefix, "change-password-new-password")}
               placeholder="New Password" required />
        <label htmlFor={getId(idPrefix, "change-password-new-password")}>New Password</label>
      </InputLabel>
    </div>

    <button className={`btn btn-lg btn-primary ${ loading ? 'disabled' : '' }`} type="submit">
      { loading ? 'Please wait...' : 'Change Password' }
    </button>
    <ErrorMessage error={error} />
  </form>
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
          submitLogin(loginData)
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
    <form className="form-signin" onSubmit={onSubmit}>
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
    <form className="form-signin" onSubmit={(e) => {onSubmit(e); setSubmittedEmail(values.email)}}>
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
      ? <h5>A password reset link was sent to {submittedEmail}. Please look for it in your
            inbox, and click the link to reset your password.
        </h5>
      : null }
  </>
}

