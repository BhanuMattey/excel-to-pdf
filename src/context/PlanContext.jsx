import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const PlanContext = createContext({})

export const usePlan = () => {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider')
  }
  return context
}

export const PlanProvider = ({ children }) => {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState('free') // 'free', 'pro', 'team'
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly', 'yearly'

  // Load plan from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedPlan = localStorage.getItem(`plan_${user.id}`)
      if (savedPlan) {
        setCurrentPlan(savedPlan)
      }
    }
  }, [user])

  const upgradePlan = (plan) => {
    setCurrentPlan(plan)
    if (user) {
      localStorage.setItem(`plan_${user.id}`, plan)
    }
  }

  const getPlanDetails = (plan) => {
    const plans = {
      free: {
        name: 'Early Access',
        price: { monthly: 0, yearly: 0 },
        features: [
          'First 500 Users Only',
          '50 pages/month',
          'Basic OCR Engine',
          'Community Support',
        ],
      },
      pro: {
        name: 'Professional',
        price: { monthly: 12, yearly: 115 },
        features: [
          'Unlimited pages',
          'Advanced AI Table Recognition',
          'Priority Email Support',
          'No watermarks',
        ],
      },
      team: {
        name: 'Team',
        price: { monthly: 29, yearly: 278 },
        features: [
          '5 User seats included',
          'Full API Access',
          'Admin Dashboard',
          'SSO Integration',
        ],
      },
    }
    return plans[plan] || plans.free
  }

  const value = {
    currentPlan,
    billingCycle,
    setBillingCycle,
    upgradePlan,
    getPlanDetails,
    isPro: currentPlan === 'pro' || currentPlan === 'team',
    isTeam: currentPlan === 'team',
  }

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export default PlanContext
