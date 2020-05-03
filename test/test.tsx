import 'jsdom-global/register'

import React, { ReactNode, useEffect } from 'react'

import Adapter from 'enzyme-adapter-react-16'
import { configure, mount, ReactWrapper } from 'enzyme'
import toJSON from 'enzyme-to-json'

import { act } from 'react-dom/test-utils'
import jwt from 'jsonwebtoken'

import {
  makeExecutableSchema,
  addMocksToSchema
} from 'graphql-tools'

import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { SchemaLink } from 'apollo-link-schema'
import { ApolloProvider } from '@apollo/react-common'

// Import the schema object from previous code snippet above
// @ts-ignore
import schemaStr from '../../schemas/api-schema'


import * as client from '../src/index'
import { useCsrfToken } from '../src/hooks'

configure({ adapter: new Adapter() })

const email = 'bob@bob.com'
const userId = '915cb3c0-a3ac-44be-a2a8-6edb25bfeacc'
const appId = '248e5473-d9a6-4487-9164-24c3052d2898'

const defaultMocks = {
  AppConfig: () => ({ minPasswordStrength: 3 }),
  SvcAuthToken: () => ({ userJwt: jwt.sign({ id: userId }, 'abc') })
}

const extendMocks = (mocks: object) => {
  return {
    ...defaultMocks,
    ...mocks
  }
}

const userWithPassword = () => ({
  id: userId,
  primaryEmail: email,
  credentials: [
    {
      type: 'PASSWORD',
      id: 'a31d68e6-898f-4998-9e6d-25ef1a62f62c',
      email: email,
      emailIsVerified: true
    }
  ]
})

const userWithoutPassword = () => ({
  id: userId,
  primaryEmail: email,
  credentials: [
    {
      type: 'OAUTH',
      id: 'a31d68e6-898f-4998-9e6d-25ef1a62f62c',
      provider: 'GOOGLE',
      providerId: 'abc',
      photoURL: '/photo'
    }
  ]
})

const configNoOauth = {
  minPasswordStrength: 3,
  githubLoginEnabled: false,
  githubLoginUrl: '/doesntmatter',
  googleLoginEnabled: false,
  googleLoginUrl: '/doesntmatter',
  fbLoginEnabled: false,
  fbLoginUrl: '/doesntmatter'
}

const configOauth = {
  minPasswordStrength: 3,
  githubLoginEnabled: true,
  githubLoginUrl: '/doesntmatter',
  googleLoginEnabled: true,
  googleLoginUrl: '/doesntmatter',
  fbLoginEnabled: true,
  fbLoginUrl: '/doesntmatter'
}

const CsrfTokenWrapper: React.FC<{children: ReactNode}> = ({children}) => {
  const { csrfToken } = useCsrfToken()
  if (!csrfToken) {
    return null
  }
  return <>{children}</>
}

const TestWrapper: React.FC<{children: ReactNode, mocks: any}> = ({children, mocks}) => {
  const schema = makeExecutableSchema({ typeDefs: schemaStr });
  addMocksToSchema({ schema, mocks });

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: new SchemaLink({ schema })
  });

  return <ApolloProvider client={apolloClient}>
    <client.AuthProvider appId={appId}>
      <CsrfTokenWrapper>
        {children}
      </CsrfTokenWrapper>
    </client.AuthProvider>
  </ApolloProvider>
}

test('<LoginForm>/<AccountCreationForm> forgot password', async () => {
  jest.useFakeTimers()

  const svcRequestPasswordResetEmail = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => configNoOauth,
    Mutation: () => ({
      svcRequestPasswordResetEmail
    })
  })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.LoginForm idPrefix="test" />
        <client.AccountCreationForm/>
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  wrapper.find('#forgot-pw-button').simulate('click')
  wrapper.update()

  await act(async () => { jest.runAllTimers() })
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  setInput(wrapper, 'email', 'input#test-request-password-reset-email', email)
  wrapper.find('form#test-request-password-reset-form').simulate('submit')

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(svcRequestPasswordResetEmail.mock.calls[0][1]).toMatchObject({ email })
})

