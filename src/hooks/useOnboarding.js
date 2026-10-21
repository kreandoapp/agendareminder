import { useCallback, useState } from 'react'

const API_URL =
  'https://kreandoapp.com/api/index.php'

export default function useOnboarding({
  onSessionExpired,
  onIncomplete,
} = {}) {
  const [
    onboardingCompleted,
    setOnboardingCompleted,
  ] = useState(false)

  const [
    onboardingStep,
    setOnboardingStep,
  ] = useState(1)

  const checkStatus = useCallback(
    async () => {
      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {
        return null
      }

      try {
        const response =
          await fetch(
            `${API_URL}?action=onboarding-status`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  'application/json',
              },
              cache: 'no-store',
            }
          )

        if (
          response.status === 401
        ) {
          onSessionExpired?.()
          return null
        }

        const result =
          await response.json()

        if (
          !response.ok ||
          !result.success
        ) {
          console.error(
            '❌ Error consultando onboarding:',
            result.message ||
              response.status
          )
          return null
        }

        const data =
          result.data || {}

        const completed =
          data.completed === true

        const step =
          Number(
            data.current_step
          ) || 1

        setOnboardingCompleted(
          completed
        )

        setOnboardingStep(step)

        if (!completed) {
          onIncomplete?.(data)
        }

        return data
      } catch (error) {
        console.error(
          '❌ Error consultando estado del onboarding:',
          error
        )

        return null
      }
    },
    [
      onSessionExpired,
      onIncomplete,
    ]
  )

  const refreshStatus =
    useCallback(
      async () => {
        const status =
          await checkStatus()

        if (!status) {
          return false
        }

        if (
          status.completed === true
        ) {
          setOnboardingCompleted(
            true
          )

          setOnboardingStep(5)

          return true
        }

        setOnboardingCompleted(
          false
        )

        setOnboardingStep(
          Number(
            status.current_step
          ) || 1
        )

        onIncomplete?.(status)

        return false
      },
      [
        checkStatus,
        onIncomplete,
      ]
    )

  const reset = useCallback(
    (step = 1) => {
      setOnboardingCompleted(
        false
      )

      setOnboardingStep(step)
    },
    []
  )

  const complete = useCallback(
    () => {
      setOnboardingCompleted(
        true
      )

      setOnboardingStep(5)
    },
    []
  )

  return {
    onboardingCompleted,
    onboardingStep,
    setOnboardingCompleted,
    setOnboardingStep,
    checkStatus,
    refreshStatus,
    reset,
    complete,
  }
}