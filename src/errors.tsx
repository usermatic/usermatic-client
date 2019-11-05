import React from 'react'
import { ApolloError } from 'apollo-client'

type ErrorProps = {
  error: ApolloError | undefined
}

type ConciseError = {
  code: string
  message: string
}

function getConciseErrors(error: ApolloError | undefined): Array<ConciseError> {
  if (error == null) { return [] }

  if (error.networkError) {
    return [{
      code: 'NetworkError',
      message: error.networkError.message
    }]
  }

  if (error.graphQLErrors.length > 0) {
    return error.graphQLErrors.map((e) => ({
      code: 'GraphQLError',
      message: e.message
    }))
  }

  return []
}

const ErrorMessage: React.FC<ErrorProps> = ({error}) => {
  const errors = getConciseErrors(error)

  if (errors.length === 0) {
    return null
  }

  return <div className="um-error-container">
    {errors.map((e, i) =>
      <div key={i} className="um-error">
        <span className="um-error-code">{e.code}</span>
        <span className="um-error-message">{e.message}</span>
      </div>
    )}
  </div>
}

export { ErrorMessage }
