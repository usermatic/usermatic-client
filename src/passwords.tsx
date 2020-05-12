
import {
  MutationTuple,
  MutationHookOptions,
} from '@apollo/react-hooks'

import { useAppId } from './auth'
import { useCsrfMutation } from './hooks'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import {
  PROFILE_QUERY,
  SESSION_QUERY
} from './fragments'

import {
  useChangePwMutation,
  useAddPasswordMutation,
  useRequestPwResetEmailMutation,
  useResetPasswordMutation,
  ChangePwMutationOptions,
  AddPasswordMutationOptions,
  RequestPwResetEmailMutationOptions,
  ResetPasswordMutationOptions,
  ResetPasswordMutationVariables
} from '../gen/operations'

const useApiMutation = <TData, TVar> (
  hookFn: (opts?: MutationHookOptions<TData, TVar>) => MutationTuple<TData, TVar>,
  options: MutationHookOptions<TData, TVar>
) => {
  const [submit, ret] = useCsrfMutation(hookFn, options)
  const {loading, error, data} = ret
  const submitWrapper = (variables: TVar) => {
    submit({ variables })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}

export const useChangePassword = (options: ChangePwMutationOptions = {}) => {
  if (options.refetchQueries) {
    console.warn('overwriting default options.refetchQueries')
  }

  return useApiMutation(useChangePwMutation, {
    refetchQueries: [{ query: PROFILE_QUERY }],
    ...options,
  })
}

export const useAddPassword = (options: AddPasswordMutationOptions = {}) => {
  if (options.refetchQueries) {
    console.warn('overwriting default options.refetchQueries')
  }
  return useApiMutation(useAddPasswordMutation, {
    refetchQueries: [{ query: PROFILE_QUERY }],
    ...options,
  })
}

export const useRequestPasswordResetEmail = (options: RequestPwResetEmailMutationOptions = {}) => {
  return useApiMutation(useRequestPwResetEmailMutation, options)
}

export const useResetPassword = (optionsArg: ResetPasswordMutationOptions = {}) => {
  const appId = useAppId()

  const options = {
    refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }],
    ...optionsArg
  }

  const [submitResetPassword, ret] = useCsrfMutation(useResetPasswordMutation, options)
  const {loading, error, data} = ret
  const submit = (variables: ResetPasswordMutationVariables) => {
    submitResetPassword({ variables })
  }
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}
