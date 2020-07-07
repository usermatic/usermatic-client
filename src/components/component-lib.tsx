
import classNames from 'classnames'

import React, {
  ReactNode,
  MouseEvent,
  createContext,
  useState,
  useMemo,
  useContext
} from 'react'

import Modal from 'react-modal'

import {
  OauthCredential
} from '../user'

import {
  GoogleLogo,
  FbLogo,
  GithubLogo,
  Check
} from './logos'

import {
  AlertComponentType,
  LoadingMessageType,
  ErrorCaseType,
  ErrorMessageType,
  ButtonRole,
  ButtonName,
  ButtonProps,
  ButtonType,
  ModalType,
  InputComponentType,
  ResetPasswordFormType,
  AddPasswordFormType,
  ChangePasswordFormType,
  PasswordFormType,
  CreateAccountFormType,
  LoginSuccessType,
  AddTotpFormType,
  ForgotPasswordFormType,
  PasswordScoreType,
  PwScoreRecord,
  MFAFormType,
  PostRecoveryCodeType,
  SocialButtonComponentType,
  SocialButtonType,
  ReauthFormType,
  RecoveryCodeDisplayType,
  RecoveryCodeRegenerationPromptType,
  EmailVerificationType,
  UserAccountSettingsType,
  EmailStatusType,
  PersonalDetailType,
  LoginMethodsType,
  SecurityInfoType,
  Components,
  DefiniteComponents
} from './component-types'

type classNamesArg = Parameters<typeof classNames>[0]
const useClassnames = (bootstrapClasses: classNamesArg, umClasses: classNamesArg) => {
  const { useBootstrap, useUmClasses } = useContext(ComponentContext)

  const ret = classNames(
    useBootstrap ? bootstrapClasses : null,
    useUmClasses ? umClasses : null
  )

  if (ret.length === 0) {
    return undefined
  } else {
    return ret
  }
}

const DefaultAlertComponent: AlertComponentType = ({children, role}) => {
  const classes = ['alert']
  classes.push((() => {
    switch (role) {
      case 'success': return 'alert-success'
      case 'info': return 'alert-info'
      case 'warning': return 'alert-warning'
      case 'error': return 'alert-danger'
    }
  })())

  const className = useClassnames(classes, ['um-alert', `um-alert-${role}`])

  return <div className={className}>
    {children}
  </div>
}

const DefaultLoadingMessageComponent: LoadingMessageType = ({}) => (
  <div>Please wait...</div>
)

const DefaultErrorCaseComponent: ErrorCaseType = ({children}) => (
  <DefaultAlertComponent role='error'>
    {children}
  </DefaultAlertComponent>
)

const DefaultErrorMessageComponent: ErrorMessageType = ({errors}) => (
  <div>
    {errors.map((e, i) =>
      <DefaultErrorCaseComponent key={i}>
        {e.message}
      </DefaultErrorCaseComponent>
    )}
  </div>
)

const classesForRole = (role: ButtonRole): string => {
  switch (role) {
    case 'submit':
      return 'btn-primary'
    case 'secondary':
      return 'btn-outline-primary'
    case 'cancel':
      return 'btn-outline-secondary'
    case 'dismiss':
      return 'btn-outline-primary'
    case 'danger':
      return 'btn-danger'
  }
}

const classesForName = (name: ButtonName): string => {
  switch (name) {
    case 'login':
      return 'px-5 mr-3'

    case 'logout':
    case 'forgot-password':
    case 'request-password-reset':
    case 'cancel-password-reset':
    case 'enter-recovery-mode':
    case 'submit-reauth':
    case 'cancel-reauth':
    case 'regenerate-recovery-codes':
    case 'close-change-password':
    case 'resend-verification-email':
    case 'generate-recovery-codes':
    case 'remove-oauth-credential':
    case 'configure-totp':
    case 'set-password':
    case 'change-password':
    case 'cancel-change-password':
      return ''

    case 'exit-recovery-mode':
      return 'btn-block mt-4'

    case 'create-account':
    case 'submit-recovery-code':
    case 'dismiss-2fa-disabled':
    case 'leave-2fa-enabled':
    case 'reset-2fa':
    case 'reset-password':
      return 'btn-block'
  }
}

const buttonClasses = (role: ButtonRole, name: ButtonName) => {
  return [
    classesForRole(role),
    classesForName(name)
  ]
}

