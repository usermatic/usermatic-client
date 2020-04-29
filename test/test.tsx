import 'jsdom-global/register'

import React, { ReactNode } from 'react'

import Adapter from 'enzyme-adapter-react-16'
import { configure, mount } from 'enzyme'
import toJSON from 'enzyme-to-json'

import { act } from 'react-dom/test-utils'
import { MockedProvider } from '@apollo/react-testing'
import jwt from 'jsonwebtoken'

import * as client from '../src/index'

import * as fragments from '../src/fragments'

configure({ adapter: new Adapter() })

const host = 'test.local'
const userId = '915cb3c0-a3ac-44be-a2a8-6edb25bfeacc'
const appId = '248e5473-d9a6-4487-9164-24c3052d2898'

const makeSessionMock = (config: object) => {
  return {
    request: {
      query: fragments.SESSION_QUERY,
      variables: {
        appId
      },
    },
    result: {
      data: {
        svcGetSessionJWT: {
          auth: {
            userJwt: jwt.sign({ id: userId }, 'abc')
          },
          csrfToken: jwt.sign({ appId, host }, 'abc'),
          config
        }
      },
    },
  }
}

const TestWrapper: React.FC<{children: ReactNode, mocks: any}> = ({children, mocks}) => {
  return <MockedProvider
    mocks={mocks}
    addTypename={true}
    defaultOptions={{
      watchQuery: { fetchPolicy: 'no-cache' },
      query: { fetchPolicy: 'no-cache' },
    }}>
    <client.AuthProvider appId={appId}>
      {children}
    </client.AuthProvider>
  </MockedProvider>
}

test('<LoginForm>/<AccountCreationForm>', async () => {
  jest.useFakeTimers()

  const mocksNoOauth = [makeSessionMock({ minPasswordStrength: 3 })]

  const wrapper = mount(
    <TestWrapper mocks={mocksNoOauth}>
      <div id="client-test-div">
        <client.LoginForm/>
        <client.AccountCreationForm/>
      </div>
    </TestWrapper>
  )

  await act(async () => {
    jest.runAllImmediates()
  })

  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()

  wrapper.find('#forgot-pw-button').simulate('click')
  wrapper.update()

  await act(async () => {
    jest.runAllTimers()
  })
  expect(toJSON(wrapper.find('#client-test-div'))).toMatchSnapshot()
})

test('<LoginForm>/<AccountCreationForm> oauth', async () => {
  jest.useFakeTimers()

  const mocksWithAllOauth = [makeSessionMock({
    minPasswordStrength: 3,
    githubLoginEnabled: true,
    githubLoginUrl: '/doesntmatter',
    googleLoginEnabled: true,
    googleLoginUrl: '/doesntmatter',
    fbLoginEnabled: true,
    fbLoginUrl: '/doesntmatter'
  })]

  const wrapper = mount(
    <TestWrapper mocks={mocksWithAllOauth}>
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
