
import React, { useContext } from 'react'

import { UMApolloContext, UMSiteIdContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, InputValueMap } from './forms'
import { ErrorMessage } from './errors'

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

  const [submitLogin, {loading, error, data} ] =
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
  return { submit, loading, error, data, success }
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

export const UMLoginForm: React.FC<{}> = () => {

  const { submit, error } = useLogin()

  const { onSubmit, onChange, values } = useForm(submit)

  return <form className="um-form-signin" onSubmit={onSubmit}>
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

    <button className="btn btn-lg btn-primary" type="submit">Login</button>
    <ErrorMessage error={error} />
  </form>
}

export const UMAccountCreationForm: React.FC<{}> = () => {

  const { submit, error } = useCreateAccount()

  const { onSubmit, onChange, values } = useForm(submit)

  return <form className="um-form-signin" onSubmit={onSubmit}>
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

    <button className="btn btn-lg btn-primary" type="submit">Login</button>
    <ErrorMessage error={error} />
  </form>
}

export const UMLogoutForm: React.FC<{}> = () => {

  const { submit, error } = useLogout()

  const { onSubmit } = useForm(submit)

  return <form className="um-form-logout" onSubmit={onSubmit} >
    <button className="btn btn-lg btn-primary" type="submit">Logout</button>
    <ErrorMessage error={error} />
  </form>
}
