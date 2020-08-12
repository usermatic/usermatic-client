
import React, {
  ReactNode,
} from 'react'

import {
  PasswordCredential,
  TotpCredential,
  OauthCredential
} from '../user'

import { ZXCVBNResult } from 'zxcvbn'

/**
 * Component for rendering an alert.
 */
export type AlertComponentType = React.FC<{
  /**
   * The alert message.
   */
  children: ReactNode
  /**
   * The role of the alert.
   */
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

/**
 * Semantic role of button. Used by the default Button component to
 * choose the button style.
 */
export type ButtonRole = 'submit' | 'secondary' | 'cancel' | 'dismiss' | 'danger' | 'urgent'

/**
 * Exact name of button. Used to identify specific uses of <Button> throughout
 * usermatic so that special-cased styles can be applied, either by the default
 * Button component or by one supplied by the user.
 */
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
  | 'regenerate-recovery-codes-dismiss'
  | 'resend-verification-email'
  | 'close-change-password'
  | 'generate-recovery-codes'
  | 'remove-oauth-credential'
  | 'configure-totp'
  | 'cancel-change-password'
  | 'submit-edit-name'
  | 'cancel-edit-name'

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * The role of the button.
   */
  role: ButtonRole
  /**
   * The unique name of the button (use the value of this property if you need to
   * special-case the rendering of a particular button).
   */
  name: ButtonName
  /**
   * If true, the button should not be clickable.
   */
  disabled?: boolean
}, 'className'>

/**
 * Component type for rendering buttons.
 */
export type ButtonType = React.FC<ButtonProps>

/**
 * Component type for rendering security recommendations.
 */
export type RecommendationsType = React.FC<{
  /**
   * Button to open the add password dialog
   */
  addPassword: ReactNode,
  /**
   * Button to open the add recovery codes dialog
   */
  addRecoveryCodes: ReactNode,
  /**
   * Button to open the totp configuration dialog
   */
  addTotp: ReactNode,

  /**
   * Number of active recovery codes the user currently has
   * (e.g. so that you can display "You have X recovery codes remaining")
   */
  recoveryCodesCount?: number
}>

/**
 * Component for rendering the contents of a modal dialog. This component does
 * not render the modal overlay or the modal itself, only the contents.
 */
export type ModalContentsType = React.FC<{
  /**
   * Must be called whenever the user attempts to close the modal, e.g. by click a
   * 'close' button.
   */
  onRequestClose: () => void,

  /**
   * Text and other elements to display in the Modal's title area.
   */
  title: ReactNode,
  /**
   * Text and other elements to display in the Modal's footer area.
   */
  footer?: ReactNode,
  /**
   * The body of the modal.
   */
  children: ReactNode
}>

/**
 * Component for rendering a modal dialog.
 */
export type ModalType = React.FC<{
  /**
   * If true, the modal will be rendered and the rest of the page content obscured.
   */
  isOpen: boolean,

  /**
   * Must be called whenever the user attempts to close the modal, e.g. by clicking
   * outside of it, hitting esc, etc.
   */
  onRequestClose: () => void,

  /**
   * The body of the modal.
   */
  children: ReactNode
}>

export type InputComponentProps = React.InputHTMLAttributes<HTMLInputElement> & {
  labelText?: ReactNode
}

/**
 * Component for rendering a form input. Takes all properties that an HTML input
 * element does, as well as an additional `labelText` property, which would typically
 * be rendered in a <label> element. An Input component must pass all other properties
 * along to an underlying <input> component.
 *
 * @example
 *
 * const InputComponent: InputComponentType = ({labelText, ...props}) => (<>
 *   <label htmlFor={props.id}>{labelText}</label>
 *   <input {...props} />
 * </>)
 *
 */
export type InputComponentType = React.FC<InputComponentProps>

export type FormProps = React.ComponentPropsWithoutRef<'form'>;

