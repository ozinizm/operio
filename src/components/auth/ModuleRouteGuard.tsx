import React from 'react';
import { Link } from 'react-router-dom';
import { useModules } from '../../context/ModuleContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface ModuleRouteGuardProps {
  moduleKey: string | string[];
  children: React.ReactNode;
}

export const ModuleRouteGuard: React.FC<ModuleRouteGuardProps> = ({ moduleKey, children }) => {
  const { isModuleEnabled, loading } = useModules();
  const { role } = useAuth();

  if (loading) return null;

  const keys = Array.isArray(moduleKey) ? moduleKey : [moduleKey];
  const isEnabled = keys.some(key => isModuleEnabled(key));

  if (!isEnabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-jakarta font-bold text-text-high">Modül Aktif Değil</h1>
            <p className="text-text-body">
              Bu modül işletmeniz için aktif değil. Erişim için platform yöneticinizle iletişime geçin.
            </p>
          </div>
          
          {(role === 'admin' || role === 'owner') && (
            <div className="pt-4">
              <Link to="/modules">
                <Button className="w-full">
                  Modüllere Git <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
          
          <Link to="/dashboard" className="block text-sm font-bold text-primary hover:underline pt-2">
            Panale Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
