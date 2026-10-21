import {
  useCallback,
} from 'react'

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

} = {}) {


  // =====================================================
  // LIMPIAR SESIÓN
  // ÚNICO PUNTO CENTRAL PARA SESIÓN INVÁLIDA / LOGOUT
  // =====================================================

  const clearSession = useCallback(() => {

    console.log(
      '🔴 Sesión inválida o vencida. Limpiando...'
    )


    // ===================================================
    // LIMPIAR AUTENTICACIÓN PERSISTIDA
    // ===================================================

    clearAuthSession?.()


    // ===================================================
    // LIMPIAR USUARIO EN MEMORIA
    // ===================================================

    setUser?.(null)


    // ===================================================
    // DETENER DETECTOR DE WHATSAPP
    // ===================================================

    if (
      stopDetectorRef?.current
    ) {

      stopDetectorRef.current()

    }


    // ===================================================
    // RESETEAR ONBOARDING
    // ===================================================

    setOnboardingCompleted?.(
      false
    )

    setOnboardingStep?.(
      1
    )


    // ===================================================
    // LIMPIAR FORMULARIO DE LOGIN
    // ===================================================

    setEmail?.('')

    setPassword?.('')

    setError?.('')


    // ===================================================
    // VOLVER AL INICIO
    // ===================================================

    setCurrentPage?.(
      'home'
    )

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


  // =====================================================
  // RESTAURAR SESIÓN
  // =====================================================

  const restoreSession = useCallback(

    async (
      onRestore
    ) => {

      const token =
        localStorage.getItem(
          'access_token'
        )


      const savedUser =
        localStorage.getItem(
          'user'
        )


      // =================================================
      // NO EXISTE SESIÓN
      // =================================================

      if (!token) {

        return false

      }


      // =================================================
      // RESTAURAR USUARIO
      // =================================================

      if (savedUser) {

        try {

          const parsedUser =
            JSON.parse(
              savedUser
            )

          setUser?.(
            parsedUser
          )

        } catch (error) {

          console.error(
            '❌ Error leyendo usuario:',
            error
          )

          clearSession()

          return false

        }

      }


      // =================================================
      // RESTAURAR DATOS ADICIONALES
      // =================================================

      if (
        typeof onRestore !==
        'function'
      ) {

        return true

      }


      return await onRestore()

    },

    [
      setUser,
      clearSession,
    ]

  )


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = useCallback(() => {

    console.log(
      '🚪 Logout solicitado desde la aplicación'
    )

    clearSession()

  }, [

    clearSession,

  ])


  // =====================================================
  // API PÚBLICA
  // =====================================================

  return {

    clearSession,

    restoreSession,

    logout,

  }

}