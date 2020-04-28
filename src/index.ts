
import {
  AuthProvider,
  CredentialConsumer,
  useToken,
  useAppId
} from './auth'

import {
  useProfile,
  usePrimaryEmail,
  useCredentials,
  usePasswordCredential,
  useProfilePhotos,
  isPasswordCredential,
  isOauthCredential,
  Credential,
  PasswordCredential,
  OauthCredential
} from './user'

import {
  LoginForm,
  LogoutButton,
  AccountCreationForm,
  useLogin,
  useCreateAccount,
  useLogout
} from './login'

import {
  useResetPassword,
  useChangePassword,
  useRequestPasswordResetEmail,
  RequestPasswordResetForm,
  ResetPasswordForm,
  ChangePasswordForm,
  PasswordScore
} from './passwords'

import {
  EmailVerifier,
  useEmailVerifier,
  useSendVerificationEmail
} from './verifyemail'

import {
  useReauthToken,
  ReauthenticateGuard
} from './reauth'

export {
  AuthProvider,
  CredentialConsumer,
  LoginForm,
  LogoutButton,
  AccountCreationForm,
  EmailVerifier,
  RequestPasswordResetForm,
  ResetPasswordForm,
  ChangePasswordForm,
  PasswordScore,
  ReauthenticateGuard,
  useLogin,
  useLogout,
  useCreateAccount,
  useToken,
  useReauthToken,
  useEmailVerifier,
  useProfile,
  usePrimaryEmail,
  useProfilePhotos,
  useCredentials,
  usePasswordCredential,
  isPasswordCredential,
  isOauthCredential,
  useSendVerificationEmail,
  useResetPassword,
  useChangePassword,
  useRequestPasswordResetEmail,
  useAppId,

  // types
  Credential,
  PasswordCredential,
  OauthCredential
}
