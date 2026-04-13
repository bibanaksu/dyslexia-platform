// components/RouteGuards.jsx
import { Navigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../services/api';

/**
 * PrivateRoute - Protects routes that require authentication (any role)
 * If not logged in → redirects to /auth
 */
export function PrivateRoute({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/auth" replace />;
    }
    return children;
}

/**
 * RoleRoute - Protects routes that require a specific role
 * - therapist: can access /dashboard
 * - parent: can access /parent-dashboard
 */
export function RoleRoute({ children, allowedRole }) {
    if (!isAuthenticated()) {
        return <Navigate to="/auth" replace />;
    }

    const user = getCurrentUser();

    if (user.role !== allowedRole) {
        const redirect = user.role === 'therapist' ? '/dashboard' : '/parent-dashboard';
        return <Navigate to={redirect} replace />;
    }

    return children;
}

/**
 * PublicRoute - For auth pages (login/register)
 * ALWAYS shows the auth page - NO REDIRECT
 */
export function PublicRoute({ children }) {
    // Always show the login/signup page
    // Users can access /auth even if already logged in
    return children;
}