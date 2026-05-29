import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { HiUser, HiMail, HiLockClosed, HiPhone } from "react-icons/hi";
import { BLOOD_GROUPS } from "../../utils/constants";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/formatters";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmpassword: "",
    role: "donor", bloodGroup: "", gender: "", age: "", weight: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((key, value, currentForm) => {
    const f = { ...currentForm, [key]: value };

    switch (key) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 3) return "Name must be at least 3 characters";
        if (value.trim().length > 50) return "Name must be less than 50 characters";
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        if (!EMAIL_REGEX.test(value)) return "Invalid email format";
        return "";

      case "phone":
        if (!value) return "Phone number is required";
        if (!PHONE_REGEX.test(value)) return "Phone number must be exactly 10 digits";
        return "";

      case "password":
        if (!value) return "Password is required";
        if (!PASSWORD_REGEX.test(value))
          return "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";
        return "";

      case "confirmpassword":
        if (!value) return "Confirm password is required";
        if (value !== f.password) return "Passwords do not match";
        return "";

      case "gender":
        if (!value) return "Gender is required";
        return "";

      case "bloodGroup":
        if ((f.role === "donor" || f.role === "patient") && !value)
          return "Blood group is required";
        return "";

      case "age":
        if (f.role === "donor" && value && (Number(value) < 18 || Number(value) > 65))
          return "Age must be between 18 and 65";
        return "";

      case "weight":
        if (f.role === "donor") {
          if (!value) return "Weight is required for donors";
          if (Number(value) < 50) return "Minimum weight is 50kg";
        }
        return "";

      default:
        return "";
    }
  }, []);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);

    if (touched[key]) {
      const error = validateField(key, value, updatedForm);
      setErrors(prev => ({ ...prev, [key]: error }));
    }

    if (key === "password" && touched.confirmpassword) {
      const cpError = validateField("confirmpassword", updatedForm.confirmpassword, updatedForm);
      setErrors(prev => ({ ...prev, confirmpassword: cpError }));
    }

    if (key === "role") {
      const bgError = validateField("bloodGroup", updatedForm.bloodGroup, updatedForm);
      const wtError = validateField("weight", updatedForm.weight, updatedForm);
      const ageError = validateField("age", updatedForm.age, updatedForm);
      setErrors(prev => ({
        ...prev,
        bloodGroup: touched.bloodGroup ? bgError : "",
        weight: touched.weight ? wtError : "",
        age: touched.age ? ageError : "",
      }));
    }
  };

  const handleBlur = (key) => () => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const error = validateField(key, form[key], form);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const validateForm = () => {
    const allFields = ["name", "email", "phone", "password", "confirmpassword", "gender"];
    if (form.role === "donor" || form.role === "patient") allFields.push("bloodGroup");
    if (form.role === "donor") allFields.push("age", "weight");

    const newErrors = {};
    const newTouched = {};
    allFields.forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, form[key], form);
      if (error) newErrors[key] = error;
    });

    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    const allFields = ["name", "email", "phone", "password", "confirmpassword", "gender"];
    if (form.role === "donor" || form.role === "patient") allFields.push("bloodGroup");
    if (form.role === "donor") allFields.push("age", "weight");

    for (const key of allFields) {
      if (!form[key] || validateField(key, form[key], form) !== "") {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      setIsLoading(true);
      const payload = { ...form };

      if (!payload.bloodGroup) delete payload.bloodGroup;
      
      if (payload.age) payload.age = Number(payload.age);
      else delete payload.age;
      
      if (payload.weight) payload.weight = Number(payload.weight);
      else delete payload.weight;

      await authApi.register(payload);
      toast.success("Registration successful! Please verify your email.");
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-surface-900">Create Account</h2>
      <p className="text-sm text-surface-500 mt-1">Join Life Flow and start saving lives</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
        <Input label="Full Name" icon={HiUser} placeholder="John Doe" value={form.name} onChange={handleChange("name")} onBlur={handleBlur("name")} error={touched.name ? errors.name : ""} />
        <Input label="Email" type="email" icon={HiMail} placeholder="you@example.com" value={form.email} onChange={handleChange("email")} onBlur={handleBlur("email")} error={touched.email ? errors.email : ""} />
        <Input label="Phone Number" type="tel" maxLength={10} icon={HiPhone} placeholder="9876543210" value={form.phone} onChange={(e) => handleChange("phone")({ target: { value: e.target.value.replace(/\D/g, "") }})} onBlur={handleBlur("phone")} error={touched.phone ? errors.phone : ""} />
        

        <div className="grid grid-cols-2 gap-3">
          <Input label="Password" type="password" icon={HiLockClosed} placeholder="Password" value={form.password} onChange={handleChange("password")} onBlur={handleBlur("password")} error={touched.password ? errors.password : ""} />
          <Input label="Confirm Password" type="password" icon={HiLockClosed} placeholder="Confirm" value={form.confirmpassword} onChange={handleChange("confirmpassword")} onBlur={handleBlur("confirmpassword")} error={touched.confirmpassword ? errors.confirmpassword : ""} />
        </div>
        <p className="text-[11px] text-surface-500 mt-1 leading-tight">Note: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.</p>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" options={[
            { value: "donor", label: "Donor" },
            { value: "patient", label: "Patient" },
            { value: "hospital", label: "Hospital" },
          ]} value={form.role} onChange={handleChange("role")} error={errors.role} />
          <Select label="Gender" placeholder="Select" options={["Male", "Female", "Other"]} value={form.gender} onChange={handleChange("gender")} onBlur={handleBlur("gender")} error={touched.gender ? errors.gender : ""} />
        </div>

        {(form.role === "donor" || form.role === "patient") && (
          <Select label="Blood Group" placeholder="Select blood group" options={BLOOD_GROUPS} value={form.bloodGroup} onChange={handleChange("bloodGroup")} onBlur={handleBlur("bloodGroup")} error={touched.bloodGroup ? errors.bloodGroup : ""} />
        )}

        {form.role === "donor" && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" placeholder="18-65" value={form.age} onChange={handleChange("age")} onBlur={handleBlur("age")} error={touched.age ? errors.age : ""} />
            <Input label="Weight (kg)" type="number" placeholder="Min 50" value={form.weight} onChange={handleChange("weight")} onBlur={handleBlur("weight")} error={touched.weight ? errors.weight : ""} />
          </div>
        )}

        <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading} disabled={!isFormValid()}>Create Account</Button>
      </form>

      <p className="text-sm text-center text-surface-500 mt-6">
        Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Sign In</Link>
      </p>
    </div>
  );
}
