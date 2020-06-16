
import React, {
  ReactNode,
  MouseEvent
} from 'react'

import { Formik, FormikValues, FormikErrors } from 'formik'

import { ErrorMessage } from '../errors'
import { useComponents } from './component-lib'
import { Components } from './component-types'

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
  prompt?: ReactNode
  components?: Components
}

// Hides some other component behind a reauthentication prompt. After the
// user reauthenticates successfully, the children are displayed, and the
// reauthentication token is provided in a context, and can be retrieved by
// calling useReauthToken().
export const ReauthenticateGuard: React.FC<ReauthenticateGuardProps> =
({
  children,
  tokenContents,
  maxTokenAge = "2m",
  onClose,
  components,
  prompt
}) => {

  const {
    Button,
    PasswordInput,
    ReauthFormComponent
  } = useComponents(components)

  const [submit, { data, called, loading, error }] = useReauthenticate(tokenContents)
  const cachedToken = useCachedReauthToken(tokenContents, maxTokenAge)

  const token = cachedToken != null
    ? cachedToken
    : (called && !error && !loading && data && data.signReauthenticationToken)
      ? data.signReauthenticationToken.token : null

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

  if (!prompt) {
    prompt = <>Please enter your password:</>
  }

  return <Formik onSubmit={onSubmit} initialValues={initialValues} validate={validate} >
    {(props) => {
      const { handleReset, handleSubmit } = props
      const formProps = {
        onSubmit: handleSubmit,
        onReset: handleReset,
        id: "reauth-guard-form"
      }

      return <ReauthFormComponent
        formProps={formProps}
        error={<ErrorMessage error={error} />}
        prompt={prompt}

        passwordInput={
          <PasswordInput type="password"
            id="reauth-guard-password"
            placeholder="password" autoFocus
            labelText="password"
            {...props.getFieldProps('password')}
          />
        }

        submitButton={
          <Button role="submit" name="submit-reauth" type="submit"
            disabled={loading}
          >
            { loading ? 'Please wait...' : 'Submit' }
          </Button>
        }

        cancelButton={
          <Button role="cancel" name="cancel-reauth" onClick={onClick}
            disabled={loading}
          >
            Cancel
          </Button>
        }
      />
    }}
  </Formik>
}
