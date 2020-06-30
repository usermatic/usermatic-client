
import gql from 'graphql-tag'

export const USER_FRAGMENT = gql`
  fragment UserParts on User {
    __typename
    id
    primaryEmail
    name { given family full }
    credentials { id type email emailIsVerified provider providerID photoURL }
    recoveryCodesRemaining
    userJwt
    reauthToken
  }
`

export const APP_CONFIG_FRAGMENT = gql`
  fragment AppConfigParts on AppConfig {
    __typename
    appName
    minPasswordStrength
    totpEnabled
    fbLoginEnabled
    fbLoginUrl
    googleLoginEnabled
    googleLoginUrl
    githubLoginEnabled
    githubLoginUrl
  }
`

export const SIGN_REAUTH_TOKEN_QUERY = gql`
  mutation signReauthenticationToken($contents: String!, $password: String) {
    signReauthenticationToken(contents: $contents, password: $password) {
      token
    }
  }
`

export const APP_CONFIG_QUERY = gql`
query getAppConfig($appId: ID!) {
  getAppConfig(appId: $appId) { ...AppConfigParts }
}
`

export const SESSION_MUT = gql`
mutation getSessionJWT($appId: ID!) {
  getSessionJWT(appId: $appId) {
    csrfToken
    refetch {
      getAppConfig(appId: $appId) { ...AppConfigParts }
      getAuthenticatedUser { ...UserParts }
    }
  }
}
${APP_CONFIG_FRAGMENT}
${USER_FRAGMENT}
`

// TODO: delete this after getting rid of the last few refetchQueries users
export const PROFILE_QUERY = gql`
  query getProfile {
    getAuthenticatedUser { ...UserParts }
  }
  ${USER_FRAGMENT}
`

export const AUTHENTICATED_USER_QUERY = gql`
  query getAuthenticatedUser {
    getAuthenticatedUser { ...UserParts }
  }
  ${USER_FRAGMENT}
`

export const TOTP_QUERY = gql`
  query getTotpKey {
    getTotpKey { token otpauthUrl }
  }
`

export const ADD_TOTP_MUT = gql`
  mutation addTotp($token: String!, $code: String!) {
    addTotp(token: $token, code: $code) {
      refetch {
        getAuthenticatedUser { ...UserParts }
      }
    }
  }
  ${USER_FRAGMENT}
`

export const CLEAR_TOTP_MUT = gql`
  mutation clearTotp($reauthToken: String!) {
    clearTotp(reauthToken: $reauthToken) {
      refetch {
        getAuthenticatedUser { ...UserParts }
      }
    }
  }
${ USER_FRAGMENT }
`

export const CREATE_RECOVERY_CODES_MUT = gql`
  mutation createRecoveryCodes($reauthToken: String!) {
    createRecoveryCodes(reauthToken: $reauthToken) {
      codes
      refetch {
        getAuthenticatedUser {
          id
          recoveryCodesRemaining
        }
      }
    }
  }
`

export const LOGIN_MUT = gql`
  mutation login(
    $credential: LoginCredentialInput!,
    $stayLoggedIn: Boolean!
  ) {
    login(credential: $credential, stayLoggedIn: $stayLoggedIn) {
      user { ...UserParts }
      refetch {
        getAuthenticatedUser { id userJwt }
      }
    }
  }
${ USER_FRAGMENT }
`

export const RESET_PW_MUT = gql`
  mutation resetPassword(
    $token: String!,
    $newPassword: String!,
    $loginAfterReset: Boolean,
    $stayLoggedIn: Boolean
  ) {
    resetPassword(
      token: $token,
      newPassword: $newPassword,
      loginAfterReset: $loginAfterReset,
      stayLoggedIn: $stayLoggedIn
    ) {
      redirectUri
      refetch {
        getAuthenticatedUser { ...UserParts }
      }
    }
  }
  ${USER_FRAGMENT}
`

export const REQUEST_PW_RESET_EMAIL = gql`
  mutation requestPwResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email) {
      success
    }
  }
`

export const CHANGE_PW_MUT = gql`
  mutation changePw($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      success
    }
  }
`

export const ADD_PW_MUT = gql`
  mutation addPassword($email: String!, $newPassword: String!) {
    addPassword(email: $email, password: $newPassword) {
      refetch {
        getAuthenticatedUser { ...UserParts }
      }
    }
  }
  ${USER_FRAGMENT}
`

export const REMOVE_OAUTH_CREDENTIAL_MUT = gql`
  mutation removeOauthCredential($credentialId: ID!, $reauthToken: String!) {
    removeOauthCredential(credentialId: $credentialId, reauthToken: $reauthToken) {
      refetch {
        getAuthenticatedUser { ...UserParts }
      }
    }
  }
`

export const LOGOUT_MUT = gql`
  mutation logout {
    logout {
      refetch {
        getAuthenticatedUser { id userJwt }
      }
    }
  }
`

export const CREATE_ACCOUNT_MUT = gql`
  mutation createAccount($email: String!, $password: String!,
                         $loginAfterCreation: Boolean = false, $stayLoggedIn: Boolean = false) {
    createAccount(
      email: $email,
      password: $password,
      loginAfterCreation: $loginAfterCreation,
      stayLoggedIn: $stayLoggedIn
    ) {
      user { ...UserParts }
      refetch {
        getAuthenticatedUser { id userJwt }
      }
    }
  }
${ USER_FRAGMENT }
`

export const VERIFY_EMAIL_MUT = gql`
  mutation verifyEmail($token: String!) {
    verifyEmail(token: $token) { redirectUri }
  }
`

export const SEND_VERIFICATION_EMAIL_MUT = gql`
  mutation sendVerificationEmail($email: String!) {
    sendVerificationEmail(email: $email) {
      success
    }
  }
`
