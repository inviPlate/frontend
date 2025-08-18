import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton, Protect
} from '@clerk/clerk-react'
import SignInPage from './pages/signin'
import Overview from './pages/overview'
import Transactions from './pages/transactions'
import Budget from './pages/budget'
import { BudgetHeads } from './pages/budgetHeads'
import Receipts from './pages/receipts'
import Emails from './pages/emails'
import { AppLayout } from './components/AppLayout';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { OffertoryModal } from './components/OffertoryModal';
import { OffertoryModalProvider, useOffertoryModal } from './context/OffertoryModalContext';


const AppRoutes = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/' } }} replace />}>
            <Overview />
          </Protect>
        } />
        <Route path="/transactions" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/transactions' } }} replace />}>
            <Transactions />
          </Protect>
        } />
        <Route path="/budget/year" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/budget/year' } }} replace />}>
            <Budget />
          </Protect>
        } />
        <Route path="/budget/heads" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/budget/heads' } }} replace />}>
            <BudgetHeads />
          </Protect>
        } />
        <Route path="/receipts" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/receipts' } }} replace />}>
            <Receipts />
          </Protect>
        } />
        <Route path="/emails" element={
          <Protect fallback={<Navigate to="/sign-in" state={{ from: { pathname: '/emails' } }} replace />}>
            <Emails />
          </Protect>
        } />
        <Route path="/sign-in" element={<SignInPage />} />
      </Routes>
    </AppLayout>
  )
}


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OffertoryModalProvider>
          <Router>
            <AppRoutes />
            <OffertoryModalWrapper />
          </Router>
        </OffertoryModalProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

// Separate component to use the context hook
function OffertoryModalWrapper() {
  const { isOpen, closeModal } = useOffertoryModal();

  return (
    <OffertoryModal
      isOpen={isOpen}
      onClose={closeModal}
      onSave={(data) => {
        console.log('Offertory data saved:', data);
        // Here you can add API call to save the data
        closeModal();
      }}
    />
  );
}

export default App