type BaseAddPasswordFormProps = {
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,
  /**
   * The password score display, as rendered via <PasswordScoreComponent>
   */
  passwordScore: ReactNode,
  /**
   * The input for the new password, as rendered via <PasswordInput> or
   * <InputComponent>
   */
  newPasswordInput: ReactNode,
  /**
   * The submit button, as rendered via <Button>
   */
  submitButton: ReactNode,

  /**
   * The cancel button, as rendered via <Button>
   */
  cancelButton: ReactNode,

  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
}

export type ResetPasswordFormComponentProps = Omit<BaseAddPasswordFormProps, 'cancelButton'> & {
  /**
   * A checkbox as rendered by <CheckboxComponent>
   */
  loginAfterResetInput: ReactNode,
  /**
   * A checkbox as rendered by <CheckboxComponent>
   */
  stayLoggedInInput: ReactNode,
  /**
   * The message displayed to the user after success.
   */
  successMessage: ReactNode
}

export type AddPasswordFormProps = BaseAddPasswordFormProps & {
  /**
   * The text input for the email address, as rendered by <EmailAddressInput>
   * or <InputComponent>
   */
  emailInput: ReactNode,
}

export type ChangePasswordFormComponentProps = BaseAddPasswordFormProps & {
  /**
   * The text input for the email address, as rendered by <PasswordInput>
   * or <InputComponent>
   */
  oldPasswordInput: ReactNode,
}

/**
 * Layout component type used <ResetPasswordForm>
 */
export type ResetPasswordFormType = React.FC<ResetPasswordFormComponentProps>

/**
 * Layout component type used by <ChangePasswordForm>, when used to change a password.
 */
export type ChangePasswordFormType = React.FC<ChangePasswordFormComponentProps>

/**
 * Layout component type used by <ChangePasswordForm>, when used to add a password.
 * (i.e., when the user does not already have a password on their account).
 */
export type AddPasswordFormType = React.FC<AddPasswordFormProps>

/**
 * Layout component type used by <RequestPasswordResetForm>. Also used by <LoginForm>
 * when user clicks "forgot password".
 */
export type ForgotPasswordFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,
  /**
   * The text input for the email address, as rendered by <EmailAddressInput>
   * or <InputComponent>
   */
  emailInput: ReactNode,
  /**
   * The submit button, as rendered via <Button>
   */
  submitButton: ReactNode,
  /**
   * The cancel button, as rendered via <Button>
   */
  cancelButton: ReactNode,
  /**
   * The message displayed to the user after success.
   */
  successMessage: ReactNode,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
}>

/**
 * Layout component type used by <LoginForm> for password entry.
 */
export type PasswordFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,
  /**
   * The text input for the email address, as rendered by <EmailAddressInput>
   * or <InputComponent>
   */
  emailInput: ReactNode,
  /**
   * The text input for the password, as rendered by <PasswordInput> or
   * <InputComponent>
   */
  passwordInput: ReactNode,
  /**
   * A checkbox as rendered by <CheckboxComponent>
   */
  stayLoggedInInput: ReactNode,
  /**
   * The signin/submit button as rendered by <Button>
   */
  signinButton: ReactNode,
  /**
   * The "forgot password?" button as rendered by <Button>
   */
  forgotPasswordButton: ReactNode,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
}>

/**
 * ZXCVBNResult is defined at https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/zxcvbn/index.d.ts
 */
export type PwScoreRecord = ZXCVBNResult

/**
 * Layout component type used to display the score of a prospective password (i.e.
 * one being entered into <AccountCreationForm>, <ChangePasswordForm>, etc.)
 */
export type PasswordScoreType = React.FC<{
  /**
   * The current score of the password.
   */
  passwordScore: PwScoreRecord
  /**
   * The minimum requried score set in the Usermatic application settings.
   * If `passwordScore.score` is less than minPasswordStrength, the password
   * will be rejected by Usermatic.
   */
  minPasswordStrength: number
}>

/**
 * Layout component type used for 2FA. This component handles entry of both 2FA
 * codes and recovery codes.
 */
