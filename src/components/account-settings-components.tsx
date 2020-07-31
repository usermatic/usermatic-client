
import React, { MouseEvent, useContext, useMemo, useCallback, useEffect, useState } from 'react'
import { Formik, FormikValues } from 'formik'

import {
  usePersonalDetails,
  usePrimaryEmail,
  usePasswordCredential,
  useOauthCredentials,
  useUpdateProfile,
  OauthCredential
} from '../user'

import { useRemoveOauthCredential } from '../oauth'
import { useReauthToken } from '../reauth'
import { useRecommendations } from '../recommendations'

import { ReauthenticateGuard } from './reauth-components'
import { ComponentContext, ComponentProvider, useComponents } from './component-lib'
import { ButtonRole, Components } from './component-types'
import { ErrorMessage } from '../errors'
import { useModal, Modal } from './modal'

import {
  ChangePasswordForm
} from './password-components'

import {
  useSendVerificationEmail
} from '../verifyemail'

import {
  useTotpCredential,
  PasswordCredential,
} from '../user'

import {
  useGetRecoveryCodeCount
} from '../recoverycodes'

import {
  AddTotpForm
} from './totp-components'

import {
  GenRecoveryCodesForm
} from './recoverycodes-components'

const VerificationStatus: React.FC<{cred: PasswordCredential}> = ({cred}) => {

  const {
    Button,
    EmailStatusComponent
  } = useComponents({})

  const { email, emailIsVerified } = cred
  const [submit, { success, loading }] = useSendVerificationEmail(email)

  const resend = (e: MouseEvent) => {
    e.preventDefault()
    submit()
  }

  return <EmailStatusComponent
    email={email}
    emailIsVerified={emailIsVerified}
    resendSuccess={success}
    resendVerificationEmailButton={
      <Button
        disabled={loading}
        role="submit" name="resend-verification-email"
        onClick={resend}
      >
        { success ? 'Email sent!' : 'Resend Verification Email' }
      </Button>
    }
  />
}

const ChangePassword: React.FC<{
  buttonRole?: ButtonRole,
  finished?: () => void
}> = ({finished, buttonRole = 'submit'}) => {

  const modalProps = useModal()
  const { Button } = useComponents({})

  const { passwordCredential } = usePasswordCredential()

  const onSuccess = () => {
    modalProps.close()
    finished?.()
  }

  const prompt = passwordCredential == null
    ? 'Add Password'
    : 'Change Password'

  return <>
    <Modal {...modalProps} title={prompt}>
      <ChangePasswordForm onSuccess={onSuccess} onCancel={modalProps.close} />
    </Modal>

    <Button role={buttonRole} name="change-password" onClick={modalProps.open}>
      {prompt}
    </Button>
  </>
}

const RemoveOauthCredentialInner: React.FC<{
  cred: OauthCredential,
  onSuccess: () => void
}> = ({cred, onSuccess}) => {

  const reauthToken = useReauthToken()
  const { id: credentialId } = cred

  const [submit, { error }] = useRemoveOauthCredential({
    onCompleted: () => { onSuccess() }
  })

  useEffect(() => {
    if (reauthToken) {
      submit({ credentialId, reauthToken })
    }
  }, [reauthToken, credentialId])

  return <ErrorMessage error={error}/>
}

const RemoveOauthCredential: React.FC<{cred: OauthCredential}> = ({cred}) => {
  const modalProps = useModal()
  const { Button } = useComponents({})

  const onSuccess = () => {
    modalProps.close()
  }

  const prompt = <>
    Please enter your password to delete this Oauth login
  </>

  return <>
    <Modal {...modalProps} title={<>Remove Oauth Login</>}>
      <ReauthenticateGuard
        tokenContents={{ operations: ['gen-recovery-codes'] }}
        prompt={prompt}
        onCancel={modalProps.close}
      >
        <RemoveOauthCredentialInner cred={cred} onSuccess={onSuccess}/>
      </ReauthenticateGuard>
    </Modal>

    <Button role="danger" name="remove-oauth-credential" onClick={modalProps.open}>
      Remove
    </Button>
  </>
}

const LoginMethods: React.FC<{}> = () => {
  const {
    LoginMethodsComponent
  } = useComponents({})

  const { passwordCredential } = usePasswordCredential()
  const { oauthCredentials } = useOauthCredentials()
  return <LoginMethodsComponent
    passwordCredential={passwordCredential}
    changePassword={<ChangePassword/>}
    oauthCredentials={(oauthCredentials == null) ? [] :
      oauthCredentials.map(c => ({
        credential: c,
        removeButton: <RemoveOauthCredential cred={c}/>
      }))
    }
  />
}

