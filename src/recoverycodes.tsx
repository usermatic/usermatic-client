
import { MutationHookOptions, QueryHookOptions } from '@apollo/react-hooks';

import { useCsrfMutation, useCsrfQuery } from './hooks'

import {
} from './fragments'

import {
  useCreateRecoveryCodesMutation,
  CreateRecoveryCodesMutation,
  CreateRecoveryCodesMutationVariables,

  useGetRecoveryCodesCountQuery,
  GetRecoveryCodesCountQuery,
  GetRecoveryCodesCountQueryVariables
} from '../gen/operations'

type CreateRecoveryCodesOptions = MutationHookOptions<
  CreateRecoveryCodesMutation,
  CreateRecoveryCodesMutationVariables
>

type GetRecoveryCodeCountQuery = QueryHookOptions<
  GetRecoveryCodesCountQuery,
  GetRecoveryCodesCountQueryVariables
>

export const useCreateRecoveryCodes = (options: CreateRecoveryCodesOptions = {}) => {
  const [submit, ret] = useCsrfMutation(useCreateRecoveryCodesMutation, {
    ...options,
  })

  const submitWrapper = (variables: CreateRecoveryCodesMutationVariables) => {
    submit({ variables })
  }
  const { loading, error, data } = ret
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}

export const useGetRecoveryCodeCount = (options: GetRecoveryCodeCountQuery = {}) => {
  const ret = useCsrfQuery(useGetRecoveryCodesCountQuery, options)

  const { data, loading, error } = ret
  let count
  if (!loading && !error && data) {
    count = data.getRecoveryCodesCount
  }

  return { loading, error, count }
}
