import { Navigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

const PrivateRoute = ({ children }) => {
  const { session } = useSession();

  if (!session.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute; 