const Name: React.FC<{
  name: {
    first?: string,
    last?: string,
  }
}> = ({name}) => {

  const {
    Button,
    EditNameFormComponent,
    NameDisplayComponent,
    InputComponent
  } = useComponents({})

  const modalProps = useModal()

  const [submit, { loading, error }] = useUpdateProfile({
    onCompleted: () => {
      modalProps.close()
    }
  })

  const initialValues = useMemo(() => ({
    first: name.first,
    last: name.last
  }), [name.first, name.last])

  const onSubmit = useCallback((values: FormikValues) => {
    const { first, last } = values
    const variables = { name: { last, first } }
    submit(variables)
  }, [submit])

  return <>
    <Modal {...modalProps} title={<>Edit Name</>}>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {(props) => {
          const { handleReset, handleSubmit } = props
          const formProps = {
            onSubmit: handleSubmit,
            onReset: handleReset,
          }
          return <EditNameFormComponent
            formProps={formProps}
            firstNameInput={
              <InputComponent
                type="text"
                id="first-name"
                labelText="First"
                {...props.getFieldProps('first')}
              />
            }

            lastNameInput={
              <InputComponent
                type="text"
                id="last-name"
                labelText="Last"
                {...props.getFieldProps('last')}
              />
            }

            submitButton={
              <Button role="submit" name="submit-edit-name" id="submit-edit-name-button" type="submit">
                Submit
              </Button>
            }

            cancelButton={
              <Button role="cancel" name="cancel-edit-name" id="cancel-edit-name-button" type="button"
                onClick={modalProps.close}>
                Cancel
              </Button>
            }

            error={<ErrorMessage error={error}/>}
            loading={loading}
          />
        }}
      </Formik>
    </Modal>

    <NameDisplayComponent name={name} editName={modalProps.open}/>
  </>
}

const PersonalDetails: React.FC<{}> = () => {
  const {
    PersonalDetailComponent,
    LoadingMessageComponent
  } = useComponents({})

  const { loading, error, name } = usePersonalDetails()
  const { email } = usePrimaryEmail()

  const { passwordCredential } = usePasswordCredential()

  return <PersonalDetailComponent
    loading={loading && <LoadingMessageComponent/>}
    error={<ErrorMessage error={error}/>}
    name={<Name name={name}/>}
    email={email ?? ''}
    emailVerificationStatus={
      passwordCredential && <VerificationStatus cred={passwordCredential}/>
    }
  />
}

const GenRecoveryCodes: React.FC<{
  buttonRole?: ButtonRole
  finished?: () => void
}> = ({finished, buttonRole = 'submit'}) => {

  const { Button } = useComponents({})

  const modalProps = useModal()
  const [success, setSuccess] = useState(false)

  const { count } = useGetRecoveryCodeCount()

  const hasCodes = count != null && count > 0

  const close = (e?: MouseEvent) => {
    setSuccess(false)
    modalProps.close()
    finished?.()
  }

  const onSuccess = () => { setSuccess(true) }

  return <>
    <Modal
      {...modalProps}
      onRequestClose={close}
      title={<>Generate Recovery Codes</>}
      footer={
        success &&
        <Button role="secondary" name="regenerate-recovery-codes-dismiss" onClick={close}>
          Dismiss
        </Button>
      }
    >
      <GenRecoveryCodesForm onSuccess={onSuccess} onCancel={modalProps.close} />
    </Modal>

    <Button role={buttonRole} name="generate-recovery-codes" onClick={modalProps.open}>
      { hasCodes ? 'Generate New Recovery Codes' : 'Get Recovery Codes' }
    </Button>
  </>
}

const ConfigureTotp: React.FC<{
  totpEnabled: boolean,
  buttonRole?: ButtonRole,
  finished?: () => void
}> = ({totpEnabled, buttonRole = 'submit', finished}) => {

  const { Button } = useComponents({})

  const modalProps = useModal()

  const close = () => {
    modalProps.close()
    finished?.()
  }

  return <>
    <Modal
      {...modalProps}
      onRequestClose={close}
      title={<>Configure Authenticator App</>}
      footer={
        <Button role="cancel" name="close-change-password" onClick={close}>
          Close
        </Button>
      }
    >
      <AddTotpForm />
    </Modal>

    <Button role={buttonRole} name="configure-totp" onClick={modalProps.open}>
      { totpEnabled ? 'Re-configure 2FA App' : 'Configure 2FA App' }
    </Button>
  </>
}

