import ForgotPassword from './ForgotPassword'
import VerifyResetCode from './VerifyResetCode'
import ResetPassword from './ResetPassword'
import PasswordResetSuccess from './PasswordResetSuccess'
import Login from './Login'

function AuthFlow({
  authPage,
  setAuthPage,
  resetEmail,
  setResetEmail,
  resetToken,
  setResetToken,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
}) {
  if (authPage === 'forgot-password') {
    return (
      <ForgotPassword
        onSubmit={async (submittedEmail) => {
          const result = await forgotPassword(submittedEmail)

          if (result) {
            setResetEmail(submittedEmail)
            setAuthPage('verify-reset-code')
          }

          return result
        }}
        onBack={() => setAuthPage('login')}
      />
    )
  }

  if (authPage === 'verify-reset-code') {
    return (
      <VerifyResetCode
        email={resetEmail}
        onSubmit={async (code) => {
          const result = await verifyResetCode(resetEmail, code)

          if (result?.reset_token) {
            setResetToken(result.reset_token)
            setAuthPage('reset-password')
          }

          return result
        }}
        onBack={() => setAuthPage('forgot-password')}
      />
    )
  }

  if (authPage === 'reset-password') {
    return (
      <ResetPassword
        onSubmit={async (newPassword) => {
          const result = await resetPassword(resetToken, newPassword)

          if (result) {
            setAuthPage('password-reset-success')
          }

          return result
        }}
      />
    )
  }

  if (authPage === 'password-reset-success') {
    return (
      <PasswordResetSuccess
        onContinue={() => setAuthPage('login')}
      />
    )
  }

  return (
    <Login
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      error={error}
      onLogin={onLogin}
      onForgotPassword={() => setAuthPage('forgot-password')}
    />
  )
}

export default AuthFlow
