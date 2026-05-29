import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { Toaster } from "react-hot-toast";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import ProtectedRoute from "./routes/ProtectedRoute";

import HomePage from "./pages/public/HomePage";
import AboutPage from "./pages/public/AboutPage";
import LoginPage from "./pages/public/LoginPage";
import AdminLoginPage from "./pages/public/AdminLoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import VerifyEmailPage from "./pages/public/VerifyEmailPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";
import SearchBloodPage from "./pages/public/SearchBloodPage";
import ContactPage from "./pages/public/ContactPage";

import DashboardMain from "./pages/dashboard/DashboardMain";
import ProfilePage from "./pages/dashboard/ProfilePage";

import RequestsList from "./pages/dashboard/requests/RequestsList";
import NewRequest from "./pages/dashboard/requests/NewRequest";
import RequestDetails from "./pages/dashboard/requests/RequestDetails";

import ComplaintsList from "./pages/dashboard/complaints/ComplaintsList";
import NewComplaint from "./pages/dashboard/complaints/NewComplaint";
import ComplaintDetails from "./pages/dashboard/complaints/ComplaintDetails";

import DonationsList from "./pages/dashboard/donations/DonationsList";
import NewDonation from "./pages/dashboard/donations/NewDonation";
import DonationDetails from "./pages/dashboard/donations/DonationDetails";

import BloodStockList from "./pages/dashboard/blood-stock/BloodStockList";
import NewBloodStock from "./pages/dashboard/blood-stock/NewBloodStock";

import TransfersList from "./pages/dashboard/transfers/TransfersList";
import TransferDetails from "./pages/dashboard/transfers/TransferDetails";

import HospitalProfile from "./pages/dashboard/hospital/HospitalProfile";
import HospitalsList from "./pages/dashboard/hospital/HospitalsList";
import ContactMessages from "./pages/dashboard/contacts/ContactMessages";
import UsersList from "./pages/dashboard/admin/UsersList";

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder";

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search-blood" element={<SearchBloodPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardMain />} />
              <Route path="profile" element={<ProfilePage />} />
              
              <Route path="requests" element={<RequestsList />} />
              <Route path="requests/new" element={<NewRequest />} />
              <Route path="requests/:id" element={<RequestDetails />} />
              
              <Route path="complaints" element={<ComplaintsList />} />
              <Route path="complaints/new" element={<NewComplaint />} />
              <Route path="complaints/:id" element={<ComplaintDetails />} />

              <Route path="donations" element={<DonationsList />} />
              <Route path="donations/new" element={<NewDonation />} />
              <Route path="donations/:id" element={<DonationDetails />} />

              <Route path="blood-stock" element={<BloodStockList />} />
              <Route path="blood-stock/new" element={<NewBloodStock />} />

              <Route path="transfers" element={<TransfersList />} />
              <Route path="transfers/:id" element={<TransferDetails />} />

              <Route path="hospitals" element={<HospitalsList />} />
              <Route path="hospital-profile" element={<HospitalProfile />} />
              <Route path="users" element={<UsersList />} />
              <Route path="contact-messages" element={<ContactMessages />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  );
}

export default App;