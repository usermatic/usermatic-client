
import {
  UsermaticAuthProvider,
  UMTokenContext,
  useCredentials,
  useProfile
} from './auth'

import {
  UMLoginForm,
  UMLogoutForm,
  UMAccountCreationForm,
  useLogin,
  useCreateAccount,
  useLogout
} from './login'

import {
  useResetPassword,
  useChangePassword,
  useRequestPasswordResetEmail,
  UMRequestPasswordResetForm,
  UMResetPasswordForm,
  UMChangePasswordForm
} from './passwords'

import {
  UMEmailVerifier,
  useEmailVerifier,
  useSendVerificationEmail
} from './verifyemail'

export {
  UsermaticAuthProvider,
  UMTokenContext,
  UMLoginForm,
  UMLogoutForm,
  UMAccountCreationForm,
  UMEmailVerifier,
  UMRequestPasswordResetForm,
  UMResetPasswordForm,
  UMChangePasswordForm,
  useLogin,
  useLogout,
  useCreateAccount,
  useCredentials,
  useEmailVerifier,
  useProfile,
  useSendVerificationEmail,
  useResetPassword,
  useChangePassword,
  useRequestPasswordResetEmail
}
