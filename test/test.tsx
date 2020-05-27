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

import { GraphQLError } from 'graphql'

import { ApolloClient } from 'apollo-client'
import { InMemoryCache, defaultDataIdFromObject } from 'apollo-cache-inmemory'
import { SchemaLink } from 'apollo-link-schema'
import { ApolloProvider } from '@apollo/react-common'

// Import the schema object from previous code snippet above
// @ts-ignore
import schemaStr from '../../schemas/api-schema'

import * as client from '../src/index'
import * as components from '../src/components'
import { useCsrfToken } from '../src/hooks'

configure({ adapter: new Adapter() })

const email = 'bob@bob.com'
const userId = '915cb3c0-a3ac-44be-a2a8-6edb25bfeacc'
const appId = '248e5473-d9a6-4487-9164-24c3052d2898'
const credentialId = 'a31d68e6-898f-4998-9e6d-25ef1a62f62c'

const defaultMocks = {
  AppConfig: () => ({ minPasswordStrength: 3 }),
  LoginData: () => ({ userJwt: jwt.sign({ id: userId }, 'abc') }),
  User: () => ({}),
  EmptyPayload: () => ({
    refetch: () => ({})
  }),
  LoginPayload: () => ({
    refetch: () => ({})
  }),
  PasswordResetPayload: () => ({
    refetch: () => ({})
  })
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
      id: credentialId,
      email: email,
      emailIsVerified: true
    }
  ],
  userJwt: jwt.sign({ id: userId }, 'abc')
})

