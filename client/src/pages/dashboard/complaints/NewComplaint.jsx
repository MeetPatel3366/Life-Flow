import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import complaintApi from "../../../api/complaintApi";
import hospitalApi from "../../../api/hospitalApi";
import { COMPLAINT_CATEGORIES } from "../../../utils/constants";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import toast from "react-hot-toast";

export default function NewComplaint() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    hospitalApi.getNearbyHospitals().then(res => setHospitals(res.data?.data?.hospitals || [])).catch(() => {});
  }, []);

  const hospitalOptions = hospitals.map(h => ({
    label: `${h.name} (${h.address?.city})`,
    value: h._id
  }));

  const [form, setForm] = useState({
    hospital: "",
    category: "Other",
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((key, value) => {
    switch (key) {
      case "subject":
        if (!value.trim()) return "Subject is required";
        if (value.trim().length < 5) return "Subject must be at least 5 characters";
        if (value.trim().length > 100) return "Subject cannot exceed 100 characters";
        return "";
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 20) return "Description must be at least 20 characters";
        return "";
      case "category":
        if (!value) return "Category is required";
        return "";
      default:
        return "";
    }
  }, []);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setForm(p => ({ ...p, [key]: value }));
    if (touched[key]) {
      setErrors(p => ({ ...p, [key]: validateField(key, value) }));
    }
  };

  const handleBlur = (key) => () => {
    setTouched(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: validateField(key, form[key]) }));
  };

  const validateForm = () => {
    const fields = ["subject", "description", "category"];
    const newErrors = {};
    const newTouched = {};
    fields.forEach(k => {
      newTouched[k] = true;
      const err = validateField(k, form[k]);
      if (err) newErrors[k] = err;
    });
    setTouched(p => ({ ...p, ...newTouched }));
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    try {
      setIsLoading(true);
      await complaintApi.createComplaint(form);
      toast.success("Complaint raised successfully");
      navigate("/dashboard/complaints");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to raise complaint");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Raise Complaint</h1>
        <p className="text-surface-500 text-sm mt-1">Submit feedback or report an issue regarding a hospital.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Hospital (Optional)"
              placeholder="Select Hospital"
              options={hospitalOptions}
              value={form.hospital}
              onChange={handleChange("hospital")}
            />
            <Select
              label="Category *"
              options={COMPLAINT_CATEGORIES}
              value={form.category}
              onChange={handleChange("category")}
              onBlur={handleBlur("category")}
              error={touched.category ? errors.category : ""}
            />
          </div>

          <Input
            label="Subject *"
            placeholder="Brief summary of the issue"
            value={form.subject}
            onChange={handleChange("subject")}
            onBlur={handleBlur("subject")}
            error={touched.subject ? errors.subject : ""}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-surface-700">Detailed Description *</label>
            <textarea
              rows={5}
              placeholder="Please provide as much detail as possible (min 20 characters)..."
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 outline-none transition-all duration-200 ${
                touched.description && errors.description
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-surface-300 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
              value={form.description}
              onChange={handleChange("description")}
              onBlur={handleBlur("description")}
            />
            {touched.description && errors.description && (
              <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>
            )}
            <p className="text-xs text-surface-400 mt-0.5">{form.description.length} characters</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Submit Complaint</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
