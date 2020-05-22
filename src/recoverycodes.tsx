
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

export const useGetRecoveryCodeCount = (): {
  loading: boolean,
  error?: ApolloError,
  count?: number
} => {
  const { loading, error, profile } = useProfile()
  return { loading, error, count: profile?.recoveryCodesRemaining }
}