export type MFAFormType = React.FC<{
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode,
  /**
   * The message displayed while waiting for asynchronous actions (e.g. form
   * submission) to complete, as rendered by <LoadingMessageComponent>
   */
  loading: ReactNode,
  /**
   * Set to true if the user has clicked "i need to enter a recovery code"
   */
  recoveryMode: boolean
  /**
   * The text input for entering a recovery code, as rendered by
   * <RecoveryCodeInputComponent>
   */
  recoveryCodeInput: ReactNode,
  /**
   * The text input for entering a TOTP code, as rendered by
   * <TotpInputComponent>
   */
  totpTokenInput: ReactNode,
  /**
   * The button which allows the user to switch from TOTP code entry to
   * recovery code entry, as rendered by <Button>
   */
  enterRecoveryModeButton: ReactNode,
  /**
   * The button which allows the user to switch back to TOTP code entry from
   * recovery code entry, as rendered by <Button>
   */
  exitRecoveryModeButton: ReactNode
}>

/**
 * Layout component used by MFAForm when the user needs to enter a recovery code.
 */
export type RecoveryCodeFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,

  /**
   * The input component for the recovery code.
   */
  recoveryCodeInput: ReactNode,
  /**
   * The submit button.
   */
  submitButton: ReactNode,
}>

/**
 * Layout component type used after a 2FA recovery code has been entered.
 */
export type PostRecoveryCodeType = React.FC<{
  /**
   * True if the user chose to disable MFA after entering their
   * recovery code.
   */
  mfaDisabled: boolean
  /**
   * Button which dismisses the post recovery code flow.
   */
  dismissButton: ReactNode
  /**
   * The number of valid recovery codes that the user still has.
   */
  recoveryCodesRemaining?: number
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
  /**
   * The button which, when pressed, disables MFA.
   */
  resetButton: ReactNode
  /**
   * The button which, when pressed, dismisses the dialog without disabling
   * MFA.
   */
  dontResetButton: ReactNode
}>

/**
 * CreateAccountFormType controls the layout of the account creation form.
 */
export type CreateAccountFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,
  /**
   * The text input for the email address, as rendered by <EmailAddressInput>
   * or <InputComponent>
   */
  emailInput: ReactNode,
  /**
   * The text input for the password, as rendered by <PasswordInput> or
   * <InputComponent>
   */
  passwordInput: ReactNode,
  /**
   * A checkbox as rendered by <CheckboxComponent>
   */
  stayLoggedInInput: ReactNode,
  /**
   * The password score display, as rendered via <PasswordScoreComponent>
   */
  passwordScore: ReactNode,
  /**
   * The button that submits the form and creates the account, as rendered
   * via <Button>
   */
  createAccountButton: ReactNode,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
}>

/**
 * Layout component for the success message shown after a successful login.
 */
export type LoginSuccessType = React.FC<{
  /**
   * The email of the newly-created user.
   */
  email: string,
  /**
   * The application name, as configured in the Usermatic
   * dashboard.
   */
  appName: string
}>

/**
 * Layout component for the success message shown after a successful login.
 */
export type AddTotpFormType = React.FC<{
  /**
   * An <img> element using a dataURI to display the QR code containing
   * the TOTP secret key.
   */
  qrCode: ReactNode
  /**
   * The text version of the TOTP secret key, for manual entry
   */
  textCode: ReactNode
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
  /**
   * The message displayed while waiting for asynchronous actions (e.g. form
   * submission) to complete, as rendered by <LoadingMessageComponent>
   */
  loading: ReactNode
  /**
   * Set to true if TOTP setup has been completed successfully.
   */
  success: boolean
  /**
   * The form in which the user must enter a TOTP code to confirm successful
   * setup of their authenticator app.
   */
  totpTokenForm: ReactNode
}>

export type SocialButtonComponentType = React.FC<{
  githubButton: ReactNode,
  facebookButton: ReactNode,
  googleButton: ReactNode,
}>

export type SocialButtonType = React.FC<{ onClick: ButtonProps['onClick'] }>