const DefaultButton: ButtonType = ({role, name, disabled, ...props}) => {
  const bootstrapClasses = classNames(
    'btn',
    disabled && 'disabled',
    buttonClasses(role, name)
  )
  const className = useClassnames(
    bootstrapClasses,
    ['um-btn', `um-btn-${role}`, `um-btn-${name}`]
  )
  return <button
    className={className}
    {...props}
  />
}

const DefaultInputComponent: InputComponentType = ({
  labelText,
  ...props
}) => {
  const divClass = useClassnames('form-group', 'um-form-group')
  const inputClass = useClassnames('form-control', 'um-form-control')
  return <div className={divClass}>
    { labelText &&
      <label htmlFor={props.id}>
        {labelText}
      </label>
    }
    <input className={inputClass} {...props} />
  </div>
}
DefaultInputComponent.displayName = 'DefaultInputComponent'

const DefaultCheckboxComponent: InputComponentType = ({
  labelText,
  ...props
}) => {
  const divClass = useClassnames('custom-control custom-checkbox', 'um-checkbox-container')
  const inputClass = useClassnames('custom-control-input', 'um-checkbox-input')
  const labelClass = useClassnames('custom-control-label', 'um-checkbox-label')
  return <div className={divClass}>
    <input className={inputClass} {...props} />
    { labelText &&
      <label className={labelClass} htmlFor={props.id}>
        {labelText}
      </label>
    }
  </div>
}
DefaultCheckboxComponent.displayName = 'DefaultCheckboxComponent'

const DefaultLoginSuccessComponent: LoginSuccessType = ({
  email,
  appName
}) => {
  const classes = useClassnames('lead', 'um-login-success')
  return <div className={classes}>
    You are succesfully logged in to {appName} as {email}
  </div>
}

const DefaultCodeInput: InputComponentType = (props) => {
  const className = useClassnames("form-control", 'um-code-input')
  return <div>
    <input className={className} {...props} />
  </div>
}
DefaultCodeInput.displayName = 'DefaultCodeInput'

const DefaultResetPasswordForm: ResetPasswordFormType = ({
  formProps,
  successMessage,
  newPasswordInput,
  passwordScore,
  loginAfterResetInput,
  stayLoggedInInput,
  submitButton,
  error
}) => {
  if (successMessage) {
    return <>{successMessage}</>
  } else {
    return <form {...formProps}>
      {error}
      {newPasswordInput}
      {passwordScore}
      {loginAfterResetInput}
      {stayLoggedInInput}
      {submitButton}
    </form>
  }
}

const DefaultChangePasswordForm: ChangePasswordFormType = ({
  formProps,
  oldPasswordInput,
  newPasswordInput,
  passwordScore,
  submitButton,
  cancelButton,
  error
}) => {
  const classes = useClassnames('d-flex justify-content-between', 'um-change-password-footer')
  return <form {...formProps}>
    {oldPasswordInput}
    {newPasswordInput}
    {passwordScore}
    <div className={classes}>
      {submitButton}
      {cancelButton}
    </div>
    {error}
  </form>
}

const DefaultAddPasswordForm: AddPasswordFormType = ({
  formProps,
  emailInput,
  newPasswordInput,
  passwordScore,
  submitButton,
  cancelButton,
  error
}) => (
  <form {...formProps}>
    {emailInput}
    {newPasswordInput}
    {passwordScore}
    {submitButton}
    {cancelButton}
    {error}
  </form>
)

const DefaultForgotPasswordForm: ForgotPasswordFormType = ({
  formProps,
  emailInput,
  submitButton,
  cancelButton,
  successMessage,
  error
}) => {
  const outerClasses = useClassnames('', 'um-forgot-password-container')
  const promptClasses = useClassnames('mb-3', 'um-forgot-password-prompt')
  const buttonContainer = useClassnames(
    'd-flex justify-content-between mb-3',
    'um-forgot-password-buttons'
  )
  const successClasses = useClassnames(
    'alert alert-success m-3', 'um-forgot-password-success'
  )

  return <div className={outerClasses}>
    <div className={promptClasses}>
      Enter your email to get a password reset link.
    </div>
    {error}
    <form {...formProps}>
      {emailInput}
      <div className={buttonContainer}>
        {submitButton}
        {cancelButton}
      </div>
    </form>
    {successMessage &&
      <div className={successClasses}>
        {successMessage}
      </div>
    }
  </div>
}

const DefaultPasswordForm: PasswordFormType = ({
  formProps,
  emailInput,
  passwordInput,
  stayLoggedInInput,
  signinButton,
  forgotPasswordButton,
  error
}) => {
  const classes = useClassnames(
    'my-3 justify-content-between d-flex', 'um-password-signin-button-container'
  )

  return <form {...formProps}>
    {emailInput}
    {passwordInput}
    {stayLoggedInInput}

    <div className={classes}>
      {signinButton}
      {forgotPasswordButton}
    </div>

    {error}
  </form>
}

