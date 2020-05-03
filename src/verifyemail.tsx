
import { useCsrfMutation } from './hooks'

import { VERIFY_EMAIL_MUT, SEND_VERIFICATION_EMAIL_MUT } from './fragments'

export const useSendVerificationEmail = (email: string) => {
  const [submit, ret] = useCsrfMutation(SEND_VERIFICATION_EMAIL_MUT,
    { variables: { email } }
  )
  const { loading, error, data } = ret
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useEmailVerifier = () => {
  const [submit, ret] = useCsrfMutation(VERIFY_EMAIL_MUT, {})
  const { loading, error, data } = ret

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

