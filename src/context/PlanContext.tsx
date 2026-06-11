import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { profileService } from '../services/db'

type Plan = 'free' | 'pro'
type BillingCycle = 'monthly' | 'yearly'

export interface PlanProfile {
  plan: Plan
  planId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  renewalDate: string | null
}

interface PlanContextValue {
  currentPlan: Plan
  planProfile: PlanProfile | null
  billingCycle: BillingCycle
  setBillingCycle: (cycle: BillingCycle) => void
  upgradePlan: (plan: Plan, profile?: Partial<PlanProfile>) => void
  isPro: boolean
  planLoading: boolean
  // False until auth has settled AND the billing profile fetch finished.
  // While false, isPro is not trustworthy — don't enforce free-plan limits yet.
  planResolved: boolean
  refreshPlan: () => Promise<void>
}

const PlanContext = createContext<PlanContextValue | null>(null)

export const usePlan = (): PlanContextValue => {
  const context = useContext(PlanContext)
  if (!context) throw new Error('usePlan must be used within a PlanProvider')
  return context
}

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [planProfile, setPlanProfile] = useState<PlanProfile | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [planLoading, setPlanLoading] = useState(false)
  const [planResolved, setPlanResolved] = useState(false)

  const fetchPlan = useCallback(async (userId: string, email: string) => {
    setPlanLoading(true)
    try {
      const data = await profileService.getBillingProfile(userId, email)
      const p = data.profile

      // Pro = either profiles.plan === 'pro' OR there's a paid payment in the payments table
      const hasPaidPayment = data.hasPaidPayment === true
      const planFromPayment = data.latestPaidPayment?.plan_id
      const planFromProfile = p?.plan

      const isPaidUser = hasPaidPayment || planFromProfile === 'pro'
      const plan: Plan = isPaidUser ? 'pro' : 'free'

      // Use planId from profile, or fall back to latest paid payment's plan_id
      const resolvedPlanId = p?.planId ?? planFromPayment ?? null

      setCurrentPlan(plan)
      setPlanProfile({
        plan,
        planId: resolvedPlanId,
        subscriptionId: p?.subscriptionId ?? null,
        subscriptionStatus: p?.subscriptionStatus ?? (isPaidUser ? 'active' : null),
        renewalDate: p?.renewalDate ?? null,
      })
      if (resolvedPlanId?.includes('yearly')) setBillingCycle('yearly')
      else if (resolvedPlanId?.includes('monthly')) setBillingCycle('monthly')
    } catch {
      // non-fatal — keep free
    } finally {
      setPlanLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) {
      setPlanResolved(false)
      return
    }
    if (user?.id && user?.email) {
      setPlanResolved(false)
      // fetchPlan never rejects (errors are swallowed inside), so this always resolves
      fetchPlan(user.id, user.email).then(() => setPlanResolved(true))
    } else {
      setCurrentPlan('free')
      setPlanProfile(null)
      setPlanResolved(true)
    }
  }, [authLoading, user?.id, user?.email, fetchPlan])

  const upgradePlan = (plan: Plan, profile?: Partial<PlanProfile>) => {
    setCurrentPlan(plan)
    setPlanProfile(prev => ({
      plan,
      planId: profile?.planId ?? prev?.planId ?? null,
      subscriptionId: profile?.subscriptionId ?? prev?.subscriptionId ?? null,
      subscriptionStatus: profile?.subscriptionStatus ?? (plan === 'pro' ? 'active' : prev?.subscriptionStatus ?? null),
      renewalDate: profile?.renewalDate ?? prev?.renewalDate ?? null,
    }))
  }

  const refreshPlan = async () => {
    if (user?.id && user?.email) await fetchPlan(user.id, user.email)
  }

  return (
    <PlanContext.Provider value={{
      currentPlan,
      planProfile,
      billingCycle,
      setBillingCycle,
      upgradePlan,
      isPro: currentPlan === 'pro',
      planLoading,
      planResolved,
      refreshPlan,
    }}>
      {children}
    </PlanContext.Provider>
  )
}

export default PlanContext
