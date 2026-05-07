import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../ui/States';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredSuperAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles, requiredSuperAdmin }) => {
  const { isAuthenticated, isLoading, role, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Oturum kontrol ediliyor..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin Check
  if (requiredSuperAdmin && !user?.is_super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-jakarta font-bold text-text-high">Platform Yetkisi Gerekli</h2>
            <p className="text-sm text-text-body">Bu alan sadece platform yöneticilerine açıktır.</p>
          </div>
          <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>Dashboard'a Dön</Button>
        </Card>
      </div>
    );
  }

  // Role Check (Only if not super admin, or if role is explicitly required)
  if (requiredRoles && role && !requiredRoles.includes(role) && !user?.is_super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-jakarta font-bold text-text-high">Yetkisiz Erişim</h2>
            <p className="text-sm text-text-body">Bu alan için yetkiniz bulunmuyor. Lütfen yöneticinizle iletişime geçin.</p>
          </div>
          <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>Dashboard'a Dön</Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
