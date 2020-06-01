
import classNames from 'classnames'

import React, {
  ReactNode,
  MouseEvent,
  createContext,
  useState,
  useMemo,
  useContext
} from 'react'

import { Icon } from 'react-icons-kit'
import { google } from 'react-icons-kit/fa/google'
import { facebookOfficial } from 'react-icons-kit/fa/facebookOfficial'
import { github } from 'react-icons-kit/fa/github'

import {
  IconProps,
  AlertComponentType,
  LoadingMessageType,
  ErrorCaseType,
  ErrorMessageType,
  ButtonRole,
  ButtonName,
  ButtonProps,
  ButtonType,
  InputComponentType,
  ResetPasswordFormType,
  AddPasswordFormType,
  ChangePasswordFormType,
  PasswordFormType,
  CreateAccountFormType,
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
  FormComponents,
  DefiniteFormComponents
} from './component-types'

const GoogleLogo = (props: IconProps) => <Icon icon={google} {...props} />
const FbLogo = (props: IconProps) => <Icon icon={facebookOfficial} {...props} />
const GithubLogo = (props: IconProps) => <Icon icon={github} {...props} />

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

  return <div className={classNames(classes)}>
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
    case 'logout':
    case 'create-account':
    case 'forgot-password':
    case 'request-password-reset':
    case 'cancel-password-reset':
    case 'enter-recovery-mode':
    case 'submit-reauth':
    case 'cancel-reauth':
    case 'regenerate-recovery-codes':
      return ''

    case 'set-password':
    case 'change-password':
      return 'btn-lg'

    case 'exit-recovery-mode':
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

const DefaultButton: ButtonType = ({className, role, name, disabled, ...props}) => (
  <button
    className={
      classNames('btn',
        disabled && 'disabled',
        buttonClasses(role, name)
      )
    }
    {...props}
  />
)

const DefaultInputComponent: InputComponentType = ({
  labelText,
  ...props
}) => (
  <div className="form-label-group">
    { labelText &&
      <label htmlFor={props.id}>
        {labelText}
      </label>
    }
    <input className="form-control" {...props} />
  </div>
)
DefaultInputComponent.displayName = 'DefaultInputComponent'

const DefaultCheckboxComponent: InputComponentType = ({
  labelText,
  ...props
}) => (
  <div className="custom-control custom-checkbox">
    <input className="custom-control-input" {...props} />
    { labelText &&
      <label className="custom-control-label" htmlFor={props.id}>
        {labelText}
      </label>
    }
  </div>
)
DefaultCheckboxComponent.displayName = 'DefaultCheckboxComponent'

const DefaultCodeInput: InputComponentType = (props) => (
  <div>
    <input className="form-control" {...props} />
  </div>
)
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
  error
}) => (
  <form {...formProps}>
    {oldPasswordInput}
    {newPasswordInput}
    {passwordScore}
    {submitButton}
    {error}
  </form>
)

const DefaultAddPasswordForm: AddPasswordFormType = ({
  formProps,
  emailInput,
  newPasswordInput,
  passwordScore,
  submitButton,
  error
}) => (
  <form {...formProps}>
    {emailInput}
    {newPasswordInput}
    {passwordScore}
    {submitButton}
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
}) => (
  <div>
    <div>
      Enter your email to get a password reset link.
    </div>
    {error}
    <form {...formProps}>
      {emailInput}
      <div className="d-flex justify-content-between mb-3">
        {submitButton}
        {cancelButton}
      </div>
    </form>
    {successMessage &&
      <div className="alert alert-success m-3">
        {successMessage}
      </div>
    }
  </div>
)

const DefaultPasswordForm: PasswordFormType = ({
  formProps,
  emailInput,
  passwordInput,
  stayLoggedInInput,
  signinButton,
  forgotPasswordButton,
  error
}) => (
  <form {...formProps}>
    {emailInput}
    {passwordInput}
    {stayLoggedInInput}

    <div className="mb-3 justify-content-between d-flex">
      {signinButton}
      {forgotPasswordButton}
    </div>

    {error}
  </form>
)

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

  const classes = ['badge']
  if (score > 3) {
    classes.push('badge-success')
  } else if (score > 2) {
    classes.push('badge-warning')
  } else {
    classes.push('badge-danger')
  }

  return <div className="small p-1">
    Password Strength <span className={classNames(classes)}>{scoreDisplay}</span>
  </div>
}

const PasswordStrengthDiagnostic: React.FC<{
  minPasswordStrength: number
  pwScore: PwScoreRecord
}> = ({pwScore, minPasswordStrength}) => {

  if (pwScore.score >= minPasswordStrength || pwScore.feedback == null) {
    return null
  }

  return <div className="alert alert-warning">
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
}) => (
  <div className="text-muted mb-2">
    <PasswordStrengthText pwScore={passwordScore} />
    <PasswordStrengthDiagnostic
      minPasswordStrength={minPasswordStrength}
      pwScore={passwordScore}
    />
  </div>
)

const DefaultMFAForm: MFAFormType = ({
  error,
  loading,
  recoveryMode,
  recoveryCodeInput,
  totpTokenInput,
  enterRecoveryModeButton,
  exitRecoveryModeButton
}) => (
  <div className="d-flex flex-column align-items-center">
    {error}
    <div className="text-muted p-3">
      { recoveryMode
        ? <>Please enter your recovery code:</>
        : <>Please enter the 6 digit code from your authenticator app:</>
      }
    </div>
    { recoveryMode
      ? <div className="w-100 d-flex justify-content-center">
          <div className="w-100 d-flex flex-column align-items-center">
              {recoveryCodeInput}
          </div>
        </div>

      : totpTokenInput }
    {recoveryMode ? exitRecoveryModeButton : enterRecoveryModeButton}
    {loading}
  </div>
)

