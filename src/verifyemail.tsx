
import { useCsrfMutation } from './hooks'

import {
  useSendVerificationEmailMutation,
  useVerifyEmailMutation
} from '../gen/operations'

/**
 * Apollo Mutation hook for requesting a verification email.
 *
 * NB: The functionality exposed by this hook is also available via
 * the <UserAccountSettings> component.
 */
export const useSendVerificationEmail = (email: string) => {
  const [submit, ret] = useCsrfMutation(useSendVerificationEmailMutation,
    { variables: { email } }
  )
  const { loading, error, data } = ret
  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

/**
 * Apollo Mutation hook for marking an email address as verified, using
 * an email verification token that was delivered to the user's email
 * address.
 *
 * NB: You should generally use the <EmailVerifier> component rather than
 * calling this hook directly.
 */
export const useEmailVerifier = () => {
  const [submit, ret] = useCsrfMutation(useVerifyEmailMutation, {})
  const { loading, error, data } = ret

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

