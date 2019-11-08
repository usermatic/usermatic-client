
import React, { useContext, useEffect, useState } from 'react'
import { ApolloError } from 'apollo-client'
import { GraphQLError } from 'graphql'

import { useCredentials, UMApolloContext, UMSiteIdContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, InputValueMap } from './forms'
import { ErrorMessage } from './errors'
import { UMRequestPasswordResetForm } from './passwords'

import {
  LOGIN_MUT,
  LOGOUT_MUT,
  CREATE_ACCOUNT_MUT,
  SESSION_QUERY
} from './fragments'

export const useLogout = () => {
  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)

  const [submit, {loading, error, data} ] =
    useCsrfMutation(
      LOGOUT_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { siteId } }]
      }
    )

  const success = !loading && !error && data
  return { submit, loading, error, data, success }
}

export const useLogin = () => {
  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)

  const [submitLogin, {loading, error, data, called} ] =
    useCsrfMutation(
      LOGIN_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { siteId } }]
      }
    )

  const submit = (values: InputValueMap) => {
    submitLogin({ variables: values })
  }

  const success = !loading && !error && data
  return { submit, loading, error, data, success, called }
}

export const useCreateAccount = () => {
  const client = useContext(UMApolloContext)
  const siteId = useContext(UMSiteIdContext)
  const [submitCreateAccount, {loading, error, data} ] =
    useCsrfMutation(
      CREATE_ACCOUNT_MUT,
      {
        client,
        refetchQueries: [{ query: SESSION_QUERY, variables: { siteId } }]
      })

  const submit = (values: InputValueMap) => {
    submitCreateAccount({ variables: values })
  }

  const success = !loading && !error && data
  return { submit, loading, error, data, success }
}

type LoginFormProps = {
  onLogin: (() => void) | undefined
}

export const UMLoginForm: React.FC<LoginFormProps> = ({onLogin}) => {

  const [isForgotPasswordMode, setForgotPasswordMode] = useState(false)

  const { submit, loading, error, called } = useLogin()

  const { onSubmit, onChange, values } = useForm(submit)

  const { id: credentialId, loading: credentialLoading } = useCredentials()

  useEffect(() => {
    // We need to wait until the credential context is reporting that we are logged in,
    // (in addition to waiting for useLogin() mutation to finish). Otherwise there's a window
    // during which other components might think we aren't logged in, even though we are
    // about to be.
    if (called && !loading && !error && credentialId && !credentialLoading && onLogin) {
      onLogin()
    }
  })

  if (isForgotPasswordMode) {
    return <>
      <div>
        Enter your email to get a password-reset link
        <button className="btn btn-secondary" type="button"
                onClick={(e) => { e.preventDefault(); setForgotPasswordMode(false); }}>
          Cancel
        </button>
      </div>
      <UMRequestPasswordResetForm/>
    </>
  }

  return <form className="form-signin" onSubmit={onSubmit}>
    <div className="form-label-group">
      <input type="email" id="email" className="form-control"
             value={values.email || ''} onChange={onChange}
             placeholder="Email address" required autoFocus />
      <label htmlFor="email">Email address</label>
    </div>

    <div className="form-label-group">
      <input type="password" id="password" className="form-control"
             value={values.password || ''} onChange={onChange}
             placeholder="Password" required />
      <label htmlFor="password">Password</label>
    </div>

    <div className="custom-control custom-checkbox mb-3 justify-content-between d-flex">
      <input type="checkbox" className="custom-control-input" id="stayLoggedIn"
             onChange={onChange} checked={Boolean(values.stayLoggedIn)} />
      <label className="custom-control-label" htmlFor="stayLoggedIn">Remember me</label>
    </div>

    <div className="mb-3 justify-content-between d-flex">
      <button className="btn btn-lg btn-primary" type="submit">Sign in</button>
      <button className="btn btn-secondary" type="button"
              onClick={(e) => { e.preventDefault(); setForgotPasswordMode(true); }}>
        Forgot Password?
      </button>
    </div>
    <ErrorMessage error={error} />
  </form>
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
  loginAfterCreation: boolean
  onLogin?: () => void
}

export const UMAccountCreationForm: React.FC<AccountCreationProps> =
  ({loginAfterCreation, onLogin}) => {

  const { id } = useCredentials()
  const { submit, error, success } = useCreateAccount()

  const { onSubmit, onChange, values } = useForm(submit,
    { loginAfterCreation }
  )

  useEffect(() => {
    if (success && id && onLogin) {
      onLogin()
    }
  })

  return <>
    <form className="um-form-signin" onSubmit={onSubmit}>
      <div className="um-form-label-group">
        <input type="email" id="email" className="um-form-control"
               value={values.email || ''} onChange={onChange}
               placeholder="Enter your email address" required autoFocus />
        <label htmlFor="newPassword">Enter your email address</label>
      </div>

      <div className="um-form-label-group">
        <input type="password" id="password" className="um-form-control"
               value={values.password || ''} onChange={onChange}
               placeholder="Enter your password" required />
        <label htmlFor="password">Enter your password</label>
      </div>

      <div className="custom-control custom-checkbox mb-3">
        <input type="checkbox" className="custom-control-input" id="stayLoggedIn"
               onChange={onChange} checked={Boolean(values.stayLoggedIn)} />
        <label className="custom-control-label" htmlFor="stayLoggedIn">Remember me</label>
      </div>

      <button className="btn btn-lg btn-primary" type="submit">Create Account</button>
    </form>
    <UserCreateError error={error} />
  </>
}

export const UMLogoutForm: React.FC<{}> = () => {

  const { submit, error } = useLogout()

  const { onSubmit } = useForm(submit)

  return <form className="um-form-logout" onSubmit={onSubmit} >
    <button className="btn btn-lg btn-primary" type="submit">Logout</button>
    <ErrorMessage error={error} />
  </form>
}
