
import { createContext, useContext } from 'react'
import { DocumentNode } from 'graphql'
import { useMutation } from '@apollo/react-hooks'

export const UMCsrfContext = createContext<string | undefined>(undefined)

export const useCsrfMutation = (doc: DocumentNode, options: Record<string, any>) => {
  const csrfToken = useContext(UMCsrfContext)
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
