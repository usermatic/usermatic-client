
import React, {
  ReactNode,
  MouseEvent
} from 'react'

import classNames from 'classnames'
import { Formik, Form, Field, FormikValues, FormikErrors } from 'formik'

import { ErrorMessage } from '../errors'

import {
  useReauthenticate,
  useCachedReauthToken,
  ReauthContext
} from '../reauth'

type ReauthenticateGuardProps = {
  children: ReactNode
  tokenContents: string | object
  maxTokenAge?: string
  onClose?: () => void
}

// Hides some other component behind a reauthentication prompt. After the
// user reauthenticates successfully, the children are displayed, and the
// reauthentication token is provided in a context, and can be retrieved by
// calling useReauthToken().
export const ReauthenticateGuard: React.FC<ReauthenticateGuardProps> =
({children, tokenContents, maxTokenAge = "2m", onClose}) => {

  const [submit, { data, called, loading, error }] = useReauthenticate(tokenContents)
  const cachedToken = useCachedReauthToken(tokenContents, maxTokenAge)

  const token = cachedToken != null
    ? cachedToken
    : (called && !error && !loading && data) ? data.signReauthenticationToken : null

  if (token) {
    return <ReauthContext.Provider value={token}>
      {children}
    </ReauthContext.Provider>
  }

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
    submit(variables)
  }

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    if (onClose) { onClose() }
  }

  const buttonClasses = classNames("btn btn-primary", loading && "disabled")
  const cancelButtonClasses = "btn btn-secondary"

  return <div>
    <ErrorMessage error={error} />
    <div className="mb-3">Please enter your password:</div>
    <Formik onSubmit={onSubmit} initialValues={initialValues} validate={validate} >
      {(props) => (
        <Form id="reauth-guard-form">
          <div className="form-label-group">
            <Field id="reauth-guard-password" name="password" type="password"
                   className="form-control" placeholder="password" autoFocus />
          </div>
          <div className="d-flex justify-content-between">
            <button className={buttonClasses} type="submit">
              { loading ? 'Please wait...' : 'Submit' }
            </button>
            <button className={cancelButtonClasses} onClick={onClick}>
              Cancel
            </button>
          </div>
        </Form>
      )}
    </Formik>
  </div>
}
