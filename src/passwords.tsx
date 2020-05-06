

import { DocumentNode } from 'graphql'

import { OperationVariables } from '@apollo/react-common'

import { useAppId } from './auth'
import { useCsrfMutation } from './hooks'

// @ts-ignore
import zxcvbnAsync from 'zxcvbn-async'

import {
  ADD_PW_MUT,
  CHANGE_PW_MUT,
  RESET_PW_MUT,
  REQUEST_PW_RESET_EMAIL,
  SESSION_QUERY
} from './fragments'

const useApiMutation = (mut: DocumentNode, options: OperationVariables) => {
  const [submit, ret] = useCsrfMutation(mut, options)
  const {loading, error, data} = ret
  const submitWrapper = (values: Record<string, string>) => {
    submit({ variables: values })
  }

  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submitWrapper, retObj] as [typeof submit, typeof retObj]
}

export const useChangePassword = (options: OperationVariables = {}) => {
  return useApiMutation(CHANGE_PW_MUT, options)
}

export const useAddPassword = (options: OperationVariables = {}) => {
  return useApiMutation(ADD_PW_MUT, options)
}

export const useRequestPasswordResetEmail = (options: OperationVariables = {}) => {
  return useApiMutation(REQUEST_PW_RESET_EMAIL, options)
}

export const useResetPassword = (token: string, optionsArg: OperationVariables = {}) => {
  const appId = useAppId()

  const options = {
    refetchQueries: [{ query: SESSION_QUERY, variables: { appId } }],
    ...optionsArg
  }

  const [submitResetPassword, ret] = useCsrfMutation(RESET_PW_MUT, options)
  const {loading, error, data} = ret
  const submit = (values: { newPassword: string }) => {
    submitResetPassword({ variables: { ...values, token } })
  }
  const success = !loading && !error && data
  const retObj = { ...ret, success }
  return [submit, retObj] as [typeof submit, typeof retObj]
}
