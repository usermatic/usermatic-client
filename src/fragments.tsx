
import gql from 'graphql-tag'

export const USER_FRAGMENT = gql`
  fragment UserParts on SvcUser {
    id
    email
    emailIsVerified
  }
`

export const SESSION_QUERY = gql`
query svcGetSessionJWT($appId: ID!) {
  svcGetSessionJWT(appId: $appId) { auth { userJwt } csrfToken }
}
`

export const PROFILE_QUERY = gql`
  query getProfile {
    svcGetAuthenticatedUser { ...UserParts }
  }
  ${USER_FRAGMENT}
`

export const LOGIN_MUT = gql`
  mutation login($email: String!, $password: String!) {
    svcLogin(email: $email, password: $password) {
      userJwt
    }
  }
`

export const RESET_PW_MUT = gql`
  mutation resetPassword($token: String!, $newPassword: String!) {
    svcResetPassword(token: $token, newPassword: $newPassword) { redirectUri }
  }
`

export const REQUEST_PW_RESET_EMAIL = gql`
  mutation requestPwResetEmail($email: String!) {
    svcRequestPasswordResetEmail(email: $email)
  }
`

export const CHANGE_PW_MUT = gql`
  mutation changePw($oldPassword: String!, $newPassword: String!) {
    svcChangePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`

export const LOGOUT_MUT = gql`mutation logout { svcLogout }`

export const CREATE_ACCOUNT_MUT = gql`
  mutation createAccount($email: String!, $password: String!,
                         $loginAfterCreation: Boolean = false, $stayLoggedIn: Boolean = false) {
    svcCreateAccount(
      email: $email,
      password: $password,
      loginAfterCreation: $loginAfterCreation,
      stayLoggedIn: $stayLoggedIn
    ) { userJwt }
  }
`

export const VERIFY_EMAIL_MUT = gql`
  mutation verifyEmail($token: String!) {
    svcVerifyEmail(token: $token) { redirectUri }
  }
`

export const SEND_VERIFICATION_EMAIL_MUT = gql`
  mutation sendVerificationEmail {
    svcSendVerificationEmail
  }
`