const userWithoutPassword = () => ({
  id: userId,
  primaryEmail: email,
  credentials: [
    {
      type: 'OAUTH',
      id: credentialId,
      provider: 'GOOGLE',
      providerId: 'abc',
      photoURL: '/photo'
    }
  ],
  userJwt: jwt.sign({ id: userId }, 'abc')
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

const exists = (selector: string) => {
  const ret = (wrapper: ReactWrapper) => {
    const el = wrapper.find(selector)
    return el.length >= 1
  }
  ret.toString = () => `exists(${selector})`
  return ret
}

const hasBeenCalled = (mockFn: jest.Mock) => {
  const ret = () => (mockFn.mock.calls.length > 0)
  ret.toString = () => mockFn.getMockName()
  return ret
}

const waitUntil = async (
  wrapper: ReactWrapper,
  fn: (w: ReactWrapper) => boolean
): Promise<'finished'> => {
  for (let i = 0; i < 20; i++) {
    await act(async () => {
      jest.runAllTimers()
    })
    wrapper.update()
    if (fn(wrapper)) {
      return 'finished'
    }
  }
  throw new Error(`waitUntil(${fn}) timed out`)
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

  const cache = new InMemoryCache({
    dataIdFromObject: object => {
      switch (object.__typename) {
        case 'Query': return 'ROOT_QUERY'
        default: return defaultDataIdFromObject(object)
      }
    },
  })

  const apolloClient = new ApolloClient({
    cache,
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

  const requestPasswordResetEmail = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => configNoOauth,
    Query: () => ({
      getAuthenticatedUser: () => null
    }),
    Mutation: () => ({
      requestPasswordResetEmail
    })
  })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.LoginForm idPrefix="test" />
        <components.AccountCreationForm/>
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

  expect(requestPasswordResetEmail.mock.calls[0][1]).toMatchObject({ email })
})

test('<LoginForm>/<AccountCreationForm> oauth', async () => {
  jest.useFakeTimers()

  const mocks = extendMocks({
    AppConfig: () => (configOauth),
    Query: () => ({
      getAuthenticatedUser: () => null
    }),
  })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.LoginForm/>
        <components.AccountCreationForm/>
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

const setInput = (wrapper: ReactWrapper, name: string, selector: string,
                  value: string) => {
  const subwrapper = wrapper.find('#client-test-div')
  subwrapper.find(selector).simulate('change', { target: { value, name } })
}

const setCheckbox = (wrapper: ReactWrapper, name: string, selector: string,
                     checked: boolean) => {
  const subwrapper = wrapper.find('#client-test-div')
  subwrapper.find(selector).simulate('change', { target: { checked, name } })
}

test('<LoginForm> login', async () => {
  jest.useFakeTimers()

  const email = 'bob@bob.com'
  const password = 'hunter2'

  const login = jest.fn().mockReturnValue({
    user: userWithPassword()
  })
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    Mutation: () => ({
      login
    }),
    Query: () => ({
      getAuthenticatedUser: () => {
        if (login.mock.calls.length === 0) {
          return null
        }
        return userWithPassword()
      }
    })
  })

  const onLogin = jest.fn().mockName('onLogin')
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.LoginForm onLogin={onLogin} idPrefix="test" />
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  setInput(wrapper, 'email', 'input#test-login-email', email)
  setInput(wrapper, 'password', 'input#test-login-password', password)
  setCheckbox(wrapper, 'stayLoggedIn', 'input#test-login-stay-logged-in', true)

  wrapper.find('form').simulate('submit')

  await act(async () => {
    jest.runAllTimers()
  })
  wrapper.update()
  await act(async () => {
    jest.runAllTimers()
  })
  expect(login.mock.calls[0][1]).toMatchObject({
    credential: { password: { email, password } },
    stayLoggedIn: true
  })
  await waitUntil(wrapper, hasBeenCalled(onLogin))
  expect(onLogin).toHaveBeenCalled()
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

const codeError = (msg: string, code: string) => {
  return new GraphQLError(msg, undefined, undefined, undefined,
    undefined, undefined, { exception: { code } })
}

test('<LoginForm> TOTP', async () => {
  jest.useFakeTimers()

  const email = 'bob@bob.com'
  const password = 'hunter2'

  let loginSuccess = false

  const login = jest.fn().mockImplementation(
    (root, { credential: { totpCode }, stayLoggedIn }) => {
      if (!totpCode) {
        throw codeError('totp required', 'TOTP_REQUIRED')
      }
      loginSuccess = true
      return { user: userWithPassword() }
    }
  )

  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    Mutation: () => ({
      login
    }),
    Query: () => ({
      getAuthenticatedUser: () => {
        if (!loginSuccess) {
          return null
        }
        return userWithPassword()
      }
    })
  })

  const onLogin = jest.fn().mockName('onLogin')
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.LoginForm onLogin={onLogin} idPrefix="test" />
      </div>
    </TestWrapper>
  )

  await waitUntil(wrapper, exists('input#test-login-email'))
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  setInput(wrapper, 'email', 'input#test-login-email', email)
  setInput(wrapper, 'password', 'input#test-login-password', password)
  setCheckbox(wrapper, 'stayLoggedIn', 'input#test-login-stay-logged-in', true)

  wrapper.find('form').simulate('submit')

  await waitUntil(wrapper, exists('input#test-totp-code'))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  wrapper.find('#test-recovery-code-button').simulate('click')

  await waitUntil(wrapper, exists('input#test-recovery-code'))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  wrapper.find('#test-recovery-code-cancel').simulate('click')

  setInput(wrapper, 'code', 'input#test-totp-code', '012345')

  await waitUntil(wrapper, hasBeenCalled(onLogin))

})

test('<ChangePasswordForm> with password', async () => {
  jest.useFakeTimers()

  const oldPassword = 'hunter2'
  const newPassword = 'hunter3'

  const changePassword = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
    Mutation: () => ({
      changePassword
    })
  })

  const onSuccess = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.ChangePasswordForm idPrefix="test" labelsFirst={false}
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

  expect(changePassword.mock.calls[0][1]).toMatchObject(
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
    User: userWithoutPassword,
    Mutation: () => ({
      addPassword
    })
  })

  const onSuccess = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.ChangePasswordForm idPrefix="test" labelsFirst={false}
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

  const sendVerificationEmail = jest.fn().mockReturnValue(true)
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
    Mutation: () => ({
      sendVerificationEmail
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
  expect(sendVerificationEmail.mock.calls[0][1]).toMatchObject({ email })
})

const mockSignReauthenticationToken = () => (
  jest.fn().mockImplementation(
    (root, { contents, password }) => ({
      token: jwt.sign({
        id: userId,
        userContents: contents,
        reauthenticationMethods: ['password']
      }, 'abc')
    })
  )
)


