import {

  useCallback,

  useState,

} from 'react'

const API_URL =

  'https://kreandoapp.com/api/index.php'

export default function useAuth() {

  const [user, setUser] = useState(null)

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)

  const [authInitializing, setAuthInitializing] = useState(false)

  const [error, setError] = useState('')

  // LIMPIAR SESIÓN PERSISTIDA
  const clearAuthSession = useCallback(() => {

      localStorage.removeItem(

        'access_token'

      )

      localStorage.removeItem(

        'refresh_token'

      )

      localStorage.removeItem(

        'user'

      )

      localStorage.removeItem(

        'business_id'

      )

    }, [])


const restoreSession = useCallback(async () => {

  const refreshToken = localStorage.getItem('refresh_token')

  if (!refreshToken) {

    clearAuthSession()

    setUser(null)

    return {

      success: false,

      status: 'unauthenticated',

    }

  }

  setAuthInitializing(true)

  setError('')

  try {

    const response = await fetch(`${API_URL}?action=refresh`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Accept: 'application/json',

      },

      body: JSON.stringify({

        refresh_token: refreshToken,

      }),

      cache: 'no-store',

    })

    const result = await response.json()

    if (

      response.status === 401 ||

      response.status === 400 ||

      (response.ok && result.success !== true)

    ) {

      clearAuthSession()

      setUser(null)

      return {

        success: false,

        status: 'unauthenticated',

      }

    }

    if (!response.ok) {

      setError('No se pudo comprobar la sesión. Intentá nuevamente.')

      return {

        success: false,

        status: 'error',

      }

    }

    const accessToken = result.data?.access_token

    if (!accessToken) {

      setError('El servidor no devolvió un access token válido.')

      return {

        success: false,

        status: 'error',

      }

    }

    const savedUser = localStorage.getItem('user')

    const userData = savedUser ? JSON.parse(savedUser) : null

    if (!userData) {

      clearAuthSession()

      setUser(null)

      return {

        success: false,

        status: 'unauthenticated',

      }

    }

    localStorage.setItem('access_token', accessToken)

    setUser(userData)

    return {

      success: true,

      status: 'authenticated',

      user: userData,

    }

  } catch (error) {

    console.error('Error recuperando la sesión:', error)

    setError('No se pudo conectar con el servidor. Intentá nuevamente.')

    return {

      success: false,

      status: 'error',

    }

  } finally {

    setAuthInitializing(false)

  }

}, [clearAuthSession])
//=====================================================//LIMPIAR SESIÓN PERSISTIDA//=====================================================
//=====================================================//LOGIN//=====================================================
  const login = useCallback(async () => {

    if (!email || !password) {

      setError(

        'Ingresá email y contraseña.'

      )

      return null

    }

    setLoading(true)

    setError('')
//===================================================//LIMPIAR SESIÓN ANTERIOR//===================================================
    clearAuthSession()

    try {

      const response = await fetch(

        `${API_URL}?action=login`,

        {

          method: 'POST',

          headers: {

            'Content-Type':

              'application/json',

            Accept:

              'application/json',

          },

          body: JSON.stringify({

            email,

            password,

          }),

        }

      )

      const result =

        await response.json()
//=================================================//LOGIN INCORRECTO//=================================================
      if (

        response.status === 401

      ) {

        setError(

          'Email o contraseña incorrectos.'

        )

        return null

      }
//=================================================//ERROR API//=================================================
      if (!result.success) {

        setError(

          result.message ||

          'Email o contraseña incorrectos.'

        )

        return null

      }
//=================================================//DATOS DEVUELTOS POR LA API//=================================================
      const userData =

        result.user || {}

      const businessData =

        result.business || null
//=================================================//ACCESS TOKEN//=================================================
      const accessToken =

        result.access_token || ''
//=================================================//REFRESH TOKEN//=================================================
      const refreshToken =

        result.refresh_token || ''
//=================================================//BUSINESS ID//=================================================
      const businessId =

        businessData?.id || null
//=================================================//VALIDAR ACCESS TOKEN//=================================================
      if (!accessToken) {

        setError(

          'El servidor no devolvió el token de sesión.'

        )

        return null

      }
//=================================================//VALIDAR BUSINESS//=================================================
      if (!businessId) {

        setError(

          'El servidor no devolvió el negocio.'

        )

        return null

      }
//=================================================//GUARDAR ACCESS TOKEN//=================================================
      localStorage.setItem(

        'access_token',

        accessToken

      )
//=================================================//GUARDAR REFRESH TOKEN//=================================================
      if (refreshToken) {

        localStorage.setItem(

          'refresh_token',

          refreshToken

        )

      }
//=================================================//GUARDAR USUARIO//=================================================
      localStorage.setItem(

        'user',

        JSON.stringify({

          ...userData,

          business: businessData,

        })

      )
//=================================================//GUARDAR BUSINESS ID//=================================================
      localStorage.setItem(

        'business_id',

        String(businessId)

      )
//=================================================//ACTUALIZAR ESTADO REACT//=================================================
      setUser({

        ...userData,

        business: businessData,

      })
//=================================================//DEVOLVER RESULTADO//=================================================
      return {

        user: userData,

        business: businessData,

        token: accessToken,

        refreshToken,

        businessId,

      }

    } catch (error) {

      console.error(

        '❌ Error login:',

        error

      )

      setError(

        'No se pudo conectar con la API.'

      )

      return null

    } finally {

      setLoading(false)

    }

  }, [

    email,

    password,

    clearAuthSession,

  ])