const PasswordStrengthText: React.FC<{pwScore: PwScoreRecord}> = ({pwScore}) => {
  const { score } = pwScore
  const scoreDisplay = (() => {
    switch (score) {
      case 0: return 'Very weak'
      case 1: return 'Very weak'
      case 2: return 'Weak'
      case 3: return 'Moderate'
      case 4: return 'Strong'
      default:
        console.error(`unexpected password score ${score}`)
        return '???'
    }
  })()

  const bootstrapClasses = ['badge']
  if (score > 3) {
    bootstrapClasses.push('badge-success')
  } else if (score > 2) {
    bootstrapClasses.push('badge-warning')
  } else {
    bootstrapClasses.push('badge-danger')
  }
  const umClass = `um-password-score-${score}`

  const divClass = useClassnames('small p-1', 'um-password-strength-text')
  const spanClass = useClassnames(bootstrapClasses, umClass)

  return <div className={divClass}>
    Password Strength <span className={spanClass}>{scoreDisplay}</span>
  </div>
}

const PasswordStrengthDiagnostic: React.FC<{
  minPasswordStrength: number
  pwScore: PwScoreRecord
}> = ({pwScore, minPasswordStrength}) => {

  if (pwScore.score >= minPasswordStrength || pwScore.feedback == null) {
    return null
  }

  return <div className={useClassnames('alert alert-warning', 'um-password-diagnostic')}>
    <div>Please choose a stronger password.</div>
    <div>{pwScore.feedback.warning}</div>
    {pwScore.feedback.suggestions && pwScore.feedback.suggestions.length > 0 &&
    <>
      <div>Suggestions:</div>
      <ul>
        { pwScore.feedback.suggestions.map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </>}
  </div>
}

const DefaultPasswordScoreComponent: PasswordScoreType = ({
  passwordScore, minPasswordStrength
}) => {
  const classes = useClassnames('text-muted mb-2', 'um-password-strength')
  return <div className={classes}>
    <PasswordStrengthText pwScore={passwordScore} />
    <PasswordStrengthDiagnostic
      minPasswordStrength={minPasswordStrength}
      pwScore={passwordScore}
    />
  </div>
}

const DefaultMFAForm: MFAFormType = ({
  error,
  loading,
  recoveryMode,
  recoveryCodeInput,
  totpTokenInput,
  enterRecoveryModeButton,
  exitRecoveryModeButton
}) => {
  const outerClasses = useClassnames(
    'd-flex flex-column align-items-center',
    'um-mfa-container'
  )
  const promptClasses = useClassnames('text-muted p-3 text-center', 'um-mfa-prompt')
  return <div className={outerClasses}>
    {error}
    <div className={promptClasses}>
      { recoveryMode
        ? <>Please enter your recovery code:</>
        : <>Please enter the 6 digit code from your authenticator app:</>
      }
    </div>
    { recoveryMode ? recoveryCodeInput : totpTokenInput }
    {recoveryMode ? exitRecoveryModeButton : enterRecoveryModeButton}
    {loading}
  </div>
}

const DefaultPostRecoveryCodeForm: PostRecoveryCodeType = ({
  mfaDisabled,
  dismissButton,
  recoveryCodesRemaining,
  error,
  resetButton,
  dontResetButton
}) => {

  const promptClasses = useClassnames(
    'my-3 d-flex justify-content-center',
    'um-2fa-reset-prompt'
  )

  const alertClasses = useClassnames('alert alert-secondary', 'um-post-recovery-code-alert')

  if (mfaDisabled) {
    return <div>
      <DefaultAlertComponent role="info">
        You have disabled 2FA. Please consider re-enabling it as soon as possible.
      </DefaultAlertComponent>
      {dismissButton}
    </div>
  }

  return <div>
    <div className={alertClasses}>
      You have logged in via a recovery code.
      The code you just used will no longer work.
      { (recoveryCodesRemaining != null) &&
        <>You have {recoveryCodesRemaining} recovery codes remaining.</>
      }
    </div>
    <div className={promptClasses}>
      Do you need to reset your 2FA codes?
    </div>
    {error}
    {resetButton}
    {dontResetButton}
  </div>
}

const DefaultCreateAccountForm: CreateAccountFormType = ({
  formProps,
  emailInput,
  passwordInput,
  stayLoggedInInput,
  passwordScore,
  createAccountButton,
  error
}) => {
  const classes = useClassnames('my-3', 'create-account-form-footer')
  return <>
    <form {...formProps}>
      {emailInput}
      {passwordInput}
      {passwordScore}
      {stayLoggedInInput}
      <div className={classes}>
        {createAccountButton}
      </div>
    </form>
    {error}
  </>
}

const DefaultCreateAccountSuccessComponent: LoginSuccessType = ({
  email,
  appName
}) => {
  const classes = useClassnames('lead', 'um-create-account-success')
  return <div className={classes}>
    Welcome to {appName}, {email}
  </div>
}

const DefaultAddTotpFormComponent: AddTotpFormType = ({
  qrCode,
  textCode,
  error,
  loading,
  success,
  totpTokenForm
}) => {

  const [reveal, setReveal] = useState(false)
  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    setReveal(true)
  }

  const successClasses = useClassnames('alert alert-success mt-3', 'um-add-totp-success')
  const instructionClasses = useClassnames(
    'd-flex flex-column align-items-center', 'um-add-totp-instructions'
  )
  const manualClasses = useClassnames(
    'd-flex flex-column align-items-center text-muted',
    'um-add-totp-manual'
  )

  if (success) {
    return <div className={successClasses}>
      Your authenticator app has been successfully configured.
      You will need your authenticator app in order to log in to
      your account from now on.
    </div>
  } else {
    return <div className={instructionClasses}>
      <div>1. Scan this QRCode with your authenticator app</div>
      <div>{qrCode}</div>

      <div className={manualClasses}>
        { reveal
          ? <div>Enter this code into your authenticator app:</div>
          : <div onClick={onClick}>click for manual entry</div> }
        { reveal && <div><code>{textCode}</code></div> }
      </div>

      <div>2. Then, enter the 6 digit code from the authenticator app here:</div>

      {error}
      {totpTokenForm}
      {loading}
    </div>
  }
}