const DefaultPostRecoveryCodeForm: PostRecoveryCodeType = ({
  mfaDisabled,
  dismissButton,
  recoveryCodesRemaining,
  error,
  resetButton,
  dontResetButton
}) => {
  if (mfaDisabled) {
    return <div>
      <div className="alert alert-info">
        You have disabled 2FA. Please consider re-enabling it as soon as possible.
      </div>
      {dismissButton}
    </div>
  }

  return <div>
    <div className="alert alert-secondary">
      You have logged in via a recovery code.
      The code you just used will no longer work.
      { (recoveryCodesRemaining != null) &&
        <>You have {recoveryCodesRemaining} recovery codes remaining.</>
      }
    </div>
    <div className="my-3 d-flex justify-content-center">
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
}) => <>
  <form {...formProps}>
    {emailInput}
    {passwordInput}
    {stayLoggedInInput}
    {passwordScore}
    <div className="mb-3">
      {createAccountButton}
    </div>
  </form>
  {error}
</>

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

  if (success) {
    return <div className="alert alert-success mt-3">
      Your authenticator app has been successfully configured.
      You will need your authenticator app in order to log in to
      your account from now on.
    </div>
  } else {
    return <div className="d-flex flex-column align-items-center">
      <div>1. Scan this QRCode with your authenticator app</div>
      <div>{qrCode}</div>

      <div className="d-flex flex-column align-items-center text-muted">
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
  providerClass: string,
  children: ReactNode
}> = ({onClick, providerClass, children}) => (
  <div className="d-flex justify-content-center my-2">
    <button className={classNames("btn btn-block btn-outline-primary d-flex align-items-center justify-content-between", providerClass)}
      onClick={onClick}>
      {children}
    </button>
  </div>
)

const DefaultGithubButton: SocialButtonType = ({onClick}) => (
  <SocialLoginButton onClick={onClick} providerClass={buttonClass('github')}>
    <GithubLogo size="2em"/>
    <div className="flex-grow-1 font-weight-bold">Login with GitHub</div>
  </SocialLoginButton>
)

const DefaultFacebookButton: SocialButtonType = ({onClick}) => (
  <SocialLoginButton onClick={onClick} providerClass={buttonClass('facebook')}>
    <FbLogo size="2em"/>
    <div className="flex-grow-1 font-weight-bold">Login with Facebook</div>
  </SocialLoginButton>
)

const DefaultGoogleButton: SocialButtonType = ({onClick}) => (
  <SocialLoginButton onClick={onClick} providerClass={buttonClass('google')}>
    <GoogleLogo size="2em"/>
    <div className="flex-grow-1 font-weight-bold">Login with Google</div>
  </SocialLoginButton>
)

const DefaultSocialButtonsComponent: SocialButtonComponentType = ({
  githubButton,
  facebookButton,
  googleButton
}) => (
  <div className="my-3">
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
)

const DefaultReauthFormComponent: ReauthFormType = ({
  formProps,
  error,
  prompt,
  passwordInput,
  submitButton,
  cancelButton
}) => (
  <div>
    <div className="mb-3">
      {prompt}
    </div>
    <form {...formProps}>
      {error}
      {passwordInput}
      <div className="d-flex justify-content-between">
        {submitButton}
        {cancelButton}
      </div>
    </form>
  </div>
)

const DefaultRecoveryCodeDisplayComponent: RecoveryCodeDisplayType = ({
  codes, error
}) => (
  <>
    {error}
    { codes != null &&
      <div className="p-5">
        Here are your recovery codes. Treat them like passwords and store them
        somewhere safe.
        <div className="d-flex justify-content-center">
          <pre id="pre-codes">
            { codes.join('\n') }
          </pre>
        </div>
        You will not be able to view these codes again later.
        If you lose them, you can generate new ones.
      </div>
    }
  </>
)

const DefaultRecoveryCodeRegenerationPromptComponent: RecoveryCodeRegenerationPromptType = ({
  confirmButton
}) => (
  <div className="d-flex flex-column align-items-center">
    <div className="alert alert-warning">
      Warning: After you generate new codes, your old codes will no longer
      work. Make sure you store the new codes securely.
    </div>
    {confirmButton}
  </div>
)

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

export const ComponentContext = createContext<FormComponents>({})

export const useComponents = (propComponents: FormComponents = {}): DefiniteFormComponents => {
  const contextComponents = useContext(ComponentContext)

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

    const Button = merged.Button ?? DefaultButton
    const CreateAccountFormComponent = merged.CreateAccountFormComponent ?? DefaultCreateAccountForm
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

    return {
      AlertComponent,
      InputComponent,
      CheckboxComponent,
      LoadingMessageComponent,
      ErrorMessageComponent,
      ErrorCaseComponent,
      Button,
      CreateAccountFormComponent,
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

      TotpInputComponent: merged.TotpInputComponent ?? DefaultCodeInput,
      RecoveryCodeInputComponent: merged.RecoveryCodeInputComponent ?? DefaultCodeInput,
      EmailAddressInput: merged.EmailAddressInput ?? InputComponent,
      PasswordInput: merged.PasswordInput ?? InputComponent,
      StayLoggedInInput: merged.StayLoggedInInput ?? CheckboxComponent,

      SocialButtonsComponent,
      GithubButton,
      FacebookButton,
      GoogleButton,

      ReauthFormComponent,
      EmailVerificationComponent
    }
  }, [contextComponents, propComponents])

  return mergedComponents
}

export const ComponentProvider: React.FC<{
  components?: FormComponents,
  children: ReactNode
}> = ({components: propComponents, children}) => {

  const components = useComponents(propComponents)

  return <ComponentContext.Provider value={components}>
    {children}
  </ComponentContext.Provider>
}
