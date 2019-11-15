
import React, { useContext, useState, useEffect } from 'react'

import jwt from 'jsonwebtoken'

import { UMApolloContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, InputValueMap } from './forms'
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
  const [submitChangePassword, {loading, error, data} ] =
    useCsrfMutation(CHANGE_PW_MUT, { client })

  const submit = (values: InputValueMap) => {
    submitChangePassword({ variables: values })
  }

  const success = !loading && !error && data
  return { submit, loading, error, data, success }
}

export const useRequestPasswordResetEmail = () => {
  const client = useContext(UMApolloContext)
  const [submitPasswordResetRequest, {loading, error, data} ] =
    useCsrfMutation(REQUEST_PW_RESET_EMAIL, { client })

  const submit = (values: InputValueMap) => {
    submitPasswordResetRequest({ variables: values })
  }

  const success = !loading && !error && data
  return { submit, loading, error, data, success }
}

export const useResetPassword = (token: string) => {
  const client = useContext(UMApolloContext)
  const [submitResetPassword, {loading, error, data} ] =
    useCsrfMutation(RESET_PW_MUT, { client })

  const submit = (values: InputValueMap) => {
    submitResetPassword({ variables: { ...values, token } })
  }

  const success = !loading && !error && data
  return { submit, loading, error, data, success }
}

type LoginState = {
  email: string
  password: string
  stayLoggedIn: string
}

export const UMChangePasswordForm: React.FC<{idPrefix?: string}> = ({idPrefix}) => {

  const { submit: submitChangePassword, loading, error } = useChangePassword()
  const { onSubmit, onChange, values } = useForm(submitChangePassword)

  return <form onSubmit={onSubmit}>
    <div className="form-label-group">
      <input type="password" data-var="oldPassword" className="form-control"
             value={values.oldPassword || ''} onChange={onChange}
             id={getId(idPrefix, "change-password-old-password")}
             placeholder="Old Password" required autoFocus />
      <label htmlFor={getId(idPrefix, "change-password-old-password")}>Old Password</label>
    </div>

    <div className="form-label-group">
      <input type="password" data-var="newPassword" className="form-control"
             value={values.newPassword || ''} onChange={onChange}
             id={getId(idPrefix, "change-password-new-password")}
             placeholder="New Password" required />
      <label htmlFor={getId(idPrefix, "change-password-new-password")}>New Password</label>
    </div>

    <button className={`btn btn-lg btn-primary ${ loading ? 'disabled' : '' }`} type="submit">
      { loading ? 'Please wait...' : 'Change Password' }
    </button>
    <ErrorMessage error={error} />
  </form>
}

type UMRequestPasswordResetFormProps = {
  token: string
  onLogin: () => void
  idPrefix?: string
}

export const UMResetPasswordForm: React.FC<UMRequestPasswordResetFormProps> = ({token, onLogin, idPrefix}) => {

  const [loginData, setLoginData] = useState<LoginState | undefined>()

  const { submit, error, success } = useResetPassword(token)

  const { submit: submitLogin, error: loginError, success: loginSuccess } = useLogin()

  useEffect(() => {
    if (success && loginData) {
      setLoginData(undefined)
      submitLogin(loginData)
    }

    if (loginSuccess) {
      onLogin()
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
    if (Boolean(values.loginAfterReset)) {
      setLoginData({ password: newPassword, stayLoggedIn, email })
    }
    submit({ newPassword })
  }

  const {onSubmit, onChange, values} = useForm(submitWrapper)

  return <form className="form-signin" onSubmit={onSubmit}>
    <div className="form-label-group">
      <input type="password" data-var="newPassword" className="form-control"
             value={values.newPassword || ''} onChange={onChange}
             id={getId(idPrefix, "reset-password-new-password")}
             placeholder="New Password" required autoFocus />
      <label htmlFor={getId(idPrefix, "reset-password-new-password")}>New Password</label>
    </div>

    <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
      <input type="checkbox" className="custom-control-input" data-var="loginAfterReset"
             id={getId(idPrefix, "reset-password-login-after-reset")}
             onChange={onChange} checked={Boolean(values.loginAfterReset)} />
      <label className="custom-control-label" htmlFor={getId(idPrefix, "reset-password-login-after-reset")}>
        Log in now?
      </label>
    </div>

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

    <button className="btn btn-lg btn-primary" type="submit">Reset Password</button>
    <ErrorMessage error={error} />
    <ErrorMessage error={loginError} />
  </form>
}

export const UMRequestPasswordResetForm: React.FC<{idPrefix?: string}> = ({idPrefix}) => {
  const { submit, loading, error, success } = useRequestPasswordResetEmail()

  const [submittedEmail, setSubmittedEmail] = useState('')

  const {onSubmit, onChange, values} = useForm(submit)

  return <>
    <form className="form-signin" onSubmit={(e) => {onSubmit(e); setSubmittedEmail(values.email)}}>
      <div className="form-label-group">
        <input type="email" data-var="email" className="form-control"
               value={values.email || ''} onChange={onChange}
               id={getId(idPrefix, "request-password-reset-email")}
               placeholder="Enter your email address" required autoFocus />
        <label htmlFor={getId(idPrefix, "request-password-reset-email")}>Enter your email address</label>
      </div>

      <button className={`btn btn-lg btn-primary ${ loading ? 'disabled' : ''}`}
              type="submit">
        { loading ? 'Please wait...' : 'Submit' }
      </button>
      <ErrorMessage error={error} />
    </form>

    {success
      ? <h5>A password reset link was sent to {submittedEmail}. Please look for it in your
            inbox, and click the link to reset your password.
        </h5>
      : null }
  </>
}

