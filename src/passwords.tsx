
import {
  MutationTuple,
  MutationHookOptions,
} from '@apollo/react-hooks'

import { useCsrfMutation } from './hooks'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import {
  useChangePwMutation,
  useAddPasswordMutation,
  useRequestPwResetEmailMutation,
  useResetPasswordMutation,
  ChangePwMutationOptions,
  AddPasswordMutationOptions,
  RequestPwResetEmailMutationOptions,
  ResetPasswordMutationOptions
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

  const success = Boolean(!loading && !error && data)
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submitWrapper, typeof retObj]
}

export const useChangePassword = (options: ChangePwMutationOptions = {}) => {
  return useApiMutation(useChangePwMutation, options)
}

export const useAddPassword = (options: AddPasswordMutationOptions = {}) => {
  return useApiMutation(useAddPasswordMutation, options)
}

export const useRequestPasswordResetEmail = (options: RequestPwResetEmailMutationOptions = {}) => {
  return useApiMutation(useRequestPwResetEmailMutation, options)
}

export const useResetPassword = (options: ResetPasswordMutationOptions = {}) => {
  return useApiMutation(useResetPasswordMutation, options)
}
