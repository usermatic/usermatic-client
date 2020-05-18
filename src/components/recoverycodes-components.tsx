
import React, { MouseEvent, useEffect } from 'react'
//import { Formik, Form, FormikValues, FormikErrors } from 'formik'

import { ErrorMessage } from '../errors'
import { useReauthToken } from '../reauth'
import { useCreateRecoveryCodes, useGetRecoveryCodeCount } from '../recoverycodes'
import { ReauthenticateGuard, ReauthPromptComponent } from './reauth-components'

const GenRecoveryCodesFormInner: React.FC<{
  codeCount: number,
  onSuccess: () => void
}> = ({codeCount, onSuccess}) => {
  const [submit, { success, called, loading, error, data }] = useCreateRecoveryCodes({
    onCompleted: () => { onSuccess() }
  })
  const reauthToken = useReauthToken()

  useEffect(() => {
    // submit immediately if there are no codes left anyway
    if (codeCount === 0) {
      submit({ reauthToken })
    }
  }, [])

  if (loading) {
    return <div>Please wait...</div>
  }

  if (success) {
    // display codes
    return <div>
      <ErrorMessage error={error} />
      <div className="p-5">
        Here are your recovery codes. Treat them like passwords and store them
        somewhere safe.
        <div className="d-flex justify-content-center">
          <pre id="pre-codes">
            { data?.createRecoveryCodes?.codes
                .map(c => c.match(/.{1,4}/g)?.join('-'))
                .join('\n')
            }
          </pre>
        </div>
        You will not be able to view these codes again later.
        If you lose them, you can generate new ones.
      </div>
    </div>
  }

  const confirm = (e: MouseEvent) => {
    e.preventDefault()
    submit({ reauthToken })
  }

  if (codeCount > 0 && !called) {
    return <div className="d-flex flex-column align-items-center">
      <div className="alert alert-warning">
        Warning: After you generate new codes, your old codes will no longer
        work. Make sure you store the new codes securely.
      </div>
      <button id="gen-new-codes-confirm-btn" className="btn btn-danger" onClick={confirm}>
        Invalidate my old codes and create new ones.
      </button>
    </div>
  }

  return <div>
  </div>
}

const Prompt: ReauthPromptComponent = () => (
  <div className="mb-3 h4">Please enter your password to generate new account recovery codes.</div>
)

export const GenRecoveryCodesForm: React.FC<{
  onSuccess?: () => void
}> = ({
  onSuccess = () => {}
}) => {

  const { loading, error, count } = useGetRecoveryCodeCount()

  if (loading) { return <div>Please wait...</div> }
  if (count == null) { return null }
  if (error) { return <ErrorMessage error={error}/> }

  return <ReauthenticateGuard tokenContents={{ operations: ['gen-recovery-codes'] }}
                       prompt={Prompt}>
    <GenRecoveryCodesFormInner codeCount={count} onSuccess={onSuccess} />
  </ReauthenticateGuard>
}
