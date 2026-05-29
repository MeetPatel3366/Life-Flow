import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiLockClosed } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setIsLoading(true);

      await authApi.resetPassword(token, {
        password,
        confirmPassword,
      });

      toast.success("Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-surface-900">Reset Password</h2>
      <p className="text-sm text-surface-500 mt-1">
        Enter your new password
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">

        <Input
          label="New Password"
          type="password"
          icon={HiLockClosed}
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          icon={HiLockClosed}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <p className="text-[11px] text-surface-500 leading-tight">Note: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.</p>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}