test('<LoginForm>/<AccountCreationForm> oauth', async () => {
  jest.useFakeTimers()

  const mocks = extendMocks({
    AppConfig: () => (configOauth)
  })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.LoginForm/>
        <client.AccountCreationForm/>
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

const setInput = (wrapper: ReactWrapper, name: string, selector: string,
                  value: string | boolean) => {
  const subwrapper = wrapper.find('#client-test-div')
  subwrapper.find(selector).simulate('change', { target: { value, name } })
}

test('<LoginForm> login', async () => {
  jest.useFakeTimers()

  const email = 'bob@bob.com'
  const password = 'hunter2'

  const loginPassword = jest.fn().mockReturnValue({})
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    Mutation: () => ({
      loginPassword
    })
  })

  const onLogin = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.LoginForm onLogin={onLogin} idPrefix="test" />
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  setInput(wrapper, 'email', 'input#test-login-email', email)
  setInput(wrapper, 'password', 'input#test-login-password', password)
  setInput(wrapper, 'stayLoggedIn', 'input#test-login-stay-logged-in', true)

  wrapper.find('form').simulate('submit')

  await act(async () => {
    jest.runAllTimers()
  })
  wrapper.update()
  await act(async () => {
    jest.runAllTimers()
  })
  expect(loginPassword.mock.calls[0][1]).toMatchObject(
    { email, password, stayLoggedIn: true },
  )
  expect(onLogin).toHaveBeenCalled()
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<ChangePasswordForm> with password', async () => {
  jest.useFakeTimers()

  const oldPassword = 'hunter2'
  const newPassword = 'hunter3'

  const svcChangePassword = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    SvcUser: userWithPassword,
    Mutation: () => ({
      svcChangePassword
    })
  })

  const onSuccess = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.ChangePasswordForm idPrefix="test" labelsFirst={false}
                                   onSuccess={onSuccess} />
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  setInput(wrapper, 'oldPassword', 'input#test-change-password-old-password', oldPassword)
  setInput(wrapper, 'newPassword', 'input#test-change-password-new-password', newPassword)

  wrapper.find('form').simulate('submit')

  await act(async () => { jest.runAllTimers() })
  wrapper.update()
  await act(async () => { jest.runAllTimers() })

  expect(svcChangePassword.mock.calls[0][1]).toMatchObject(
    { oldPassword, newPassword }
  )
  expect(onSuccess).toHaveBeenCalled()
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<ChangePasswordForm> without password', async () => {
  jest.useFakeTimers()

  const newPassword = 'hunter3'

  const addPassword = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    SvcUser: userWithoutPassword,
    Mutation: () => ({
      addPassword
    })
  })

  const onSuccess = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.ChangePasswordForm idPrefix="test" labelsFirst={false}
                                   onSuccess={onSuccess} />
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  setInput(wrapper, 'newPassword', 'input#test-change-password-new-password', newPassword)

  wrapper.find('form').simulate('submit')

  await act(async () => { jest.runAllTimers() })
  wrapper.update()
  await act(async () => { jest.runAllTimers() })

  expect(addPassword.mock.calls[0][1]).toMatchObject(
    { email, password: newPassword }
  )
  expect(onSuccess).toHaveBeenCalled()
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('useSendVerificationEmail', async () => {
  jest.useFakeTimers()

  const svcSendVerificationEmail = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    SvcUser: userWithPassword,
    Mutation: () => ({
      svcSendVerificationEmail
    })
  })

  const VerificationSender: React.FC<{}> = () => {
    const [submit] = client.useSendVerificationEmail(email)
    useEffect(() => { submit() }, [])
    return <div>VerificationSender</div>
  }

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <VerificationSender/>
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()
  expect(svcSendVerificationEmail.mock.calls[0][1]).toMatchObject({ email })
})

test('<ReauthenticateGuard>', async () => {
  jest.useFakeTimers()

  const signReauthenticationToken = jest.fn().mockImplementation(
    (root, { contents, password }) => (
      jwt.sign({
        id: userId,
        userContents: contents,
        reauthenticationMethods: ['password']
      }, 'abc')
    )
  )

  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    SvcUser: userWithPassword,
    Mutation: () => ({
      signReauthenticationToken
    })
  })

  const GuardedComponent: React.FC<{}> = () => {
    const token = client.useReauthToken()
    if (!token) { return null }
    const decoded = jwt.decode(token)
    if (decoded == null || typeof decoded === 'string') { return null }
    if (decoded.iat) { decoded.iat = 42 }

    return <div>
      token: { token && JSON.stringify(decoded) }
    </div>
  }

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <client.ReauthenticateGuard
          tokenContents="a token"
        >
          <GuardedComponent/>
        </client.ReauthenticateGuard>
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  setInput(wrapper, 'password', 'input#reauth-guard-password', 'hunter2')
  wrapper.find('form#reauth-guard-form').simulate('submit')

  await act(async () => { jest.runAllTimers() })
  wrapper.update()
  await act(async () => { jest.runAllTimers() })

  expect(signReauthenticationToken.mock.calls[0][1]).toMatchObject(
    { contents: '"a token"', password: "hunter2" }
  )

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})