// poor man's name mangling... We just need to avoid
// conflicting with apps that use this library.
const socialButtonNonce = '3kdic7az9'

const buttonClass = (provider: string) => {
  return `${provider}-login-btn-${socialButtonNonce}`
}

const SocialLoginButton: React.FC<{
  onClick: ButtonProps['onClick'],
  provider: string,
  children: ReactNode
}> = ({onClick, provider, children}) => {

  const providerClass = buttonClass(provider)

  const divClasses = useClassnames(
    'd-flex justify-content-center my-2',
    'um-social-button'
  )
  const buttonClasses = useClassnames(
    ["btn btn-block btn-outline-primary d-flex align-items-center justify-content-between", providerClass],
    `um-social-button um-social-button-${provider}`
  )

  return <div className={divClasses}>
    <button className={buttonClasses} onClick={onClick}>
      {children}
    </button>
  </div>
}

const DefaultGithubButton: SocialButtonType = ({onClick}) => {
  const classes = useClassnames('flex-grow-1 font-weight-bold', 'um-social-button-label')
  return <SocialLoginButton onClick={onClick} provider='github'>
    <GithubLogo size="2em"/>
    <div className={classes}>Login with GitHub</div>
  </SocialLoginButton>
}

const DefaultFacebookButton: SocialButtonType = ({onClick}) => {
  const classes = useClassnames('flex-grow-1 font-weight-bold', 'um-social-button-label')
  return <SocialLoginButton onClick={onClick} provider='facebook'>
    <FbLogo size="2em"/>
    <div className={classes}>Login with Facebook</div>
  </SocialLoginButton>
}

const DefaultGoogleButton: SocialButtonType = ({onClick}) => {
  const classes = useClassnames('flex-grow-1 font-weight-bold', 'um-social-button-label')
  return <SocialLoginButton onClick={onClick} provider='google'>
    <GoogleLogo size="2em"/>
    <div className={classes}>Login with Google</div>
  </SocialLoginButton>
}

const DefaultSocialButtonsComponent: SocialButtonComponentType = ({
  githubButton,
  facebookButton,
  googleButton
}) => {
  const className = useClassnames('my-3', 'um-social-button-container')
  return <div className={className}>
    <style>{`
        .facebook-login-btn-${socialButtonNonce} {
          color: white !important;
          background-color: #4267b2 !important;
          border-color: #4267b2 !important;
        }
        .facebook-login-btn-${socialButtonNonce}:hover {
          color: #4267b2 !important;
          background-color: white !important;
        }

        .google-login-btn-${socialButtonNonce} {
          color: white !important;
          background-color: #ea4335 !important;
          border-color: #ea4335 !important;
        }
        .google-login-btn-${socialButtonNonce}:hover {
          color: #ea4335 !important;
          background-color: white !important;
        }

        .github-login-btn-${socialButtonNonce} {
          color: white !important;
          background-color: rgb(21, 20, 19) !important;
          border-color: rgb(21, 20, 19) !important;
        }
        .github-login-btn-${socialButtonNonce}:hover {
          color: rgb(21, 20, 19) !important;
          background-color: white !important;
        }
    `}</style>
    { githubButton }
    { facebookButton }
    { googleButton }
  </div>
}

