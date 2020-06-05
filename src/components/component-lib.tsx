
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
      return 'px-5'

    case 'logout':
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
  const submitClasses = useClassnames(
    'mb-3 justify-content-between d-flex', 'um-password-signin-button-container'
  )

  return <form {...formProps}>
    {emailInput}
    {passwordInput}
    {stayLoggedInInput}

    <div className={submitClasses}>
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
}) => <>
  <form {...formProps}>
    {emailInput}
    {passwordInput}
    {stayLoggedInInput}
    {passwordScore}
    {createAccountButton}
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

export const ComponentContext = createContext<{
  useBootstrap: boolean,
  useUmClasses: boolean,
  components: FormComponents
}>({ useBootstrap: true, useUmClasses: false, components: {} })

export const useComponents = (propComponents: FormComponents = {}): DefiniteFormComponents => {
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
  bootstrapClasses?: boolean,
  usermaticClasses?: boolean,
  children: ReactNode
}> = ({
  components: propComponents,
  bootstrapClasses: useBootstrap = true,
  usermaticClasses: useUmClasses = false,
  children
}) => {

  const components = useComponents(propComponents)
  const value = useMemo(
    () => ({ components, useBootstrap, useUmClasses }),
    [components, useBootstrap, useUmClasses]
  )

  return <ComponentContext.Provider value={value}>
    {children}
  </ComponentContext.Provider>
}

