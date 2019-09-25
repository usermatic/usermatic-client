
import gql from 'graphql-tag'

export const SESSION_QUERY = gql`
query svcGetSessionJWT($siteId: String!) {
  svcGetSessionJWT(siteId: $siteId) { auth { userJwt } csrfToken }
}
`
export const LOGIN_MUT = gql`
  mutation login($email: String!, $password: String!) {
    svcLogin(email: $email, password: $password) {
      userJwt
    }
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
