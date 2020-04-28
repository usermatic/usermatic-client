
import { createContext, useContext } from 'react'
import { DocumentNode } from 'graphql'
import { useMutation, useQuery } from '@apollo/react-hooks'
import { OperationVariables } from '@apollo/react-common'

import { UMApolloContext } from './auth'
type CsrfData = {
  csrfToken?: string
  refetch: () => void
}
export const CsrfContext = createContext<CsrfData>({ refetch: () => {} })

export const useCrsfToken = () => {
  return useContext(CsrfContext)
}

export const useCsrfMutation = (doc: DocumentNode, options: OperationVariables) => {
  const client = useContext(UMApolloContext)
  const { csrfToken } = useCrsfToken()
  if (options.context) {
    throw new Error("TODO: merge context object")
  }
  const ret = useMutation(doc, {
    client,
    ...options,
    context: {
      headers: { 'x-csrf-token': csrfToken }
    }
  })

  if (ret[1].called && !csrfToken) {
    console.warn("csrf mutation was called before csrfToken was ready")
  }

  return ret;
}

export const useCsrfQuery = (doc: DocumentNode, options: OperationVariables) => {
  const client = useContext(UMApolloContext)
  const { csrfToken } = useCrsfToken()
  if (!csrfToken) {
    console.warn("calling csrf query before csrfToken is ready")
  }

  if (options.context) {
    throw new Error("TODO: merge context object")
  }

  const skip = !csrfToken || options.skip
  const ret = useQuery(doc, {
    client,
    ...options,
    // Once the crsfToken is ready, the query will be fired.
    skip,
    context: {
      headers: { 'x-csrf-token': csrfToken }
    }
  })

  return { ...ret, loading: !csrfToken || ret.loading }
}