test('<ReauthenticateGuard>', async () => {
  jest.useFakeTimers()

  const signReauthenticationToken = mockSignReauthenticationToken()

  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
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
        <components.ReauthenticateGuard
          tokenContents="a token"
        >
          <GuardedComponent/>
        </components.ReauthenticateGuard>
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

test('<ResetPasswordForm> invalid token', async () => {
  jest.useFakeTimers()

  const resetPassword = jest.fn().mockReturnValue({
    redirectUri: '/fakeuri'
  })
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
    Query: () => ({
      getAuthenticatedUser: () => null
    }),
    Mutation: () => ({
      resetPassword
    })
  })

  const token = jwt.sign({
    credentialId,
    id: userId,
    appId: appId,
    action: 'RESET_PW',
    iat: 1000
  }, 'abc', { algorithm: 'none' })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.ResetPasswordForm token={token} />
      </div>
    </TestWrapper>
  )
  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<ResetPasswordForm>', async () => {
  jest.useFakeTimers()

  const resetPassword = jest.fn().mockReturnValue({
    redirectUri: '/fakeuri'
  })
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    Query: () => ({
      getAuthenticatedUser: () => {
        if (resetPassword.mock.calls.length === 0) {
          return null
        }
        return userWithPassword()
      }
    }),
    Mutation: () => ({
      resetPassword
    })
  })

  const token = jwt.sign({
    email,
    credentialId,
    id: userId,
    appId: appId,
    action: 'RESET_PW',
    iat: 1000,
  }, 'abc', { algorithm: 'none' })

  const onLogin = jest.fn()
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.ResetPasswordForm onLogin={onLogin} idPrefix="test" token={token}
          exposeLoginAfterReset />
      </div>
    </TestWrapper>
  )

  await act(async () => { jest.runAllTimers() })
  wrapper.update()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  const newPassword = 'abc123'
  setInput(wrapper, 'newPassword', 'input#test-reset-password-new-password', newPassword)
  setCheckbox(wrapper, 'loginAfterReset', 'input#test-reset-password-login-after-reset', true)
  wrapper.find('form#reset-password-form').simulate('submit')

  await waitUntil(wrapper, hasBeenCalled(resetPassword))

  expect(resetPassword.mock.calls[0][1]).toMatchObject(
    { token, newPassword }
  )

  await waitUntil(wrapper, hasBeenCalled(onLogin))
  expect(onLogin).toHaveBeenCalled()

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<AddTotpForm>', async () => {
  jest.useFakeTimers()

  const token = jwt.sign({
    appId,
    secretBase32: 'H8AUH2N4XYKMNUUO',
    iat: 1000,
  }, 'abc', { algorithm: 'none' })
  const getTotpKey = jest.fn().mockReturnValue({ token, otpauthUrl: "/url" })

  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
    Query: () => ({
      getTotpKey
    })
  })

  const onSuccess = jest.fn().mockName('onSuccess')
  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.AddTotpForm onSuccess={onSuccess} idPrefix="test" />
      </div>
    </TestWrapper>
  )

  await waitUntil(wrapper, (wrapper) => {
    const img = wrapper.find('#client-test-div img')
    return Boolean(img.props().src)
  })

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  setInput(wrapper, 'code', 'input#test-totp-code', '012345')

  await waitUntil(wrapper, hasBeenCalled(onSuccess))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<GenRecoveryCodesForm>', async () => {
  jest.useFakeTimers()

  const signReauthenticationToken = mockSignReauthenticationToken()
  const recoveryCodesRemaining = jest.fn().mockReturnValue(10)
  const createRecoveryCodes = jest.fn().mockReturnValue({
    codes: [
      'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A',
      'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A', 'ACDF01AB234A'
    ]
  })
  const mocks = extendMocks({
    AppConfig: () => (configNoOauth),
    User: userWithPassword,
    Query: () => ({
      getAuthenticatedUser: () => ({
        recoveryCodesRemaining
      })
    }),
    Mutation: () => ({
      signReauthenticationToken,
      createRecoveryCodes
    })
  })

  const wrapper = mount(
    <TestWrapper mocks={mocks}>
      <div id="client-test-div">
        <components.GenRecoveryCodesForm />
      </div>
    </TestWrapper>
  )

  await waitUntil(wrapper, exists('#reauth-guard-form'))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  setInput(wrapper, 'password', 'input#reauth-guard-password', 'hunter2')

  wrapper.find('form#reauth-guard-form').simulate('submit')

  await waitUntil(wrapper, exists('#gen-new-codes-confirm-btn'))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  wrapper.find('#gen-new-codes-confirm-btn').simulate('click')

  await waitUntil(wrapper, exists('#pre-codes'))

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})
