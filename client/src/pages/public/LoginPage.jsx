import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiMail, HiLockClosed } from "react-icons/hi";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/formatters";
import { loginUser, googleLogin } from "../../store/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: isLoading } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(form)).unwrap();
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      if (typeof err === "string" && err.toLowerCase().includes("invalid email or password")) {
        toast.error("Invalid Credentials");
      } else {
        toast.error(err || "Login failed");
      }
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      await dispatch(googleLogin({ credential: response.credential })).unwrap();
      toast.success("Google login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err || "Google login failed");
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
      <p className="text-sm text-surface-500 mt-1">Sign in to your Life Flow account</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={HiMail}
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          icon={HiLockClosed}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="text-sm text-center text-surface-500 mt-8">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
          Create account
        </Link>
      </p>
    </div>
  );
}
