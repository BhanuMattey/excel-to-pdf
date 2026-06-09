import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardPage from './DashboardPage'

const ProtectedDashboardRoute = () => (
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
)

export default ProtectedDashboardRoute