const DefaultReauthFormComponent: ReauthFormType = ({
  formProps,
  error,
  prompt,
  passwordInput,
  submitButton,
  cancelButton
}) => {
  const outerClasses = useClassnames('', 'um-reauth-container')
  const promptClasses = useClassnames('mb-3', 'um-reauth-prompt')
  const buttonClasses = useClassnames(
    'd-flex justify-content-between', 'um-reauth-button-container'
  )
  return <div className={outerClasses}>
    <div className={promptClasses}>
      {prompt}
    </div>
    <form {...formProps}>
      {error}
      {passwordInput}
      <div className={buttonClasses}>
        {submitButton}
        {cancelButton}
      </div>
    </form>
  </div>
}

const DefaultRecoveryCodeDisplayComponent: RecoveryCodeDisplayType = ({
  codes, error
}) => {
  const divClasses = useClassnames('p-5', 'um-recovery-codes')
  const codeClasses = useClassnames('d-flex mt-3 justify-content-center', 'um-recovery-codes-display')
  return <>
    {error}
    { codes != null &&
      <div className={divClasses}>
        Here are your recovery codes. Treat them like passwords and store them
        somewhere safe.
        <div className={codeClasses}>
          <pre id="pre-codes">
            { codes.join('\n') }
          </pre>
        </div>
        You will not be able to view these codes again later.
        If you lose them, you can generate new ones.
      </div>
    }
  </>
}

const DefaultRecoveryCodeRegenerationPromptComponent: RecoveryCodeRegenerationPromptType = ({
  confirmButton
}) => {
  const outerClasses = useClassnames(
    'd-flex flex-column align-items-center',
    'um-recovery-code-regeneration-prompt'
  )
  const innerClasses = useClassnames('alert alert-warning', 'um-warning')
  return <div className={outerClasses}>
    <div className={innerClasses}>
      Warning: After you generate new codes, your old codes will no longer
      work. Make sure you store the new codes securely.
    </div>
    {confirmButton}
  </div>
}

const DefaultEmailVerificationComponent: EmailVerificationType = ({
  error,
  success,
  redirectUri
}) => {
  if (success) {
    return <div>Your email is now verified! You will be automatically
      redirected to <a href={redirectUri}>{redirectUri}</a>.
      (Please click the above link if you are not redirected shortly.)
    </div>
  } else {
    return <div>
      {error}
      <div>
        We could not verify your email address - The link you clicked
        may be expired.
      </div>
    </div>
  }
}

const DefaultUserAccountSettingsComponent: UserAccountSettingsType = ({
  personalDetails,
  loginMethods,
  accountSecurity
}) => {
  return <>
    {personalDetails}
    {loginMethods}
    {accountSecurity}
  </>
}

const DefaultEmailStatusComponent: EmailStatusType = ({
  email,
  emailIsVerified,
  resendSuccess,
  resendVerificationEmailButton
}) => {
  if (emailIsVerified) {
    return <ProfileLine>
      <>Email Verified?</>
      <><Check/></>
    </ProfileLine>
  } else {
    return <ProfileLine>
      <>Email is un-verified</>
      <div>{resendVerificationEmailButton}</div>
    </ProfileLine>
  }
}

const ProfileHeader: React.FC<{children: ReactNode}> = ({children}) => {
  const classes = useClassnames(
    'h3 pb-3 mb-3 border-bottom',
    'um-profile-header'
  )
  return <div className={classes}>{children}</div>
}

const ProfileLine: React.FC<{children: ReactNode, className?: string}> = ({children, className}) => {

  const containerClasses = useClassnames('row mb-3', 'um-profile-line')
  const leftClasses = useClassnames('col-sm-7', 'um-profile-line-left-col')
  const rightClasses = useClassnames('col-sm-5', 'um-profile-line-right-col')

  const childArr = React.Children.toArray(children)
  if (childArr.length != 2) {
    throw new Error("ProfileLine must have two children!")
  }

  return <div className={containerClasses}>
    <div className={leftClasses}>{childArr[0]}</div>
    <div className={rightClasses}>{childArr[1]}</div>
  </div>
}

