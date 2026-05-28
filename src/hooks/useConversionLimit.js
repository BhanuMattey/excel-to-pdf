import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useConversionLimit = () => {
  const { checkAndIncrementConversions } = useAuth()

  const checkLimit = () => {
    if (!checkAndIncrementConversions()) {
      toast.error('Please sign in to continue converting files')
      return false
    }
    return true
  }

  return { checkLimit }
}
