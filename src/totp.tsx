
import { QueryHookOptions, MutationHookOptions } from '@apollo/react-hooks';

import { useCsrfMutation, useCsrfQuery } from './hooks'

import {
  useGetTotpKeyQuery,
  useAddTotpMutation,
  GetTotpKeyQuery,
  GetTotpKeyQueryVariables,
  AddTotpMutation,
  AddTotpMutationVariables,
} from '../gen/operations'

type GetTotpKeyOptions = QueryHookOptions<GetTotpKeyQuery, GetTotpKeyQueryVariables>
type AddTotpMutationOptions = MutationHookOptions<AddTotpMutation, AddTotpMutationVariables>

export const useGetTotpKey = (options: GetTotpKeyOptions = {}) => {
  const { data, loading, error } = useCsrfQuery(useGetTotpKeyQuery, options)
  let otpauthUrl, token
  if (!loading && !error && data) {
    otpauthUrl = data.getTotpKey.otpauthUrl
    token = data.getTotpKey.token
  }
  return { loading, error, otpauthUrl, token }
}

export const useAddTotp = (options: AddTotpMutationOptions = {}) => {
  if (options.refetchQueries) {
    console.warn('overwriting default options.refetchQueries')
  }

  const [submit, ret] = useCsrfMutation(useAddTotpMutation, options)

  const submitWrapper = (variables: AddTotpMutationVariables) => {
    submit({ variables })
  }

  const { loading, error, data } = ret
  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}
