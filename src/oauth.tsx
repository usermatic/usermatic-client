
import { useCsrfMutation } from './hooks'

import {
  useRemoveOauthCredentialMutation,
  RemoveOauthCredentialMutationOptions,
  RemoveOauthCredentialMutationVariables,
} from '../gen/operations'


export const useRemoveOauthCredential = (options: RemoveOauthCredentialMutationOptions = {}) => {
  const [submit, ret] = useCsrfMutation(useRemoveOauthCredentialMutation, options)

  const submitWrapper = (variables: RemoveOauthCredentialMutationVariables) => {
    submit({ variables })
  }

  const { loading, error, data } = ret
  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}
