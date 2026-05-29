import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiMail, HiLockClosed, HiShieldCheck } from "react-icons/hi";
import toast from "react-hot-toast";
import { loginUser } from "../../store/authSlice";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: isLoading } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(loginUser(form)).unwrap();
      if (res.user?.role !== "admin") {
         toast.error("Unauthorized request. Admin access only.");
         navigate("/dashboard");
         return;
      }
      toast.success("Admin Login successful!");
      navigate("/dashboard");
    } catch (err) {
      if (typeof err === "string" && err.toLowerCase().includes("invalid email or password")) {
        toast.error("Invalid Credentials");
      } else {
        toast.error(err || "Login failed");
      }
    }
  };

  return (
    <div className="animate-fade-in flex flex-col items-center">
      <div className="w-16 h-16 bg-surface-900 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-lg">
        <HiShieldCheck className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-surface-900 text-center">Admin Portal</h2>
      <p className="text-sm text-surface-500 mt-1 text-center">Secure access for system administrators</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 w-full">
        <Input
          label="Admin Email Address"
          type="email"
          icon={HiMail}
          placeholder="admin@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Secure Password"
          type="password"
          icon={HiLockClosed}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <Button type="submit" className="w-full bg-surface-900 hover:bg-black text-white mt-4" size="lg" isLoading={isLoading}>
          Authenticate
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-surface-200 w-full text-center">
        <p className="text-xs text-surface-400">
          This portal is strictly restricted to authorized administrative personnel. 
          All access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
