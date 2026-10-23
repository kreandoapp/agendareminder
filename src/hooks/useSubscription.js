import { useState, useCallback } from 'react'

const SUBSCRIPTION_URL =
  'https://kreandoapp.com/api/index.php?action=subscription'

export default function useSubscription() {
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false)

  const checkSubscription = useCallback(async (user) => {
    console.log('[SUBSCRIPTION] Usuario:', user)
    console.log('[SUBSCRIPTION] Rol:', user?.role)

    if (user?.role === 'admin') {
      console.log('[SUBSCRIPTION] Administrador: acceso permitido')
      setHasSubscriptionAccess(true)
      setSubscriptionChecked(true)
      return true
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      console.error('[SUBSCRIPTION] No hay token de acceso')
      setHasSubscriptionAccess(false)
      setSubscriptionChecked(true)
      return false
    }

    try {
      setSubscriptionChecked(false)

      const response = await fetch(SUBSCRIPTION_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      })

      const result = await response.json()

      console.log('[SUBSCRIPTION] HTTP:', response.status)
      console.log('[SUBSCRIPTION] Respuesta API:', result)

      const hasAccess =
        response.ok &&
        result.success === true &&
        result.has_access === true

      setHasSubscriptionAccess(hasAccess)
      setSubscriptionChecked(true)

      console.log('[SUBSCRIPTION] Acceso final:', hasAccess)

      return hasAccess
    } catch (error) {
      console.error('[SUBSCRIPTION] Error:', error)

      setHasSubscriptionAccess(false)
      setSubscriptionChecked(true)

      return false
    }
  }, [])

  return {
    subscriptionChecked,
    hasSubscriptionAccess,
    checkSubscription,
  }
}