export type ReauthFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
  /**
   * The prompt which will be provided to the user, e.g. "Please enter
   * your password to perform action X".
   */
  prompt: ReactNode,
  /**
   * The text input for the password, as rendered by <PasswordInput> or
   * <InputComponent>
   */
  passwordInput: ReactNode,
  /**
   * The submit button, as rendered via <Button>
   */
  submitButton: ReactNode,
  /**
   * The cancel button, as rendered via <Button>
   */
  cancelButton: ReactNode
}>

export type ReauthAddPasswordType = React.FC<{
  /**
   * The text of the prompt to be displayed
   */
  prompt: ReactNode,
  /**
   * The <ChangePasswordForm> component.
   */
  addPassword: ReactNode
}>

export type RecoveryCodeDisplayType = React.FC<{
  codes?: string[]
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode
}>

export type RecoveryCodeRegenerationPromptType = React.FC<{
  /**
   * The button which, when pressed, confirms regeneration of recovery
   * codes and invalidation of all previously generated codes.
   */
  confirmButton: ReactNode
}>

/**
 * A component of UserAccountSettingsType is used to customize the
 * user's account settings display.
 *
 * @preview-noinline
 *
 * const UserAccountSettingsComponent = ({
 *   personalDetails,
 *   loginMethods,
 *   accountSecurity
 * }) => {
 *   return <div>
 *     {personalDetails}
 *     <hr/>
 *     {loginMethods}
 *     <hr/>
 *     {accountSecurity}
 *   </div>
 * }
 *
 * render(<UserAccountSettings components={{
 *  UserAccountSettingsComponent
 * }}/>)
 *
 */
export type UserAccountSettingsType = React.FC<{
  /**
   * Security recommendations (e.g. add password), if any, as rendered by
   * <RecommendationsComponent>
   */
  recommendations: ReactNode,
  /**
   * The personal details section, as rendered by <PersonalDetailComponent>
   */
  personalDetails: ReactNode,
  /**
   * The login methods section, as rendered by <LoginMethodsComponent>
   */
  loginMethods: ReactNode,
  /**
   * The account security section, as rendered by <SecurityInfoComponent>
   */
  accountSecurity: ReactNode,
}>

export type EmailVerificationType = React.FC<{
  /**
   * Set to true if verification has completed successfully.
   */
  success: boolean,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode,
  /**
   * The URI that the user will be redirected to now that verification is
   * complete. It is passed here so that it can be displayed, e.g. "If you
   * are not redirected, click here"
   */
  redirectUri?: string
}>

