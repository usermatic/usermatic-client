
import { ApolloError } from 'apollo-client'
import { MutationHookOptions } from '@apollo/react-hooks';

import { useProfile } from './user'
import { useCsrfMutation } from './hooks'

import {
  useCreateRecoveryCodesMutation,
  CreateRecoveryCodesMutation,
  CreateRecoveryCodesMutationVariables,
} from '../gen/operations'

type CreateRecoveryCodesOptions = MutationHookOptions<
  CreateRecoveryCodesMutation,
  CreateRecoveryCodesMutationVariables
>

/**
 * useCreateRecoveryCodes is an Apollo mutation operation for generating new
 * recovery codes for the logged in user.
 *
 * Creating new codes invalidates all existing codes.
 *
 * NB: You should almost certainly use <GenRecoveryCodesForm> instead of using this
 * hook directly.
 */
export const useCreateRecoveryCodes = (options: CreateRecoveryCodesOptions = {}) => {
  const [submit, ret] = useCsrfMutation(useCreateRecoveryCodesMutation, options)

  const submitWrapper = (variables: CreateRecoveryCodesMutationVariables) => {
    submit({ variables })
  }
  const { loading, error, data } = ret
  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}

/**
 * Return the number of valid recovery codes remaining for the currently
 * logged-in user.
 *
 * @preview-noinline
 *
 * function RecoveryCodeCountPreview () {
 *   const { loading, count } = useGetRecoveryCodeCount()
 *   if (loading) {
 *     return <div>Please wait...</div>
 *   } else {
 *     return <div>You have {count} recovery codes remaining.</div>
 *   }
 * }
 *
 * render(<RecoveryCodeCountPreview/>)
 */
export const useGetRecoveryCodeCount = (): {
  loading: boolean,
  error?: ApolloError,
  count?: number
} => {
  const { loading, error, profile } = useProfile()
  return { loading, error, count: profile?.recoveryCodesRemaining }
}