const Card: React.FC<{id: string, children: ReactNode}> = ({id, children}) => {
  const cardClasses = useClassnames('card mt-5 d-flex', 'um-card')
  const cardBodyClasses = useClassnames('card-body p-4', 'um-card-body')
  return <div id={id} className={cardClasses}>
    <div className={cardBodyClasses}>
      {children}
    </div>
  </div>
}

const DefaultPersonalDetailComponent: PersonalDetailType = ({
  loading,
  error,
  name,
  email,
  emailVerificationStatus
}) => (
  <Card id="personal-detail">
    <ProfileHeader>Personal Details</ProfileHeader>
    {loading}
    {error}
    <dl>
      <ProfileLine>
        <>Name</>
        <>{name.full}</>
      </ProfileLine>
      <ProfileLine>
        <>Email</>
        <>{email}</>
      </ProfileLine>
      {emailVerificationStatus}
    </dl>
  </Card>
)

const OauthProviderLogo: React.FC<{cred: OauthCredential}> = ({cred}) => {
  switch (cred.provider) {
    case 'GITHUB':
      return <GithubLogo size="2em" />
    case 'FACEBOOK':
      return <FbLogo size="2em" />
    case 'GOOGLE':
      return <GoogleLogo size="2em" />
    default:
      return null
  }
}

const capitalize = (str: string) => {
  return str.toUpperCase().charAt(0) + str.toLowerCase().substr(1)
}

const OauthInfo: React.FC<{
  credential: OauthCredential
}> = ({
  credential
}) => (
  <div className="d-flex align-items-center">
    <div className="mr-3"><OauthProviderLogo cred={credential}/></div>
    {capitalize(credential.provider)} login enabled.
  </div>
)

const DefaultLoginMethodsComponent: LoginMethodsType = ({
  passwordCredential,
  oauthCredentials,
  changePassword
}) => (
  <Card id="login-methods">
    <ProfileHeader>Login Methods</ProfileHeader>
    <dl>
      <ProfileLine>
        <>Password</>
        <>
          {(passwordCredential == null) && 'Not Set'}
          {changePassword}
        </>
      </ProfileLine>
      {
        oauthCredentials.map(({ credential, removeButton }, i) => (
          <ProfileLine key={i}>
            <OauthInfo credential={credential} />
            {removeButton}
          </ProfileLine>
        ))
      }
    </dl>
  </Card>
)

const DefaultSecurityInfoComponent: SecurityInfoType = ({
  totpEnabled,
  configureTotp,
  generateNewRecoveryCodes,
  codeCount
}) => (
  <Card id="security-info">
    <ProfileHeader>Account Security</ProfileHeader>
    <dl>
      <ProfileLine>
        <div className="text-muted">
          <strong>Authenticator App</strong><br/>
          { totpEnabled
            ? 'Your authenticator app is enabled and required for login.'
            : 'Configure an authenticator app to secure your account.'
          }
        </div>
        <div>
          {configureTotp}
        </div>
      </ProfileLine>
      <ProfileLine>
        <div className="text-muted">
          <strong>Recovery codes</strong><br/>
          { codeCount > 0
            ? <>You have <strong>{codeCount}</strong> codes remaining. You can get new ones
              at any time. Generating new codes invalidates all your old codes</>
            : <>Prevent yourself from being locked out of your account by
              generating account recovery codes.</>
          }
        </div>
        <div>
          {generateNewRecoveryCodes}
        </div>
      </ProfileLine>
    </dl>
  </Card>
)

const DefaultModalComponent: ModalType = ({
  isOpen,
  onRequestClose,
  children,
  title,
  footer
}) => {
  const { useBootstrap, useUmClasses, modalAppElement } = useContext(ComponentContext)

  const getClass = (className: string) => {
    const classes = []
    if (useBootstrap) { classes.push(className) }
    if (useUmClasses) { classes.push(`um-${className}`) }
    return classNames(classes)
  }

  const close = (e: MouseEvent) => {
    e.preventDefault()
    onRequestClose()
  }

  return <Modal
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    shouldCloseOnOverlayClick
    className={getClass("modal-dialog")}
    appElement={modalAppElement}
    style={{
      overlay: {
        backgroundColor: 'rgba(128, 128, 128, 0.75)',
      },
      content: {
        outline: 'none',
      }
    }}
  >
    <div className={getClass("modal-content")}>
      <div className={getClass("modal-header")}>
        <h5 className={getClass("modal-title")}>
          {title}
        </h5>
        <button type="button" className={getClass("close")}
                aria-label="Close" onClick={close}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className={getClass("modal-body")}>
        {children}
      </div>
      {footer &&
        <div className={getClass("modal-footer")}>
          {footer}
        </div>
      }
    </div>
  </Modal>
}

