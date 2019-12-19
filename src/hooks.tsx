
import { createContext, useContext } from 'react'
import { DocumentNode } from 'graphql'
import { useMutation, useQuery } from '@apollo/react-hooks'

export const CsrfContext = createContext<string | undefined>(undefined)

export const useCsrfMutation = (doc: DocumentNode, options: Record<string, any>) => {
  const csrfToken = useContext(CsrfContext)
  if (options.context) {
    throw new Error("TODO: merge context object")
  }
  const ret = useMutation(doc, {
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

export const useCsrfQuery = (doc: DocumentNode, options: Record<string, any>) => {
  const csrfToken = useContext(CsrfContext)
  if (!csrfToken) {
    console.warn("calling csrf query before csrfToken is ready")
  }

  if (options.context) {
    throw new Error("TODO: merge context object")
  }

  const skip = !csrfToken
  const ret = useQuery(doc, {
    ...options,
    // Once the crsfToken is ready, the query will be fired.
    skip,
    context: {
      headers: { 'x-csrf-token': csrfToken }
    }
  })

  return { ...ret, loading: skip || ret.loading }
}
