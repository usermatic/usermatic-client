
import React, { MouseEvent, useEffect } from 'react'

import { ErrorMessage } from '../errors'
import { useReauthToken } from '../reauth'
import { useCreateRecoveryCodes, useGetRecoveryCodeCount } from '../recoverycodes'
import { ReauthenticateGuard } from './reauth-components'

import { useComponents } from './component-lib'
import { Components } from './component-types'

const GenRecoveryCodesFormInner: React.FC<{
  codeCount: number,
  onSuccess: () => void,
  components?: Components
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

/**
 * <GenRecoveryCodesForm> allows the user to generate or re-generate
 * MFA recovery codes.
 *
 * <GenRecoveryCodesForm> is automatically guarded by <ReauthenticateGuard> which
 * will prompt the user for their password, as generating new recovery codes is
 * considered a sensitive action.
 *
 * @preview
 *
 * <GenRecoveryCodesForm/>
 *
 * @customization
 *
 * <GenRecoveryCodesForm> uses the following layout components for customization:
 *
 * - [LoadingMessageComponent](/apiref#LoadingMessageType)
 * - [Button](/apiref#ButtonType)
 * - [RecoveryCodeDisplayComponent](/apiref#RecoveryCodeDisplayType)
 * - [RecoveryCodeRegenerationPromptComponent](/apiref#RecoveryCodeRegenerationPromptType)
 */
export const GenRecoveryCodesForm: React.FC<{
  /**
   * Called after codes have been successfully generated.
   */
  onSuccess?: () => void,
  /**
   * Display components for <GenRecoveryCodesForm>. See 'Customizing Usermatic' for
   * more information.
   */
  components?: Components,
  /**
   * Called when the user attempts to close or cancel the recovery code generation
   * process. Use this if you are using this component in a modal or other
   * conditionally-rendered context.
   */
  onCancel?: () => void
}> = ({
  onSuccess = () => {},
  components,
  onCancel
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
    onCancel={onCancel}
  >
    <GenRecoveryCodesFormInner codeCount={count} onSuccess={onSuccess}
      components={components}
    />
  </ReauthenticateGuard>
}
