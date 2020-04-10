
import { createContext, useContext } from 'react'
import { DocumentNode } from 'graphql'
import { useMutation, useQuery } from '@apollo/react-hooks'

type CsrfData = {
  csrfToken?: string
  refetch: () => void
}
export const CsrfContext = createContext<CsrfData>({ refetch: () => {} })

export const useCrsfToken = () => {
  return useContext(CsrfContext)
}

export const useCsrfMutation = (doc: DocumentNode, options: Record<string, any>) => {
  const { csrfToken } = useCrsfToken()
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
  const { csrfToken } = useCrsfToken()
  if (!csrfToken) {
    console.warn("calling csrf query before csrfToken is ready")
  }

  if (options.context) {
    throw new Error("TODO: merge context object")
  }

  const skip = !csrfToken || options.skip
  const ret = useQuery(doc, {
    ...options,
    // Once the crsfToken is ready, the query will be fired.
    skip,
    context: {
      headers: { 'x-csrf-token': csrfToken }
    }
  })

  return { ...ret, loading: !csrfToken || ret.loading }
}
