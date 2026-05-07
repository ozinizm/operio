import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ToastProvider } from '../components/ui/Toast';
import { AuthProvider } from '../context/AuthContext';
import { ModuleProvider } from '../context/ModuleContext';

import { ErrorBoundary } from '../components/shared/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ModuleProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ModuleProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
