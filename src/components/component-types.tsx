
import React, {
  ReactNode,
} from 'react'

import {
  PasswordCredential,
  TotpCredential,
  OauthCredential
} from '../user'

import { ZXCVBNResult } from 'zxcvbn'

export type AlertComponentType = React.FC<{
  children: ReactNode
  role: 'success' | 'info' | 'warning' | 'error'
}>

export type LoadingMessageType = React.FC<{}>

export type ConciseError = {
  code: string
  message: string
  appErrorCode?: string
}

export type ErrorCaseType = React.FC<{
  code?: string,
  children: ReactNode
}>

export type ErrorMessageType = React.FC<{
  errors: ConciseError[]
}>

export type ButtonRole = 'submit' | 'secondary' | 'cancel' | 'dismiss' | 'danger'
export type ButtonName = 'login'
  | 'logout'
  | 'create-account'
  | 'forgot-password'
  | 'request-password-reset'
  | 'cancel-password-reset'
  | 'reset-password'
  | 'set-password'
  | 'change-password'
  | 'exit-recovery-mode'
  | 'enter-recovery-mode'
  | 'submit-recovery-code'
  | 'reset-2fa'
  | 'dismiss-2fa-disabled'
  | 'leave-2fa-enabled'
  | 'submit-reauth'
  | 'cancel-reauth'
  | 'regenerate-recovery-codes'
  | 'resend-verification-email'
  | 'close-change-password'
  | 'generate-recovery-codes'
  | 'remove-oauth-credential'
  | 'configure-totp'

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  role: ButtonRole
  name: ButtonName
  disabled?: boolean
}, 'className'>

export type ButtonType = React.FC<ButtonProps>

export type ModalType = React.FC<{
  isOpen: boolean,
  onRequestClose: () => void,
  title: ReactNode,
  footer?: ReactNode,
  children: ReactNode
}>

export type InputComponentProps = React.InputHTMLAttributes<HTMLInputElement> & {
  labelText?: ReactNode
}
export type InputComponentType = React.FC<InputComponentProps>

export type FormProps = React.ComponentPropsWithoutRef<'form'>;

type BaseAddPasswordFormProps = {
  formProps: FormProps,
  passwordScore: ReactNode,
  newPasswordInput: ReactNode,
  submitButton: ReactNode,
  error: ReactNode
}

export type ResetPasswordFormProps = BaseAddPasswordFormProps & {
  loginAfterResetInput: ReactNode,
  stayLoggedInInput: ReactNode,
  successMessage: ReactNode
}

export type AddPasswordFormProps = BaseAddPasswordFormProps & {
  emailInput: ReactNode,
}

export type ChangePasswordFormProps = BaseAddPasswordFormProps & {
  oldPasswordInput: ReactNode,
}

export type ResetPasswordFormType = React.FC<ResetPasswordFormProps>
export type ChangePasswordFormType = React.FC<ChangePasswordFormProps>
export type AddPasswordFormType = React.FC<AddPasswordFormProps>

export type ForgotPasswordFormType = React.FC<{
  formProps: FormProps,
  emailInput: ReactNode,
  submitButton: ReactNode,
  cancelButton: ReactNode,
  successMessage: ReactNode,
  error: ReactNode
}>

export type PasswordFormType = React.FC<{
  formProps: FormProps,
  emailInput: ReactNode,
  passwordInput: ReactNode,
  stayLoggedInInput: ReactNode,
  signinButton: ReactNode,
  forgotPasswordButton: ReactNode,
  error: ReactNode
}>

export type PwScoreRecord = ZXCVBNResult

export type PasswordScoreType = React.FC<{
  passwordScore: PwScoreRecord
  minPasswordStrength: number
}>

export type MFAFormType = React.FC<{
  error: ReactNode,
  loading: ReactNode,
  recoveryMode: boolean
  recoveryCodeInput: ReactNode,
  totpTokenInput: ReactNode,
  enterRecoveryModeButton: ReactNode,
  exitRecoveryModeButton: ReactNode
}>

export type PostRecoveryCodeType = React.FC<{
  mfaDisabled: boolean
  dismissButton: ReactNode
  recoveryCodesRemaining?: number
  error: ReactNode
  resetButton: ReactNode
  dontResetButton: ReactNode
}>

export type CreateAccountFormType = React.FC<{
  formProps: FormProps,
  emailInput: ReactNode,
  passwordInput: ReactNode,
  stayLoggedInInput: ReactNode,
  passwordScore: ReactNode,
  createAccountButton: ReactNode,
  error: ReactNode
}>

export type AddTotpFormType = React.FC<{
  qrCode: ReactNode
  textCode: ReactNode
  error: ReactNode
  loading: ReactNode
  success: boolean
  totpTokenForm: ReactNode
}>

export type SocialButtonComponentType = React.FC<{
  githubButton: ReactNode,
  facebookButton: ReactNode,
  googleButton: ReactNode,
}>

export type SocialButtonType = React.FC<{ onClick: ButtonProps['onClick'] }>

export type ReauthFormType = React.FC<{
  formProps: FormProps,
  error: ReactNode
  prompt: ReactNode,
  passwordInput: ReactNode,
  submitButton: ReactNode,
  cancelButton: ReactNode
}>

export type RecoveryCodeDisplayType = React.FC<{
  codes?: string[]
  error: ReactNode
}>

