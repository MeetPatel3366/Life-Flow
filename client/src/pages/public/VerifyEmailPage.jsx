import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authApi from "../../api/authApi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/formatters";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await authApi.verifyOtp({ email, otp });
      toast.success("Email verified! You can now login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authApi.resendOtp({ email });
      toast.success("OTP resent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-surface-900">Verify Email</h2>
      <p className="text-sm text-surface-500 mt-1">We sent a verification code to <span className="font-medium text-surface-700">{email}</span></p>
      <form onSubmit={handleVerify} className="mt-8 space-y-4">
        <Input label="OTP Code" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>Verify Email</Button>
      </form>
      <button onClick={handleResend} disabled={resending} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-4 block mx-auto cursor-pointer disabled:opacity-50">
        {resending ? "Sending..." : "Resend OTP"}
      </button>
    </div>
  );
}
