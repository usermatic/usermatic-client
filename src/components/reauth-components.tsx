
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

export type ReauthenticateGuardProps = {
  /**
   * The components that are guarded by the ReauthenticateGuard. They will be
   * displayed after reauthentication has occurred, and can obtain the
   * resulting reauthentication token by called `useReauthToken()`
   */
  children: ReactNode
  /**
   * The contents of the token you wish Usermatic to sign. Please remember
   * that the contents of the token can be set to anything by any user,
   * and therefore the security of your application should not rely on the
   * contents of the token. The only thing that the reauthentication token
   * proves is that the tokenContents *and* a valid password were presented
   * to the Usermatic backend at a certain time.
   *
   * The purpose of tokenContents is simply to require a user to perform
   * separate reauthentications for differing sensitive actions.
   * For instance, Usermatic itself requires separate reauthentications
   * when you export application data and when you delete an application.
   * It does this by requiring a token with a specific value of
   * tokenContents for each operation.
   *
   * The rule to bear in mind is that anyone who knows the password can
   * obtain a reauthenticationToken token with any conceivable tokenContents,
   * simply by asking the Usermatic backend.
   *
   * See "Reauthenticating before Sensitive actions" for more information.
   */
  tokenContents: string | object

  /**
   * maxTokenAge limits how long a token will be cached in your application.
   * The format is anything supported by https://github.com/vercel/ms, e.g.
   * "5m" or "60s" or "2h", etc.
   *
   * NB: This only controls caching. It has no effect on the expiration time of
   * the token signed by Usermatic. Reauthentication tokens never have an
   * expiration time set. Your application backend must enforce its own
   * expiration time by passing 'maxAge' when verifying the token.
   *
   * See "Reauthenticating before Sensitive actions" for more information.
   */
  maxTokenAge?: string

  /**
   * onClose() can be used to hook ReauthenticateGuard up to a modal.
   * It is calledl when the user clicks the "Close" button displayed by
   * <ReauthenticateGuard>
   */
  onClose?: () => void
  /**
   * A prompt to diplay above the password input.
   */
  prompt?: ReactNode
  /**
   * Display components for ReauthenticateGuard. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components
}

/**
 * <ReauthenticateGuard> is used to hide some sensitive action behind a
 * reauthentication prompt. It first prompts the user for a password, and
 * uses that password to obtain a reauthentication token from Usermatic.
 *
 * Once the token has been obtained, <ReauthenticateGuard> renders the child
 * components that you have passed to it, which presumably implement your
 * sensitive action.
 *
 * Those child components can obtain the reauthentication token by calling
 * `useReauthToken()`. They should then send the token to your own application
 * backend, which can use it to verify that the user successfully re-authenticated
 * before performing the sensitive action.
 *
 * <ReauthenticateGuard> automatically caches tokens that it obtains. The
 * `maxTokenAge` property determines how long they are cached.
 *
 * See "Reauthenticating before Sensitive actions" for more information.
 *
 * @preview-noinline
 *
 * const GuardedComponent = () => {
 *   const reauthToken = useReauthToken()
 *   return <div>
 *     The reauthentication token is <pre>{reauthToken}</pre>
 *     <br/>
 *     Send this token to your server to prove that the user entered their
 *     password.
 *   </div>
 * }
 *
 * const Prompt = () => <div>
 *   Please enter your password to demonstrate how reauthentication
 *   tokens work.
 * </div>
 *
 * render(
 *   <ReauthenticateGuard
 *     prompt={<Prompt/>}
 *     tokenContents={{ operations: ['my-operation'] }}
 *   >
 *     <GuardedComponent/>
 *   </ReauthenticateGuard>
 * )
 */
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
