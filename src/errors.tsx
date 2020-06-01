import React, {
  ReactNode,
  ReactElement,
  useContext,
  createContext,
  useMemo
} from 'react'
import { ApolloError } from 'apollo-client'
import { GraphQLError } from 'graphql'

import { useComponents } from './components/component-lib'
import { FormComponents } from './components/component-types'

export type ConciseError = {
  code: string
  message: string
  appErrorCode?: string
}

function getAppErrorCode(e: GraphQLError): string | undefined {
  if (e.extensions?.code === 'BAD_USER_INPUT') {
    return e.extensions?.exception?.code
  } else {
    return undefined
  }
}

function getConciseErrors(error: ApolloError | undefined): ConciseError[] {
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
      message: e.message,
      appErrorCode: getAppErrorCode(e)
    }))
  }

  return []
}

const ErrorCodeContext = createContext<string[] | undefined>(undefined)

type ErrorMessageCaseProps = {
  code: string,
  children: ReactNode,
  components?: FormComponents
}

const ErrorMessageCase: React.FC<ErrorMessageCaseProps> = ({
  code,
  children,
  components
}) => {
  const {
    ErrorCaseComponent
  } = useComponents(components)

  const selectedCodes = useContext(ErrorCodeContext)
  if (selectedCodes?.includes(code)) {
    return <ErrorCaseComponent code={code}>{children}</ErrorCaseComponent>
  } else {
    return null
  }
}

type ErrorProps = {
  error: ApolloError | undefined
  children?: ReactElement[] | ReactElement,
  components?: FormComponents
}

const ErrorMessage: React.FC<ErrorProps> = ({error, children, components}) => {

  const {
    ErrorMessageComponent
  } = useComponents(components)

  const errors = useMemo(() => getConciseErrors(error), [error])

  const appErrorCodes = useMemo(
    () => (errors
      .map((e) => e.appErrorCode)
      .filter((e): e is string => typeof e === 'string')),
    [errors]
  )

  const filteredChildren = useMemo(() => {
    const arrChildren = (children == null)
      ? undefined
      : Array.isArray(children)
        ? children
        : [children]

    if (arrChildren == null) { return null }

    return React.Children.map(arrChildren, (c, i) => {
      const { props: { code } } = c
      if (code && appErrorCodes.includes(code)) {
        return c
      } else {
        return null
      }
    })
  }, [children, appErrorCodes])

  if (errors.length === 0) {
    return null
  }

  if (children != null && filteredChildren != null) {
    if (filteredChildren.length > 0) {
      return <ErrorCodeContext.Provider value={appErrorCodes}>
        {children}
      </ErrorCodeContext.Provider>
    }
    // fall through to default case
  }

  return <ErrorMessageComponent errors={errors} />
}

export { ErrorMessage, ErrorMessageCase }
