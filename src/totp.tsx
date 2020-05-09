
import { useCsrfMutation, useCsrfQuery } from './hooks'

import {
  useGetTotpKeyQuery,
  useAddTotpMutation,
  AddTotpMutationVariables
} from '../gen/operations'

export const useGetTotpKey = () => {
  const { data, loading, error } = useCsrfQuery(useGetTotpKeyQuery, {})
  let otpauthUrl, token
  if (!loading && !error && data) {
    otpauthUrl = data.getTotpKey.otpauthUrl
    token = data.getTotpKey.token
  }
  return { loading, error, otpauthUrl, token }
}

export const useAddTotp = () => {
  const [submit, ret] = useCsrfMutation(useAddTotpMutation, {})

  const submitWrapper = (variables: AddTotpMutationVariables) => {
    submit({ variables })
  }

  const { loading, error, data } = ret
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}
