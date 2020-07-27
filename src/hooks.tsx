
import { createContext, useContext, useMemo } from 'react'
import {
  MutationTuple,
  MutationHookOptions,
  QueryHookOptions
} from '@apollo/react-hooks'

import { QueryResult } from '@apollo/react-common'

import { UMApolloContext } from './auth'
type CsrfData = {
  csrfToken?: string
}
export const CsrfContext = createContext<CsrfData>({})

export const useCsrfToken = () => {
  return useContext(CsrfContext)
}

export const useCsrfMutation = <TData, TVar> (
  operation: (opts?: MutationHookOptions<TData, TVar>) => MutationTuple<TData, TVar>,
  options: MutationHookOptions<TData, TVar> = {}
) => {
  const client = useContext(UMApolloContext)
  const { csrfToken } = useCsrfToken()
  if (options.context) {
    throw new Error("TODO: merge context object")
  }

  const args = useMemo(() => {
    const ret: MutationHookOptions<TData, TVar> = {
      client,
      onError: (e) => {},
      ...options,
      context: {
        headers: { 'x-csrf-token': csrfToken }
      }
    }
    return ret
  }, [client, options, csrfToken])

  const ret = operation(args)

  if (ret[1].called && !csrfToken) {
    console.warn("csrf mutation was called before csrfToken was ready")
  }

  return ret;
}

export const useCsrfQuery = <TData, TVar> (
  operation: (opts?: QueryHookOptions<TData, TVar>) => QueryResult<TData, TVar>,
  options: QueryHookOptions<TData, TVar> = {}
) => {
  const client = useContext(UMApolloContext)
  const { csrfToken } = useCsrfToken()
  if (!csrfToken && !options.skip) {
    console.warn("calling csrf query before csrfToken is ready")
  }

  if (options.context) {
    throw new Error("TODO: merge context object")
  }

  const skip = !csrfToken || options.skip

  const args = useMemo(() => {
    const ret: QueryHookOptions<TData, TVar> = {
      client,
      onError: (e) => {},
      ...options,
      // Once the crsfToken is ready, the query will be fired.
      skip,
      context: {
        headers: { 'x-csrf-token': csrfToken }
      }
    }
    return ret
  }, [client, options, skip, csrfToken])

  const ret = operation(args)
  const loading = !csrfToken || ret.loading
  return useMemo(() => ({ ...ret, loading }), [ret, loading ])
}
