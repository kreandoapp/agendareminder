import { useCallback } from 'react'

export default function useSession({
setUser,
clearAuthSession,
setEmail,
setPassword,
setError,
setCurrentPage,
setOnboardingCompleted,
setOnboardingStep,
stopDetectorRef,
}) {
const clearSession = useCallback(() => {
clearAuthSession()
setUser(null)

if (stopDetectorRef?.current) {
  stopDetectorRef.current()
}

setOnboardingCompleted(false)
setOnboardingStep(1)
setEmail('')
setPassword('')
setError('')
setCurrentPage('home')

}, [
clearAuthSession,
setUser,
setEmail,
setPassword,
setError,
setCurrentPage,
setOnboardingCompleted,
setOnboardingStep,
stopDetectorRef,
])

const restoreSession = useCallback(
async (onRestore) => {
const token = localStorage.getItem('access_token')
const savedUser = localStorage.getItem('user')

  if (!token) {
    return false
  }

  let restoredUser = null

  if (savedUser) {
    try {
      restoredUser = JSON.parse(savedUser)
    } catch (error) {
      console.error(
        'Error leyendo el usuario guardado:',
        error
      )
      clearSession()
      return false
    }
  }

  if (
    !restoredUser ||
    typeof restoredUser !== 'object' ||
    Array.isArray(restoredUser)
  ) {
    clearSession()
    return false
  }

  setUser(restoredUser)

  if (typeof onRestore === 'function') {
    return await onRestore(restoredUser)
  }

  return true
},
[setUser, clearSession]

)

const logout = useCallback(() => {
clearSession()
}, [clearSession])

return {
clearSession,
restoreSession,
logout,
}
}