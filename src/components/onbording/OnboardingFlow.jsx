import Step1Location from '../../pages/onboarding/steps/Step1Location'
import Step2Hours from '../../pages/onboarding/steps/Step2Hours'
import Step3Service from '../../pages/onboarding/steps/Step3Service'
import Step4Employee from '../../pages/onboarding/steps/Step4Employee'
import Step5WhatsApp from '../../pages/onboarding/steps/Step5WhatsApp'

function OnboardingFlow({
  onboardingStep,
  refreshOnboardingStatus,
  clearSession,
  setOnboardingCompleted,
  setOnboardingStep,
  setCurrentPage,
  checkWhatsAppStatus,
}) {
  const handleSaved = async () => {
    await refreshOnboardingStatus()
  }

  const handleNext = async () => {
    await refreshOnboardingStatus()
  }

  switch (Number(onboardingStep)) {
    case 1:
      return (
        <Step1Location
          onSaved={handleSaved}
          onNext={handleNext}
          onSessionExpired={clearSession}
        />
      )

    case 2:
      return (
        <Step2Hours
          onSaved={handleSaved}
          onNext={handleNext}
          onSessionExpired={clearSession}
        />
      )

    case 3:
      return (
        <Step3Service
          onSaved={handleSaved}
          onNext={handleNext}
          onSessionExpired={clearSession}
        />
      )

    case 4:
      return (
        <Step4Employee
          onSaved={handleSaved}
          onNext={handleNext}
          onSessionExpired={clearSession}
        />
      )

    case 5:
      return (
        <Step5WhatsApp
          onConnected={async (result) => {
            console.log(
              '🟢 WhatsApp conectado durante onboarding:',
              result
            )

            if (result?.completed === true) {
              setOnboardingCompleted(true)
              setOnboardingStep(5)
              setCurrentPage('home')
              await checkWhatsAppStatus()
              return
            }

            await checkWhatsAppStatus()
            await refreshOnboardingStatus()
          }}
          onSessionExpired={clearSession}
        />
      )

    default:
      console.warn(
        '⚠️ Paso de onboarding inválido:',
        onboardingStep
      )
      setOnboardingStep(1)
      return null
  }
}

export default OnboardingFlow
