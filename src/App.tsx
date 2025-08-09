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


const AppRoutes = () => {
  return (
    <Routes>
      
      <Route path="/" element={
        <Protect fallback={<Navigate to="sign-in" replace />}>
          <p>Users that are signed-in can see this.</p>
        </Protect>
      } />
      <Route path="sign-in" element={<SignInPage />} />
    </Routes>
  )
}


function App() {

  return (
    <>
      {/* <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>Vite + React + Clerk</h1>
        <div>
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header> */}
      <Router>
        <AppRoutes />
      </Router>
    </>
  )
}

export default App
