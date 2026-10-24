import { useState, useCallback } from 'react'

const API_URL = 'https://kreandoapp.com/api/index.php'

const SUBSCRIPTION_URL = `${API_URL}?action=subscription`
const TRIAL_STATUS_URL = `${API_URL}?action=trial-status`

export default function useSubscription() {
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [hasSubscription, setHasSubscription] = useState(false)

  const checkSubscription = useCallback(async (user) => {
    console.log('[ACCESS] Checking access for user:', user)

    if (user?.role === 'admin') {
      console.log('[ACCESS] Admin access granted')

      setHasSubscriptionAccess(true)
      setHasSubscription(true)
      setSubscriptionChecked(true)

      return true
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      console.error('[ACCESS] No access token found')

      setHasSubscriptionAccess(false)
      setHasSubscription(false)
      setSubscription(null)
      setSubscriptionChecked(true)

      return false
    }

    setSubscriptionChecked(false)

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    }

    try {
      // 1. Check the paid subscription first.
      const subscriptionResponse = await fetch(SUBSCRIPTION_URL, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })

      const subscriptionResult = await subscriptionResponse.json()

      console.log('[ACCESS] Subscription response:', subscriptionResult)

      const currentSubscription = subscriptionResult.subscription ?? null

      const paymentPending =
        currentSubscription?.status === 'past_due' ||
        currentSubscription?.status === 'unpaid'

      // Do not bypass an existing payment problem with a trial.
      if (paymentPending) {
        console.log('[ACCESS] Payment is pending')

        setHasSubscriptionAccess(false)
        setHasSubscription(true)
        setSubscription(currentSubscription)
        setSubscriptionChecked(true)

        return false
      }

      const hasPaidAccess =
        subscriptionResponse.ok &&
        subscriptionResult.success === true &&
        subscriptionResult.has_access === true

      if (hasPaidAccess) {
        console.log('[ACCESS] Paid subscription access granted')

        setHasSubscriptionAccess(true)
        setHasSubscription(true)
        setSubscription(currentSubscription)
        setSubscriptionChecked(true)

        return true
      }

      // 2. If there is no paid access, check the free trial.
      const trialResponse = await fetch(TRIAL_STATUS_URL, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })

      const trialResult = await trialResponse.json()

      console.log('[ACCESS] Trial response:', trialResult)

      const hasActiveTrial =
        trialResponse.ok &&
        trialResult.success === true &&
        trialResult.trial_active === true &&
        trialResult.trial?.status === 'active'

      if (hasActiveTrial) {
        console.log(
          '[ACCESS] Trial access granted. Days remaining:',
          trialResult.days_remaining
        )

        const trialSubscription = {
          ...trialResult.trial,
          type: 'trial',
          days_remaining: trialResult.days_remaining,
        }

        setHasSubscriptionAccess(true)
        setHasSubscription(true)
        setSubscription(trialSubscription)
        setSubscriptionChecked(true)

        return true
      }

      // 3. Neither paid subscription nor active trial grants access.
      console.log('[ACCESS] No active subscription or trial')

      setHasSubscriptionAccess(false)
      setHasSubscription(currentSubscription !== null)
      setSubscription(currentSubscription)
      setSubscriptionChecked(true)

      return false
    } catch (error) {
      console.error('[ACCESS] Error checking access:', error)

      setHasSubscriptionAccess(false)
      setHasSubscription(false)
      setSubscription(null)
      setSubscriptionChecked(true)

      return false
    }
  }, [])

  return {
    subscriptionChecked,
    hasSubscriptionAccess,
    hasSubscription,
    subscription,
    checkSubscription,
  }
}