//=====================================================//RECUPERAR CONTRASEÑA//=====================================================
  const forgotPassword =

    useCallback(async (

      emailToReset

    ) => {

      const normalizedEmail =

        emailToReset?.trim().toLowerCase()
//=================================================//VALIDAR EMAIL//=================================================
      if (!normalizedEmail) {

        setError(

          'Ingresá tu email.'

        )

        return null

      }
//=================================================//VALIDAR FORMATO//=================================================
      if (

        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/

          .test(normalizedEmail)

      ) {

        setError(

          'Ingresá un email válido.'

        )

        return null

      }

      setLoading(true)

      setError('')

      try {

        const response =

          await fetch(

            `${API_URL}?action=forgot-password`,

            {

              method: 'POST',

              headers: {

                'Content-Type':

                  'application/json',

                Accept:

                  'application/json',

              },

              body: JSON.stringify({

                email: normalizedEmail,

              }),

            }

          )

        const result =

          await response.json()
//=================================================//ERROR API//=================================================
        if (!result.success) {

          setError(

            result.message ||

            'No se pudo procesar la solicitud.'

          )

          return null

        }
//=================================================//ÉXITO//=================================================
        return {

          success: true,

          email: normalizedEmail,

        }

      } catch (error) {

        console.error(

          '❌ Error recuperar contraseña:',

          error

        )

        setError(

          'No se pudo conectar con la API.'

        )

        return null

      } finally {

        setLoading(false)

      }

    }, [])
//=====================================================//VERIFICAR CÓDIGO DE RECUPERACIÓN//=====================================================
  const verifyResetCode =

    useCallback(async (

      emailToVerify,

      code

    ) => {

      const normalizedEmail =

        emailToVerify?.trim().toLowerCase()

      const normalizedCode =

        code?.trim()
//=================================================//VALIDAR EMAIL//=================================================
      if (!normalizedEmail) {

        setError(

          'El email es obligatorio.'

        )

        return null

      }
//=================================================//VALIDAR CÓDIGO//=================================================
      if (

        !/^\d{4}$/.test(

          normalizedCode

        )

      ) {

        setError(

          'Ingresá un código de 4 dígitos.'

        )

        return null

      }

      setLoading(true)

      setError('')

      try {

        const response =

          await fetch(

            `${API_URL}?action=verify-reset-code`,

            {

              method: 'POST',

              headers: {

                'Content-Type':

                  'application/json',

                Accept:

                  'application/json',

              },

              body: JSON.stringify({

                email:

                  normalizedEmail,

                code:

                  normalizedCode,

              }),

            }

          )

        const result =

          await response.json()
//=================================================//ERROR API//=================================================
        if (!result.success) {

          setError(

            result.message ||

            'El código no es válido.'

          )

          return null

        }
//=================================================//VALIDAR RESET TOKEN//=================================================
        if (

          !result.reset_token

        ) {

          setError(

            'La API no devolvió el token de recuperación.'

          )

          return null

        }
//=================================================//ÉXITO//=================================================
        return {

          success: true,

          resetToken:

            result.reset_token,

        }

      } catch (error) {

        console.error(

          '❌ Error verificar código:',

          error

        )

        setError(

          'No se pudo conectar con la API.'

        )

        return null

      } finally {

        setLoading(false)

      }

    }, [])
//=====================================================//RESTABLECER CONTRASEÑA//=====================================================
  const resetPassword =

    useCallback(async (

      resetToken,

      newPassword

    ) => {

      const normalizedToken =

        resetToken?.trim()
//=================================================//VALIDAR TOKEN//=================================================
      if (!normalizedToken) {

        setError(

          'El token de recuperación es obligatorio.'

        )

        return null

      }
//=================================================//VALIDAR CONTRASEÑA//=================================================
      if (

        !newPassword ||

        newPassword.length < 8

      ) {

        setError(

          'La contraseña debe tener al menos 8 caracteres.'

        )

        return null

      }

      setLoading(true)

      setError('')

      try {

        const response =

          await fetch(

            `${API_URL}?action=reset-password`,

            {

              method: 'POST',

              headers: {

                'Content-Type':

                  'application/json',

                Accept:

                  'application/json',

              },

              body: JSON.stringify({

                reset_token:

                  normalizedToken,

                new_password:

                  newPassword,

              }),

            }

          )

        const result =

          await response.json()
//=================================================//ERROR API//=================================================
        if (!result.success) {

          setError(

            result.message ||

            'No se pudo actualizar la contraseña.'

          )

          return null

        }
//=================================================//ÉXITO//=================================================
        return {

          success: true,

        }

      } catch (error) {

        console.error(

          '❌ Error restablecer contraseña:',

          error

        )

        setError(

          'No se pudo conectar con la API.'

        )

        return null

      } finally {

        setLoading(false)

      }

    }, [])
//=====================================================//RETURN//=====================================================
  return {

    user,

    setUser,

    email,

    setEmail,

    password,

    setPassword,

    loading,

    error,

    setError,

    login,

    forgotPassword,

    verifyResetCode,

    resetPassword,

    clearAuthSession,

    authInitializing,

    restoreSession,

  }

}
