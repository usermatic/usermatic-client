// Components for testing usermatic apps without connecting to the usermatic api.

import React from 'react'

import jwt from 'jsonwebtoken'

import {
  AppConfig,
  useGetAuthenticatedUserQuery,
  CredentialType
} from '../../gen/operations'

import {
  ComponentProvider
} from '../components/component-lib'

import {
  AppIdContext,
  AppConfigContext,
  AuthUserData,
  AuthenticatedUserContext,
  defaultAppConfig,
  UsermaticProps,
  HttpWarning,
} from '../auth'

import { ReauthCacheProvider } from '../reauth'

type UsermaticTestProps = {
  appConfig?: AppConfig
  authUser?: ReturnType<typeof useGetAuthenticatedUserQuery>
} & UsermaticProps

const defaultUserResponse: AuthUserData = {
  data: {
    getAuthenticatedUser: {
      __typename: "User",
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      primaryEmail: "user@host.com",
      name: {
        first: "Bob",
        last: "Bobson",
        __typename: "Name"
      },
      credentials: [
        {
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          type: CredentialType.Oauth,
          email: "user@host.com",
          emailIsVerified: null,
          provider: "GOOGLE",
          providerID: "12345667788",
          photoURL: "https://lh3.googleusercontent.com/a-/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=s96-c",
          accessToken: "ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          refreshToken: "1//yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
          __typename: "UserCredential"
        }
      ],
      recoveryCodesRemaining: 0,
      userJwt: jwt.sign(
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          persistent: true
        }, 'fake signing key'
      ),
      reauthToken: null
    }
  },
  loading: false,
  called: true
}

export const UsermaticTestWrapper: React.FC<UsermaticTestProps> = ({
  children,
  uri,
  appId,
  apolloClient,
  components,
  useBootstrapClasses = true,
  useUmClasses = false,
  showDiagnostics = false,
  appConfig,
  authUser = defaultUserResponse
}) => (
  <AppIdContext.Provider value={appId}>
    <AppConfigContext.Provider value={{ ...defaultAppConfig, ...appConfig }}>
      <AuthenticatedUserContext.Provider value={authUser}>
        <ReauthCacheProvider>
          <HttpWarning />
          <ComponentProvider
            components={components}
            bootstrapClasses={useBootstrapClasses}
            usermaticClasses={useUmClasses}
          >
            {children}
          </ComponentProvider>
        </ReauthCacheProvider>
      </AuthenticatedUserContext.Provider>
    </AppConfigContext.Provider>
  </AppIdContext.Provider>
)