export const ComponentContext = createContext<{
  useBootstrap: boolean,
  useUmClasses: boolean,
  components: Components,
  modalAppElement?: HTMLElement
}>({ useBootstrap: true, useUmClasses: false, components: {} })

/**
 * Get a map of all the currently-active display components.
 *
 * Generally, user code will not need to use this hook. It is used internally by
 * Usermatic components to obtain the correct display components for use in a given
 * context.
 */
export const useComponents = (propComponents: Components = {}): DefiniteComponents => {
  const { components: contextComponents } = useContext(ComponentContext)

  const mergedComponents = useMemo(() => {
    const merged = {
      ...contextComponents,
      ...propComponents
    }
    const AlertComponent = merged.AlertComponent ?? DefaultAlertComponent
    const InputComponent = merged.InputComponent ?? DefaultInputComponent
    const CheckboxComponent = merged.CheckboxComponent ?? DefaultCheckboxComponent
    const LoadingMessageComponent = merged.LoadingMessageComponent ??
      DefaultLoadingMessageComponent
    const ErrorMessageComponent = merged.ErrorMessageComponent ??
      DefaultErrorMessageComponent
    const ErrorCaseComponent = merged.ErrorCaseComponent ??
      DefaultErrorCaseComponent

    const TotpInputComponent = merged.TotpInputComponent ?? DefaultCodeInput
    const RecoveryCodeInputComponent = merged.RecoveryCodeInputComponent ?? DefaultCodeInput
    const EmailAddressInput = merged.EmailAddressInput ?? InputComponent
    const PasswordInput = merged.PasswordInput ?? InputComponent
    const StayLoggedInInput = merged.StayLoggedInInput ?? CheckboxComponent
    const LoginSuccessComponent = merged.LoginSuccessComponent ?? DefaultLoginSuccessComponent

    const ModalComponent = merged.ModalComponent ?? DefaultModalComponent
    const Button = merged.Button ?? DefaultButton
    const CreateAccountFormComponent = merged.CreateAccountFormComponent ?? DefaultCreateAccountForm
    const CreateAccountSuccessComponent = merged.CreateAccountSuccessComponent ?? DefaultCreateAccountSuccessComponent
    const PasswordFormComponent = merged.PasswordFormComponent ?? DefaultPasswordForm
    const MFAFormComponent = merged.MFAFormComponent ?? DefaultMFAForm
    const ForgotPasswordFormComponent = merged.ForgotPasswordFormComponent ??
      DefaultForgotPasswordForm
    const ChangePasswordFormComponent = merged.ChangePasswordFormComponent ??
      DefaultChangePasswordForm
    const ResetPasswordFormComponent = merged.ResetPasswordFormComponent ??
      DefaultResetPasswordForm
    const AddPasswordFormComponent = merged.AddPasswordFormComponent ??
      DefaultAddPasswordForm
    const PasswordScoreComponent = merged.PasswordScoreComponent ??
      DefaultPasswordScoreComponent

    const AddTotpFormComponent = merged.AddTotpFormComponent ??
      DefaultAddTotpFormComponent
    const PostRecoveryCodeFormComponent = merged.PostRecoveryCodeFormComponent ??
      DefaultPostRecoveryCodeForm
    const RecoveryCodeDisplayComponent = merged.RecoveryCodeDisplayComponent ??
      DefaultRecoveryCodeDisplayComponent
    const RecoveryCodeRegenerationPromptComponent =
      merged.RecoveryCodeRegenerationPromptComponent ??
      DefaultRecoveryCodeRegenerationPromptComponent

    const SocialButtonsComponent = merged.SocialButtonsComponent ??
      DefaultSocialButtonsComponent
    const GithubButton = merged.GithubButton ?? DefaultGithubButton
    const FacebookButton = merged.FacebookButton ?? DefaultFacebookButton
    const GoogleButton = merged.GoogleButton ?? DefaultGoogleButton

    const ReauthFormComponent = merged.ReauthFormComponent ??
      DefaultReauthFormComponent

    const EmailVerificationComponent = merged.EmailVerificationComponent ??
      DefaultEmailVerificationComponent

    const EmailStatusComponent = merged.EmailStatusComponent ??
      DefaultEmailStatusComponent

    const UserAccountSettingsComponent = merged.UserAccountSettingsComponent ??
      DefaultUserAccountSettingsComponent
    const SecurityInfoComponent = merged.SecurityInfoComponent ?? DefaultSecurityInfoComponent
    const PersonalDetailComponent = merged.PersonalDetailComponent ??
      DefaultPersonalDetailComponent
    const LoginMethodsComponent = merged.LoginMethodsComponent ??
      DefaultLoginMethodsComponent

    return {
      AlertComponent,
      InputComponent,
      CheckboxComponent,
      LoadingMessageComponent,
      ErrorMessageComponent,
      ErrorCaseComponent,
      Button,
      ModalComponent,
      CreateAccountFormComponent,
      CreateAccountSuccessComponent,
      PasswordFormComponent,
      MFAFormComponent,
      ForgotPasswordFormComponent,
      ChangePasswordFormComponent,
      ResetPasswordFormComponent,
      AddPasswordFormComponent,
      PasswordScoreComponent,
      AddTotpFormComponent,
      PostRecoveryCodeFormComponent,
      RecoveryCodeDisplayComponent,
      RecoveryCodeRegenerationPromptComponent,

      TotpInputComponent,
      RecoveryCodeInputComponent,
      EmailAddressInput,
      PasswordInput,
      StayLoggedInInput,
      LoginSuccessComponent,

      SocialButtonsComponent,
      GithubButton,
      FacebookButton,
      GoogleButton,

      ReauthFormComponent,
      EmailVerificationComponent,

      EmailStatusComponent,
      UserAccountSettingsComponent,
      SecurityInfoComponent,
      PersonalDetailComponent,
      LoginMethodsComponent
    }
  }, [contextComponents, propComponents])

  return mergedComponents
}

