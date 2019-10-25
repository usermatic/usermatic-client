
import React, { useContext } from 'react'

import { UMApolloContext, UMSiteIdContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, Form, Input, InputValueMap } from './forms'

import { LOGIN_MUT, LOGOUT_MUT, CREATE_ACCOUNT_MUT, SESSION_QUERY } from './fragments'

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

  const { submit } = useLogin()

  const form = useForm(submit)

  return (
    <div>
      <Form formHook={form}>
        <div>
          <Input id='email' inputType="text" initialValue="">
            Email
          </Input>
        </div>
        <div>
          <Input id='password' inputType="text" initialValue="">
            Password
          </Input>
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </Form>
    </div>
  )
}

export const UMAccountCreationForm: React.FC<{}> = () => {

  const { submit } = useCreateAccount()

  const form = useForm(submit)

  return <div>
    <Form formHook={form}>
      <div>
        <Input id='email' inputType="text" initialValue="">
          Email
        </Input>
      </div>
      <div>
        <Input id='password' inputType="text" initialValue="">
          Password
        </Input>
      </div>
      <div>
        <button type="submit">Create Account</button>
      </div>
    </Form>
  </div>
}

export const UMLogoutForm: React.FC<{}> = () => {

  const { submit } = useLogout()

  const form = useForm(submit)

  return <div>
    <Form formHook={form}>
      <div>
        <button type="submit">Logout</button>
      </div>
    </Form>
  </div>
}