const SecurityInfo: React.FC<{}> = () => {

  const {
    SecurityInfoComponent
  } = useComponents({})

  const { totpCredential } = useTotpCredential()
  const totpEnabled = Boolean(totpCredential)

  const { loading, count } = useGetRecoveryCodeCount()

  if (loading || count == null) { return null }

  return <SecurityInfoComponent
    totpEnabled={totpEnabled}
    configureTotp={<ConfigureTotp totpEnabled={totpEnabled}/>}
    codeCount={count}
    generateNewRecoveryCodes={<GenRecoveryCodes/>}
  />
}

// Since the various recommendations modals are rendered by components that
// are only rendered if the given recommendation is active, they would
// disappear instantly after addressing the recommendation. useEnabled helps
// keep the modals alive until they are actually dismissed.
const useEnabled = (enabledProp: boolean) => {
  const [enabled, setEnabled] = useState<boolean>(false)

  // the prop can make us go from disabled to enabled, but we only go back
  // to disabled when the disable() function is called.
  useEffect(() => {
    if (enabledProp && !enabled) {
      setEnabled(true)
    }
  }, [enabledProp, enabled])

  const disable = () => {
    setEnabled(false)
  }

  return { enabled, disable }
}

//type EnableProps = ReturnType<typeof useEnabled>

export const Recommendations: React.FC<{}> = () => {

  const {
    RecommendationsComponent
  } = useComponents({})

  const recommendations = useRecommendations()

  const pwEnabled = useEnabled(!!recommendations.setPassword)
  const recEnabled = useEnabled(!!recommendations.recoveryCodes)
  const totpEnabled = useEnabled(!!recommendations.addTotp)

  if (pwEnabled.enabled || recEnabled.enabled || totpEnabled.enabled) {
    return <RecommendationsComponent
      addPassword={pwEnabled.enabled &&
        <ChangePassword finished={pwEnabled.disable} buttonRole="urgent"/>
      }
      addRecoveryCodes={recEnabled.enabled &&
        <GenRecoveryCodes finished={recEnabled.disable} buttonRole="urgent"/>
      }
      addTotp={totpEnabled.enabled &&
        <ConfigureTotp totpEnabled={false} finished={totpEnabled.disable} buttonRole="urgent"/>
      }
    />
  }

  return null
}

/**
 * <UserAccountSettings> is essentially an auto-generated profile page
 * for your users. Simply include it on some page (perhaps /profile),
 * and your users will automatically have access to basic functionality
 * such as password changes, MFA configuration, etc.
 *
 * To customize the appearance of <UserAccountSettings>, you can provide
 * overrides for the following components: UserAccountSettingsComponent,
 * SecurityInfoComponent, EmailStatusComponent, PersonalDetailComponent,
 * LoginMethodsComponent.
 *
 * See 'Customizing Usermatic' for more information.
 *
 * @preview
 *
 * <UserAccountSettings/>
 *
 * @customization
 *
 * <UserAccountSettings> uses the following layout components for customization:
 *
 * For the top-level container:
 * - [UserAccountSettingsComponent](/apiref#UserAccountSettingsType)
 *
 * For the different sections:
 * - [PersonalDetailComponent](/apiref#InputComponentType)
 * - [EditNameFormComponent](/apiref#InputComponentType)
 * - [NameDisplayComponent](/apiref#InputComponentType)
 * - [LoginMethodsComponent](/apiref#InputComponentType)
 * - [SecurityInfoComponent](/apiref#InputComponentType)
 * - [RecommendationsComponent](/apiref#InputComponentType)
 *
 * Miscellaneous:
 * - [Button](/apiref#InputComponentType)
 * - [InputComponent](/apiref#InputComponentType)
 * - [LoadingMessageComponent](/apiref#InputComponentType)
 *
 */
export const UserAccountSettings: React.FC<{
  /**
   * Custom display components for <UserAccountSettings>. See
   *
   * 'Customizing Usermatic' for more information.
   */
  components?: Components
}> = ({
  components: propComponents
}) => {

  const { useBootstrap, useUmClasses } = useContext(ComponentContext)
  const components = useComponents(propComponents)

  const { UserAccountSettingsComponent } = components

  // We create a new ComponentProvider context here so that we don't have
  // to prop-drill components into every single thing here.
  return <ComponentProvider
    components={components}
    bootstrapClasses={useBootstrap}
    usermaticClasses={useUmClasses}
  >
    <UserAccountSettingsComponent
      recommendations={<Recommendations/>}
      personalDetails={<PersonalDetails/>}
      loginMethods={<LoginMethods/>}
      accountSecurity={<SecurityInfo/>}
    />
  </ComponentProvider>
}
