
import React, { useContext } from 'react'

import { UMApolloContext, UMSiteIdContext } from './auth'
import { useCsrfMutation } from './hooks'
import { useForm, Form, Input, InputValueMap } from './forms'

import { LOGIN_MUT, LOGOUT_MUT, CREATE_ACCOUNT_MUT, SESSION_QUERY } from './fragments'

type MutationCallback = (data: any) => void

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

  return { submit, loading, error, data }
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

  return { submit, loading, error, data }
}

export const useCreateAccount = () => {
  const client = useContext(UMApolloContext)
  const [submitCreateAccount, {loading, error, data} ] =
    useCsrfMutation(CREATE_ACCOUNT_MUT, { client })

  const submit = (values: InputValueMap) => {
    submitCreateAccount({ variables: values })
  }

  return { submit, loading, error, data }
}

export const UMLoginForm: React.FC<{onLogin?: MutationCallback}> = ({onLogin}) => {

  const { submit, loading, error, data } = useLogin()

  const form = useForm(submit)

  if (!loading && !error && onLogin) {
    onLogin(data)
  }

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

export const UMAccountCreationForm: React.FC<{onCreated?: MutationCallback}> = ({onCreated}) => {

  const { submit, loading, error, data } = useCreateAccount()

  const form = useForm(submit)

  if (!loading && !error && onCreated) {
    onCreated(data)
  }

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

export const UMLogoutForm: React.FC<{onLogout?: MutationCallback}> = ({onLogout}) => {

  const { submit, loading, error, data } = useLogout()

  const form = useForm(submit)

  if (!loading && !error && onLogout) {
    onLogout(data)
  }

  return <div>
    <Form formHook={form}>
      <div>
        <button type="submit">Logout</button>
      </div>
    </Form>
  </div>
}
