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


const AppRoutes = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <Overview />
          </Protect>
        } />
        <Route path="/transactions" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <Transactions />
          </Protect>
        } />
        <Route path="/budget/year" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <Budget />
          </Protect>
        } />
        <Route path="/budget/heads" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <BudgetHeads />
          </Protect>
        } />
        <Route path="/receipts" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <Receipts />
          </Protect>
        } />
        <Route path="/emails" element={
          <Protect fallback={<Navigate to="sign-in" replace />}>
            <Emails />
          </Protect>
        } />
        <Route path="sign-in" element={<SignInPage />} />
      </Routes>
    </AppLayout>
  )
}


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
