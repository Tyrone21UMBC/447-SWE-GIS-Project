// import * as React from "react";
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'
// Each screen is loaded only when its route is visited, so the map page doesn't
// download the PDF libraries and the login page doesn't download ArcGIS
const App = lazy(() => import('./App.tsx'))
const Login = lazy(() => import('./screens/Login.tsx'))
const Register = lazy(() => import('./screens/Register.tsx'))
const Contact = lazy(() => import('./screens/Contact.tsx'))
const Reports = lazy(() => import('./screens/Reports.tsx'))
const Admin = lazy(() => import('./screens/Admin.tsx'))
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:bmpId" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
