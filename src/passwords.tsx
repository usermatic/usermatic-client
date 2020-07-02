
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

/**
 * Apollo Mutation hook for changing the user's password.
 *
 * NB: You should usually use <ChangePasswordForm> rather than calling this hook
 * directly.
 */
export const useChangePassword = (options: ChangePwMutationOptions = {}) => {
  return useApiMutation(useChangePwMutation, options)
}

/**
 * Apollo Mutation hook for changing the user's password.
 *
 * NB: You should usually use <ChangePasswordForm> rather than calling this hook
 * directly. <ChangePasswordForm> will automatically behave as an "Add Password"
 * form if the user account does not already have a password associated with it.
 */
export const useAddPassword = (options: AddPasswordMutationOptions = {}) => {
  return useApiMutation(useAddPasswordMutation, options)
}

/**
 * Apollo Mutation hook for requesting a password reset email.
 *
 * NB: You should usually use <RequestPasswordResetForm> rather than calling this hook
 * directly.
 */
export const useRequestPasswordResetEmail = (options: RequestPwResetEmailMutationOptions = {}) => {
  return useApiMutation(useRequestPwResetEmailMutation, options)
}

/**
 * Apollo Mutation hook for resetting a user's password via a reset token delivered
 * via email.
 *
 * NB: You should usually use <ResetPasswordForm> rather than calling this hook
 * directly.
 */
export const useResetPassword = (options: ResetPasswordMutationOptions = {}) => {
  return useApiMutation(useResetPasswordMutation, options)
}