export type EmailStatusType = React.FC<{
  email: string,
  emailIsVerified: boolean,
  resendSuccess: boolean,
  resendVerificationEmailButton: ReactNode
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
  /**
   * True if the user has enabled TOTP.
   */
  totpEnabled: boolean,

  /**
   * A button that opens a modal that the user can click to configure TOTP
   * for their account
   */
  configureTotp: ReactNode,

  /**
   * A button which opens a modal that the user can click to configure TOTP
   * for their account
   */
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

export type NameDisplayType = React.FC<{
  /**
   * The user's first and last name.
   */
  name: {
    first?: string,
    last?: string,
  },

  /**
   * editName can be called to open the name editing modal.
   */
  editName: () => void
}>

export type EditNameFormType = React.FC<{
  /**
   * Properties which must be passed into a <form> element by this component.
   *
   * @example
   * <form {...formProps}>...</form>
   */
  formProps: FormProps,

  /**
   * The input for the first name.
   */
  firstNameInput: ReactNode,
  /**
   * The input for the last name.
   */
  lastNameInput: ReactNode,
  /**
   * Form submission button
   */
  submitButton: ReactNode,
  /**
   * Form cancel button
   */
  cancelButton: ReactNode

  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode

  /**
   * True if the name form submission is in progress
   */
  loading: boolean
}>

export type PersonalDetailType = React.FC<{
  /**
   * The message displayed while waiting for asynchronous actions (e.g. form
   * submission) to complete, as rendered by <LoadingMessageComponent>
   */
  loading: ReactNode,
  /**
   * The error message, if any, as rendered via <ErrorMessageComponent>.
   */
  error: ReactNode,

  /**
   * The user's email address
   */
  email: string,

  /**
   * The name display/editing component. (See EditNameFormComponent)
   */
  name: ReactNode,

  /**
   * Shows whether the email address is verified, and allows user to request
   * an additional verification email. (See EmailVerificationComponent)
   */
  emailVerificationStatus: ReactNode,
}>

export type DefiniteComponents = {
  /**
   * Component for rendering alert messages.
   */
  AlertComponent: AlertComponentType

  /**
   * Default component for rendering text inputs in forms.
   */
  InputComponent: InputComponentType

  /**
   * Default component for rendering checkboxes in forms.
   */
  CheckboxComponent: InputComponentType

  /**
   * Button component.
   */
  Button: ButtonType

  /**
   * Component for rendering the interior of a Modal dialog. Override this component
   * to change the layout of the interior of a modal.
   */
  ModalContentsComponent: ModalContentsType

  /**
   * Component for rendering the overlay and outermost container of Modal dialogs.
   * Responsible for showing/hiding the modal. Override this component to use a
   * different modal system (the default implementation uses
   * (react-modal)[https://www.npmjs.com/package/react-modal]), to change the
   * overlay.
   */
  ModalComponent: ModalType

  /**
   * Component to display when waiting for an asynchronous action
   * to complete.
   */
  LoadingMessageComponent: LoadingMessageType
  /**
   * Component used to render error messages.
   */
  ErrorMessageComponent: ErrorMessageType
  /**
   * Component used to render specialized error messages for given
   * application error codes.
   */
  ErrorCaseComponent: ErrorCaseType

  /**
   * Component used by <CreateAccountForm> to render the form and its inputs.
   */
  CreateAccountFormComponent: CreateAccountFormType

  /**
   * Component displayed after successful account creation
   */
  CreateAccountSuccessComponent: LoginSuccessType

  /////// LoginForm components. ///////////
  // LoginForm is a complex flow involving all possible means of authentication,
  // 2FA, password recovery, etc. Each piece of the flow has a separate layout
  // component here.

  /**
   * Component for rendering the email/password entry form used by <LoginForm>
   */
  PasswordFormComponent: PasswordFormType

  /**
   * Component for rendering the form show by <LoginForm> * after user
   * clicks 'forgot password'
   */
  ForgotPasswordFormComponent: ForgotPasswordFormType

  /**
   * Component used by <LoginForm> for rendering the MFA stage of the login
   * process, including entry of a TOTP code and possible entry of a recovery
   * code.
   */
  MFAFormComponent: MFAFormType

  /**
   * Component renderd by <LoginForm> after successful entry of the a recovery
   * code, which allows them to optionally disable MFA.
   */
  PostRecoveryCodeFormComponent: PostRecoveryCodeType

  /**
   * Component for rendering social login buttons, used by <LoginForm> and
   * <CreateAccountForm>
   */
  SocialButtonsComponent: SocialButtonComponentType
  /**
   * Component to render a github login button.
   */
  GithubButton: SocialButtonType
  /**
   * Component to render a facebook login button.
   */
  FacebookButton: SocialButtonType
  /**
   * Component to render a google login button.
   */
  GoogleButton: SocialButtonType

  /**
   * Component for rendering the text input for TOTP codes.
   */
  TotpInputComponent: InputComponentType
  /**
   * Component for rendering the text input for 2FA recovery codes.
   */
  RecoveryCodeInputComponent: InputComponentType

  /**
   * Component for rendering the form for recovery code input, used by
   * <MFAForm>.
   */
  RecoveryCodeFormComponent: RecoveryCodeFormType

  /**
   * Component for rendering the email address input in <LoginForm> and
   * <AccountCreationForm>. Uses the InputComponent component by default.
   */
  EmailAddressInput: InputComponentType

  /**
   * Component for rendering the password input in <LoginForm> and
   * <AccountCreationForm>. Uses the InputComponent component by default.
   */
  PasswordInput: InputComponentType
  /**
   * Component for rendering the "stay logged in" checkbox in <LoginForm> and
   * <AccountCreationForm>. Uses the CheckboxComponent component by default.
   */
  StayLoggedInInput: InputComponentType

  /**
   * Component displayed after successful login
   */
  LoginSuccessComponent: LoginSuccessType

  /**
   * Component for rendering the old/new password form used by
   * <ChangePasswordForm>
   */
  ChangePasswordFormComponent: ChangePasswordFormType

  /**
   * Component for rendering the new password form used by
   * <ChangePasswordForm> when it is used to add a password to an
   * account that doesn't have one.
   */
  AddPasswordFormComponent: AddPasswordFormType

  /**
   * Component for rendering the new password form used by <ResetPasswordForm>
   * when resetting a password via a password-reset link delivered via email.
   */
  ResetPasswordFormComponent: ResetPasswordFormType

  /**
   * Component used by <AddTotpForm> for rendering a QR code, and verifying
   * the authenticator app setup via code entry.
   */
  AddTotpFormComponent: AddTotpFormType

  /**
   * Component used to display the strength of a prospective password to the user.
   * It is used by <AccountCreationForm>, <ChangePasswordForm>,
   * <ResetPasswordForm>, and any other components where a new password is entered.
   */
  PasswordScoreComponent: PasswordScoreType

  /**
   * Component used to display new recovery codes to the user, after they are
   * created. Used by <GenRecoveryCodesForm>
   */
  RecoveryCodeDisplayComponent: RecoveryCodeDisplayType
  /**
   * Component used by <GenRecoveryCodesForm> to warn the user that their
   * pre-existing codes will be invalidated, and confirming that they wish
   * to proceed and generate new codes.
   */
  RecoveryCodeRegenerationPromptComponent: RecoveryCodeRegenerationPromptType

  /**
   * Component to render the re-authorization form used by <ReauthenticateGuard>,
   * to obtain a user's password before sensitive actions are performed.
   */
  ReauthFormComponent: ReauthFormType

  /**
   * Component that ReauthenticateGuard uses to prompt the user to add a password
   * if they attempt to reauthenticate without having a password set on their
   * account.
   */
  ReauthAddPasswordComponent: ReauthAddPasswordType

  /**
   * Component used by <EmailVerifier> when users are verifying their email
   * via a link sent to that email address.
   */
  EmailVerificationComponent: EmailVerificationType

  /**
   * Component used by <UserAccountSettings> to render the user's profile page
   * and various account settings components.
   */
  UserAccountSettingsComponent: UserAccountSettingsType

  /**
   * Component used by <UserAccountSettings> for displaying a user's
   * email and its verification status, including a button for re-sending
   * the verification email.
   */
  EmailStatusComponent: EmailStatusType

  /**
   * Component used by <UserAccountSettings> for displaying a user's 2FA
   * settings, including recovery code generation.
   */
  SecurityInfoComponent: SecurityInfoType

  /**
   * Component to display user's name, used by <UserAccountSettings>
   */
  NameDisplayComponent: NameDisplayType

  /**
   * Form component used by <UserAccountSettings> for displaying and editing
   * the user's name.
   */
  EditNameFormComponent: EditNameFormType

  /**
   * Component used by <UserAccountSettings> to display recommended actions
   * (e.g. set up security codes)
   */
  RecommendationsComponent: RecommendationsType

  /**
   * Component used by <UserAccountSettings> for displaying a user's
   * personal details.
   */
  PersonalDetailComponent: PersonalDetailType

  /**
   * Component used by <UserAccountSettings> for displaying a user's
   * login methods (e.g. password, oauth providers, etc), as well as
   * allowing them to change their password, remove Oauth providers,
   * etc.
   */
  LoginMethodsComponent: LoginMethodsType
}

export type Components = Partial<DefiniteComponents>
