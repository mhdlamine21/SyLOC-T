import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#172554',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(15,27,61,.25)',
                borderLeft: '4px solid #c9a15c',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
