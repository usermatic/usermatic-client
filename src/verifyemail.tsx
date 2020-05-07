
import { useCsrfMutation } from './hooks'

import {
  useSendVerificationEmailMutation,
  useVerifyEmailMutation
} from '../gen/operations'

export const useSendVerificationEmail = (email: string) => {
  const [submit, ret] = useCsrfMutation(useSendVerificationEmailMutation,
    { variables: { email } }
  )
  const { loading, error, data } = ret
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

export const useEmailVerifier = () => {
  const [submit, ret] = useCsrfMutation(useVerifyEmailMutation, {})
  const { loading, error, data } = ret

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}

