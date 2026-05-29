import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import requestApi from "../../../api/requestApi";
import { BLOOD_GROUPS, COMPONENT_TYPES, URGENCY_LEVELS } from "../../../utils/constants";
import hospitalApi from "../../../api/hospitalApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function NewRequest() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    bloodGroup: "",
    componentType: "Whole Blood",
    unitsRequired: 1,
    urgency: "Normal",
    hospital: "",
    diagnosis: "",
    requiredDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await hospitalApi.getHospitals({ limit: 100 });
        setHospitals(res.data?.data?.hospitals || []);
      } catch (err) {
        toast.error("Failed to fetch hospitals list");
      }
    };
    fetchHospitals();
  }, []);

  const validateField = useCallback((key, value) => {
    switch (key) {
      case "bloodGroup":
        if (!value) return "Blood group is required";
        return "";
      case "unitsRequired":
        if (!value || Number(value) < 1) return "At least 1 unit is required";
        if (Number(value) > 10) return "Maximum 10 units per request";
        return "";
      case "hospital":
        if (!value) return "Please select a hospital";
        return "";
      case "requiredDate": {
        if (!value) return "Requirement date is required";
        const selected = new Date(value);
        selected.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) return "Date cannot be in the past";
        return "";
      }
      case "diagnosis":
        if (!value.trim()) return "Diagnosis is required";
        if (value.trim().length < 5) return "Please provide more details";
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
    const fields = ["bloodGroup", "unitsRequired", "hospital", "requiredDate", "diagnosis"];
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
      const payload = {
        ...form,
        unitsRequired: Number(form.unitsRequired),
        requiredDate: new Date(form.requiredDate).toISOString(),
      };
      await requestApi.createRequest(payload);
      toast.success("Blood request created successfully!");
      navigate("/dashboard/requests");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create request");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">New Blood Request</h1>
        <p className="text-surface-500 text-sm mt-1">Submit a request for blood units to nearby hospitals.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Blood Group *" placeholder="Select Group" options={BLOOD_GROUPS} value={form.bloodGroup} onChange={handleChange("bloodGroup")} onBlur={handleBlur("bloodGroup")} error={touched.bloodGroup ? errors.bloodGroup : ""} />
            <Select label="Component Type" options={COMPONENT_TYPES} value={form.componentType} onChange={handleChange("componentType")} />
            <Input label="Units Required *" type="number" min="1" max="10" value={form.unitsRequired} onChange={handleChange("unitsRequired")} onBlur={handleBlur("unitsRequired")} error={touched.unitsRequired ? errors.unitsRequired : ""} />
            <Select label="Urgency Level" options={URGENCY_LEVELS} value={form.urgency} onChange={handleChange("urgency")} />
            <Select 
              label="Admitted Hospital *" 
              placeholder="Select Hospital" 
              options={hospitals.map(h => ({ label: h.name, value: h._id }))} 
              value={form.hospital} 
              onChange={handleChange("hospital")} 
              onBlur={handleBlur("hospital")} 
              error={touched.hospital ? errors.hospital : ""} 
            />
            <Input label="Requirement Date *" type="date" min={today} value={form.requiredDate} onChange={handleChange("requiredDate")} onBlur={handleBlur("requiredDate")} error={touched.requiredDate ? errors.requiredDate : ""} />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-surface-700">Diagnosis/Medical Condition *</label>
            <textarea
              rows={3}
              placeholder="Briefly describe the medical condition..."
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 outline-none transition-all duration-200 ${
                touched.diagnosis && errors.diagnosis
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-surface-300 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
              value={form.diagnosis}
              onChange={handleChange("diagnosis")}
              onBlur={handleBlur("diagnosis")}
            />
            {touched.diagnosis && errors.diagnosis && <p className="text-xs text-red-500 mt-0.5">{errors.diagnosis}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-surface-700">Additional Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Any other details..."
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-200"
              value={form.notes}
              onChange={handleChange("notes")}
            />
          </div>
          

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Submit Request</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
