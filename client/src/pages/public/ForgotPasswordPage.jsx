import { useState } from "react";
import authApi from "../../api/authApi";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiMail } from "react-icons/hi";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/formatters";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <HiMail className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900">Check Your Email</h2>
        <p className="text-sm text-surface-500 mt-2">We sent a password reset link to <strong>{email}</strong></p>
        <Link to="/login" className="inline-block mt-6 text-sm text-primary-600 font-medium">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-surface-900">Forgot Password</h2>
      <p className="text-sm text-surface-500 mt-1">Enter your email to receive a reset link</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Email Address" type="email" icon={HiMail} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>Send Reset Link</Button>
      </form>
      <Link to="/login" className="block text-sm text-center text-primary-600 font-medium mt-6">Back to Login</Link>
    </div>
  );
}