export type ComponentProviderProps = {
  /**
   * Custom components to be used by all descendents of <ComponentProvider>.
   * See 'Customizing Usermatic' for more information.
   */
  components?: Components,
  /**
   * If true, add bootstrap classes to default components. Has no effect on custom
   * components.
   */
  bootstrapClasses?: boolean,
  /**
   * If true, add usermatic class names (semantic class names beginning with `um-`)
   * to default components. Has no effect on custom components.
   */
  usermaticClasses?: boolean,
  /**
   * The tree of components in which you want the overrides specified by <ComponentProvider>
   * to have effect.
   */
  children: ReactNode
}

/**
 * <ComponentProvider> allows you to override the default display components used
 * by Usermatic. For instance if you wish to use a custom text input component
 * in all Usermatic forms, you can use <ComponentProvider> to do so.
 *
 * NB: As a convenience, the <Usermatic> component also accepts all the properties
 * of <ComponentProvider>. If you wish to use the same custom components everywhere
 * in your app, you can simply pass them to <Usermatic>
 *
 * <ComponentProvider> also allows you to enable or disable the use of bootstrap
 * classes or usermatic classes (semantic class names beginning
 * with `um-`) in default components. If you are using customized components,
 * these settings have no effect.
 *
 * See 'Customizing Usermatic' for more information.
 *
 * @preview-noinline
 * const InputComponent = ({
 *   labelText,
 *   ...props
 * }) => {
 *   return <div style={{
 *     backgroundColor: 'rgb(228, 27, 27, 0.5)'
 *   }}>
 *     { labelText &&
 *       <label htmlFor={props.id}>
 *         {labelText}
 *       </label>
 *     }
 *     <input {...props} autoFocus={false} />
 *   </div>
 * }
 *
 * const components = { InputComponent }
 *
 * render(
 *   <ComponentProvider components={components}>
 *     <LoginForm/>
 *   </ComponentProvider>
 * )
 */
export const ComponentProvider: React.FC<ComponentProviderProps> = ({
  components: propComponents,
  bootstrapClasses,
  usermaticClasses,
  children
}) => {

  const modalAppElement = useMemo(() => {
    if (typeof window === 'undefined') { return }
    return document.getElementById('__next')
        || document.getElementById('root')
        || undefined
  }, [])

  const { components, useBootstrap, useUmClasses } = useContext(ComponentContext)
  const value = useMemo(
    () => ({
      components: {
        ...components,
        ...propComponents
      },
      useBootstrap: bootstrapClasses ?? useBootstrap ?? true,
      useUmClasses: usermaticClasses ?? useUmClasses ?? false,
      modalAppElement
    }),
    [components, propComponents, useBootstrap, useUmClasses, bootstrapClasses,
     usermaticClasses, modalAppElement]
  )

  return <ComponentContext.Provider value={value}>
    {children}
  </ComponentContext.Provider>
}

