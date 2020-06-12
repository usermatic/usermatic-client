
import React, { MouseEvent, useContext, useEffect } from 'react'

import {
  usePersonalDetails,
  usePrimaryEmail,
  usePasswordCredential,
  useOauthCredentials,
  OauthCredential
} from '../user'

import { useRemoveOauthCredential } from '../oauth'
import { useReauthToken } from '../reauth'

import { ReauthenticateGuard } from './reauth-components'
import { ComponentContext, ComponentProvider, useComponents } from './component-lib'
import { FormComponents } from './component-types'
import { ErrorMessage } from '../errors'
import { useModal } from './modal'

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

const ChangePassword: React.FC<{}> = () => {

  const modalProps = useModal()
  const { Button, ModalComponent } = useComponents({})

  const onSuccess = () => {
    modalProps.close()
  }

  return <>
    <ModalComponent
      {...modalProps}
      title={<>Change Password</>}
      footer={
        <Button role="cancel" name="close-change-password" onClick={modalProps.close}>
          Close
        </Button>
      }
    >
      <ChangePasswordForm onSuccess={onSuccess}/>
    </ModalComponent>

    <Button role="submit" name="change-password" onClick={modalProps.open}>
      Change Password
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
  const { Button, ModalComponent } = useComponents({})

  const onSuccess = () => {
    modalProps.close()
  }

  const prompt = <>
    Please enter your password to delete this Oauth login
  </>

  return <>
    <ModalComponent
      {...modalProps}
      title={<>Remove Oauth Login</>}
    >
      <ReauthenticateGuard
        tokenContents={{ operations: ['gen-recovery-codes'] }}
        prompt={prompt}
        onClose={modalProps.close}
      >
        <RemoveOauthCredentialInner cred={cred} onSuccess={onSuccess}/>
      </ReauthenticateGuard>
    </ModalComponent>

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
    name={name}
    email={email ?? ''}
    emailVerificationStatus={
      passwordCredential && <VerificationStatus cred={passwordCredential}/>
    }
  />
}

const GenRecoveryCodes: React.FC<{}> = () => {

  const {
    Button,
    ModalComponent
  } = useComponents({})

  const modalProps = useModal()

  const { count } = useGetRecoveryCodeCount()

  const hasCodes = count != null && count > 0

  return <>
    <ModalComponent
      {...modalProps}
      title={<>Change Password</>}
    >
      <GenRecoveryCodesForm onClose={modalProps.close} />
    </ModalComponent>

    <Button role="submit" name="generate-recovery-codes" onClick={modalProps.open}>
      { hasCodes ? 'Generate New Recovery Codes' : 'Generate Recovery Codes' }
    </Button>
  </>
}

const ConfigureTotp: React.FC<{totpEnabled: boolean}> = ({totpEnabled}) => {

  const {
    Button,
    ModalComponent
  } = useComponents({})

  const modalProps = useModal()

  return <>
    <ModalComponent
      {...modalProps}
      title={<>Configure Authenticator App</>}
      footer={
        <Button role="cancel" name="close-change-password" onClick={modalProps.close}>
          Close
        </Button>
      }
    >
      <AddTotpForm />
    </ModalComponent>

    <Button role="submit" name="configure-totp" onClick={modalProps.open}>
      { totpEnabled ? 'Re-configure Authenticator App' : 'Configure Authenticator App' }
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

export const UserAccountSettings: React.FC<{
  components?: FormComponents
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
      personalDetails={<PersonalDetails/>}
      loginMethods={<LoginMethods/>}
      accountSecurity={<SecurityInfo/>}
    />
  </ComponentProvider>
}
