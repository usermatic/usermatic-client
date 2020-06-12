
import React, { MouseEvent, useEffect } from 'react'

import { ErrorMessage } from '../errors'
import { useReauthToken } from '../reauth'
import { useCreateRecoveryCodes, useGetRecoveryCodeCount } from '../recoverycodes'
import { ReauthenticateGuard } from './reauth-components'

import { useComponents } from './component-lib'
import { FormComponents } from './component-types'

const GenRecoveryCodesFormInner: React.FC<{
  codeCount: number,
  onSuccess: () => void,
  components?: FormComponents
}> = ({codeCount, onSuccess, components}) => {

  const {
    Button,
    RecoveryCodeDisplayComponent,
    RecoveryCodeRegenerationPromptComponent,
    LoadingMessageComponent
  } = useComponents(components)

  const [submit, { called, loading, error, data }] = useCreateRecoveryCodes({
    onCompleted: () => { onSuccess() }
  })
  const reauthToken = useReauthToken()

  useEffect(() => {
    // submit immediately if there are no codes left anyway
    if (!called && codeCount === 0) {
      submit({ reauthToken })
    }
  }, [codeCount, called])

  if (loading) {
    return <LoadingMessageComponent/>
  }

  if (called) {
    const codes = data?.createRecoveryCodes?.codes
                  .map((c => c.match(/.{1,4}/g)?.join('-')))
                  .filter((c): c is string => typeof c === 'string')
    return <RecoveryCodeDisplayComponent
      codes={codes}
      error={error && <ErrorMessage error={error}/>}
    />
  }

  const confirm = (e: MouseEvent) => {
    e.preventDefault()
    submit({ reauthToken })
  }

  // if codeCount is 0 we don't ask for confirmation.
  if (codeCount > 0) {
    return <RecoveryCodeRegenerationPromptComponent
      confirmButton={
        <Button id="gen-new-codes-confirm-btn"
          role="danger" name="regenerate-recovery-codes"
          onClick={confirm}
        >
          Invalidate my old codes and create new ones.
        </Button>
      }
    />
  }

  return null
}

export const GenRecoveryCodesForm: React.FC<{
  onSuccess?: () => void,
  components?: FormComponents,
  onClose?: () => void
}> = ({
  onSuccess = () => {},
  components,
  onClose
}) => {

  const { LoadingMessageComponent } = useComponents(components)

  const { loading, error, count } = useGetRecoveryCodeCount()

  if (loading) { return <LoadingMessageComponent/> }
  if (count == null) { return null }
  if (error) { return <ErrorMessage error={error}/> }

  const prompt = <>
    Please enter your password to generate new account recovery codes.
  </>
  return <ReauthenticateGuard
    tokenContents={{ operations: ['gen-recovery-codes'] }}
    prompt={prompt}
    onClose={onClose}
  >
    <GenRecoveryCodesFormInner codeCount={count} onSuccess={onSuccess}
      components={components}
    />
  </ReauthenticateGuard>
}
