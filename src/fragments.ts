
import gql from 'graphql-tag'

export const USER_FRAGMENT = gql`
  fragment UserParts on User {
    __typename
    id
    primaryEmail
    name { given family full }
    credentials { id type email emailIsVerified provider providerID photoURL }
  }
`

export const APP_CONFIG_FRAGMENT = gql`
  fragment AppConfigParts on AppConfig {
    __typename
    minPasswordStrength
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
    signReauthenticationToken(contents: $contents, password: $password)
  }
`

export const SESSION_QUERY = gql`
query getSessionJWT($appId: ID!) {
  getSessionJWT(appId: $appId) {
    auth { userJwt }
    csrfToken
    config { ...AppConfigParts }
  }
}
${APP_CONFIG_FRAGMENT}
`

export const PROFILE_QUERY = gql`
  query getProfile {
    getAuthenticatedUser { ...UserParts }
  }
  ${USER_FRAGMENT}
`

export const LOGIN_MUT = gql`
  mutation loginPassword($email: String!, $password: String!, $stayLoggedIn: Boolean!) {
    loginPassword(email: $email, password: $password, stayLoggedIn: $stayLoggedIn) {
      userJwt
    }
  }
`

export const OAUTH_LOGIN_MUT = gql`
  mutation loginOauth($oauthToken: String!, $stayLoggedIn: Boolean) {
    loginOauth(oauthToken: $oauthToken, stayLoggedIn: $stayLoggedIn) {
      userJwt
    }
  }
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
    ) { redirectUri }
  }
`

export const REQUEST_PW_RESET_EMAIL = gql`
  mutation requestPwResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`

export const CHANGE_PW_MUT = gql`
  mutation changePw($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`

export const ADD_PW_MUT = gql`
  mutation addPassword($email: String!, $newPassword: String!) {
    addPassword(email: $email, password: $newPassword)
  }
`

export const LOGOUT_MUT = gql`mutation logout { logout }`

export const CREATE_ACCOUNT_MUT = gql`
  mutation createAccount($email: String!, $password: String!,
                         $loginAfterCreation: Boolean = false, $stayLoggedIn: Boolean = false) {
    createAccount(
      email: $email,
      password: $password,
      loginAfterCreation: $loginAfterCreation,
      stayLoggedIn: $stayLoggedIn
    ) { userJwt }
  }
`

export const VERIFY_EMAIL_MUT = gql`
  mutation verifyEmail($token: String!) {
    verifyEmail(token: $token) { redirectUri }
  }
`

export const SEND_VERIFICATION_EMAIL_MUT = gql`
  mutation sendVerificationEmail($email: String!) {
    sendVerificationEmail(email: $email)
  }
`
