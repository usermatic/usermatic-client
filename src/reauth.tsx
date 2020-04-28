
import React, { ReactNode, useContext } from 'react'
import { OperationVariables } from '@apollo/react-common'
import classNames from 'classnames'

import { Formik, Form, Field, FormikValues, FormikErrors } from 'formik'

import { ErrorMessage } from './errors'
import { useCsrfMutation } from './hooks'
import { SIGN_REAUTH_TOKEN_QUERY } from './fragments'

type useReauthenticateOptions = {
  password?: string
}

export const useReauthenticate = (contents: string | object, options: useReauthenticateOptions = {}) => {
  if (typeof contents !== 'string') {
    contents = JSON.stringify(contents)
  }
  const variables: OperationVariables = { contents }
  if (options.password != null) {
    variables.password = options.password
  }

  return useCsrfMutation(SIGN_REAUTH_TOKEN_QUERY, { variables })
}

const ReauthContext = React.createContext<string | undefined>(undefined)

export const useReauthToken = () => {
  return useContext(ReauthContext)
}

type ReauthenticateGuardProps = {
  children: ReactNode
  tokenContents: string | object
}

// Hides some other component behind a reauthentication prompt. After the
// user reauthenticates successfully, the children are displayed, and the
// reauthentication token is provided in a context, and can be retrieved by
// calling useReauthToken().
export const ReauthenticateGuard: React.FC<ReauthenticateGuardProps> =
({children, tokenContents}) => {

  const [submit, { data, called, loading, error }] = useReauthenticate(tokenContents)

  const initialValues = {
    password: ''
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {};

    if (!values.password) {
      errors.password = 'Required';
    }

    return errors;
  }

  const onSubmit = (variables: FormikValues) => {
    submit({ variables })
  }

  const buttonClasses = classNames("btn btn-primary", loading && "disabled")

  if (!called || error || loading) {
    return <div>
      <ErrorMessage error={error} />
      <div>Please enter your password:</div>
      <Formik onSubmit={onSubmit} initialValues={initialValues} validate={validate} >
        {(props) => (
          <Form>
            <div className="form-label-group">
              <Field id="reauth-password" name="password" type="password"
                     className="form-control" placeholder="password" autoFocus />
            </div>
            <div>
              <button className={buttonClasses} type="submit">
                { loading ? 'Please wait...' : 'Submit' }
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  } else {
    return <ReauthContext.Provider value={data.signReauthenticationToken}>
      {children}
    </ReauthContext.Provider>
  }
}