export type RecoveryCodeRegenerationPromptType = React.FC<{
  confirmButton: ReactNode
}>

export type UserAccountSettingsType = React.FC<{
  personalDetails: ReactNode,
  loginMethods: ReactNode,
  accountSecurity: ReactNode,
}>

export type EmailVerificationType = React.FC<{
  success: boolean,
  error: ReactNode,
  redirectUri?: string
}>

export type EmailStatusType = React.FC<{
  email: string,
  emailIsVerified: boolean,
  resendSuccess: boolean,
  resendVerificationEmailButton: ReactNode
}>

export type CredentialListType = React.FC<{
  error: ReactNode,
  loading: ReactNode,
  credentials: ReactNode
}>

export type EmailInfoType = React.FC<{
  changePassword: ReactNode,
  credential: PasswordCredential
}>

export type OauthInfoType = React.FC<{
  credentials: {
    credential: OauthCredential,
    removeButton: ReactNode
  }[]
}>

export type TotpInfoType = React.FC<{
  credential: TotpCredential
}>

export type SecurityInfoType = React.FC<{
  totpEnabled: boolean,
  configureTotp: ReactNode,
  generateNewRecoveryCodes: ReactNode,
  codeCount: number
}>

export type LoginMethodsType = React.FC<{
  passwordCredential?: PasswordCredential,
  oauthCredentials: {
    credential: OauthCredential,
    removeButton: ReactNode
  }[],
  changePassword: ReactNode
}>

export type PersonalDetailType = React.FC<{
  loading: ReactNode,
  error: ReactNode,
  email: string,
  name: {
    family?: string,
    given?: string,
    full?: string
  },
  emailVerificationStatus: ReactNode,
}>

export type DefiniteComponents = {
  // Default component for alert messages.
  AlertComponent: AlertComponentType

  // Default text input component used in forms.
  InputComponent: InputComponentType
  // Default checkbox component
  CheckboxComponent: InputComponentType

  // Default button component.
  Button: ButtonType

  // Default Modal
  ModalComponent: ModalType

  // Loading and error messages.
  LoadingMessageComponent: LoadingMessageType
  ErrorMessageComponent: ErrorMessageType
  ErrorCaseComponent: ErrorCaseType

  // AccountCreationForm components
  CreateAccountFormComponent: CreateAccountFormType

  /////// LoginForm components. ///////////
  // LoginForm is a complex flow involving all possible means of authentication,
  // 2FA, password recovery, etc. Each piece of the flow has a separate layout
  // component here.

  // Layout for the email/password entry form.
  PasswordFormComponent: PasswordFormType
  // Layout for the form shown after user clicks 'forgot password'
  ForgotPasswordFormComponent: ForgotPasswordFormType
  // Layout for the 2FA stage of login, including entry of a recovery code.
  MFAFormComponent: MFAFormType
  // Layout show to user after they enter a recovery code, and which allows them
  // to optionally disable 2FA.
  PostRecoveryCodeFormComponent: PostRecoveryCodeType

  // Layout for social login buttons
  SocialButtonsComponent: SocialButtonComponentType
  GithubButton: SocialButtonType
  FacebookButton: SocialButtonType
  GoogleButton: SocialButtonType

  // Input for TOTP codes.
  TotpInputComponent: InputComponentType
  // Input for 2FA recovery codes.
  RecoveryCodeInputComponent: InputComponentType
  // Input for email address
  EmailAddressInput: InputComponentType
  // Input for password
  PasswordInput: InputComponentType
  // Input for stayLoggedIn
  StayLoggedInInput: InputComponentType

  // Layouts for changing passwords
  ChangePasswordFormComponent: ChangePasswordFormType
  // Layout for adding a password (e.g. to an Oauth account)
  AddPasswordFormComponent: AddPasswordFormType
  // Layout that handles resetting passwords via a password-reset link
  // delivered via email.
  ResetPasswordFormComponent: ResetPasswordFormType
  // Layout that handles displaying a QR code and verifying the authenticator
  // app setup.
  AddTotpFormComponent: AddTotpFormType

  // Layout that displays the password score. Used anywhere a new password
  // is entered (e.g. ChangePasswordForm, CreateAccountForm, ResetPasswordForm)
  PasswordScoreComponent: PasswordScoreType

  // Layout for displaying recovery codes to user.
  RecoveryCodeDisplayComponent: RecoveryCodeDisplayType
  // Layout for confirming that the user wants to regenerate their recovery
  // codes. Used when they still have active recovery codes, which will not
  // be valid after generating new ones.
  RecoveryCodeRegenerationPromptComponent: RecoveryCodeRegenerationPromptType

  // Layout for the re-authorization form (used by ReauthenticateGuard to
  // obtain user's password before sensitive actions are performed).
  ReauthFormComponent: ReauthFormType

  // Layout shown to the user as they are verifying their email via a link
  // sent to their email address.
  EmailVerificationComponent: EmailVerificationType

  UserAccountSettingsComponent: UserAccountSettingsType

  // Layout for displaying a user's email credential,
  // e.g. is it verified, click here to re-send verification email
  EmailStatusComponent: EmailStatusType

  SecurityInfoComponent: SecurityInfoType
  PersonalDetailComponent: PersonalDetailType
  LoginMethodsComponent: LoginMethodsType
}

export type Components = Partial<DefiniteComponents>
