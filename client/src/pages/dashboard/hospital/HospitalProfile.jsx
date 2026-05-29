import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyHospitalProfile, updateMyHospitalProfile } from "../../../store/hospitalSlice";
import { getMyProfile } from "../../../store/authSlice";
import hospitalApi from "../../../api/hospitalApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import toast from "react-hot-toast";
import Spinner from "../../../components/ui/Spinner";
import { HiOfficeBuilding, HiPhone, HiIdentification, HiUser, HiLocationMarker, HiUpload, HiRefresh } from "react-icons/hi";
import { geocodeAddress } from "../../../utils/geocode";

export default function HospitalProfile() {
  const dispatch = useDispatch();
  const { myProfile: hospital, loading: isProfileLoading } = useSelector(state => state.hospital);

  const [registering, setRegistering] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [licenseFile, setLicenseFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "Hospital",
    licenseNumber: "",
    phone: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    longitude: "",
    latitude: "",
    storageCapacity: "",
    hasComponentSeparation: false,
  });

  useEffect(() => {
    dispatch(getMyHospitalProfile());
  }, [dispatch]);

  useEffect(() => {
    if (hospital) {
      setForm({
        name: hospital.name || "",
        type: hospital.type || "Hospital",
        licenseNumber: hospital.licenseNumber || "",
        phone: hospital.phone || "",
        contactPersonName: hospital.contactPerson?.name || "",
        contactPersonDesignation: hospital.contactPerson?.designation || "",
        street: hospital.address?.street || "",
        city: hospital.address?.city || "",
        state: hospital.address?.state || "",
        pincode: hospital.address?.pincode || "",
        longitude: hospital.location?.coordinates?.[0] || "",
        latitude: hospital.location?.coordinates?.[1] || "",
        storageCapacity: hospital.storageCapacity || "",
        hasComponentSeparation: hospital.hasComponentSeparation || false,
      });
    }
  }, [hospital]);

  const validateField = useCallback((key, value) => {
    switch (key) {
      case "name":
        if (!value.trim()) return "Hospital name is required";
        if (value.trim().length < 3) return "Hospital name must be at least 3 characters";
        return "";
      case "type":
        if (!value) return "Hospital type is required";
        return "";
      case "licenseNumber":
        if (!value.trim()) return "License number is required";
        if (value.trim().length < 5) return "License number must be at least 5 characters";
        return "";
      case "phone":
        if (value && !/^[0-9]{10}$/.test(value)) return "Phone must be exactly 10 digits";
        return "";
      case "contactPersonName":
        if (!value.trim()) return "Contact person name is required";
        if (value.trim().length < 3) return "Contact person name must be at least 3 characters";
        return "";
      case "contactPersonDesignation":
        if (!value.trim()) return "Designation is required";
        if (value.trim().length < 2) return "Designation must be at least 2 characters";
        return "";
      case "city":
        if (!value.trim()) return "City is required";
        if (value.trim().length < 2) return "City must be at least 2 characters";
        return "";
      case "state":
        if (!value.trim()) return "State is required";
        if (value.trim().length < 2) return "State must be at least 2 characters";
        return "";
      case "pincode":
        if (!value.trim()) return "Pincode is required";
        if (!/^\d{6}$/.test(value)) return "Pincode must be 6 digits";
        return "";
      case "longitude":
        if (value && (isNaN(Number(value)) || Number(value) < -180 || Number(value) > 180))
          return "Invalid longitude (-180 to 180)";
        return "";
      case "latitude":
        if (value && (isNaN(Number(value)) || Number(value) < -90 || Number(value) > 90))
          return "Invalid latitude (-90 to 90)";
        return "";
      case "licenseFile":
        if (!hospital && !licenseFile) return "License document is required";
        return "";
      default:
        return "";
    }
  }, [hospital, licenseFile]);

  const handleChange = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [key]: value }));
    if (touched[key]) {
      const error = validateField(key, value);
      setErrors(p => ({ ...p, [key]: error }));
    }
  };

  const handleBlur = (key) => () => {
    setTouched(p => ({ ...p, [key]: true }));
    const error = validateField(key, form[key]);
    setErrors(p => ({ ...p, [key]: error }));
  };

  const handleAutoGeocode = async () => {
  const { name, street, city, state, pincode } = form;

  if (!name.trim() && !city.trim()) {
    toast.error("Please fill hospital name or at least city/state");
    return;
  }

  if (!city.trim() || !state.trim()) {
    toast.error("Please fill in at least City and State to auto-detect location");
    return;
  }

  setGeocoding(true);
  setGeocodeMessage("");

  try {
    const result = await geocodeAddress({
      name,
      street,
      city,
      state,
      pincode,
      country: "India",
    });

    if (result) {
      setForm((p) => ({
        ...p,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
      }));

      setGeocodeMessage(
        `✅ Location found: ${result.displayName?.slice(0, 80)}...`
      );
      toast.success("Location coordinates auto-filled!");
    } else {
      setGeocodeMessage(
        "⚠️ Exact location not found. Please refine hospital name/address or enter coordinates manually."
      );
      toast("Location not found, you can continue without coordinates.", {
        icon: "ℹ️",
      });
    }
  } catch {
    setGeocodeMessage(
      "⚠️ Geocoding service unavailable. You can continue without coordinates."
    );
  } finally {
    setGeocoding(false);
  }
};
  const validateForm = () => {
    const fieldsToValidate = [
      "name", "type", "licenseNumber", "phone",
      "contactPersonName", "contactPersonDesignation",
      "city", "state", "pincode",
      "longitude", "latitude",
    ];

    const newErrors = {};
    const newTouched = {};

    fieldsToValidate.forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (!hospital && !licenseFile) {
      newErrors.licenseFile = "License document is required";
      newTouched.licenseFile = true;
    }

    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    const fieldsToValidate = [
      "name", "type", "licenseNumber", "phone",
      "contactPersonName", "contactPersonDesignation",
      "city", "state", "pincode",
      "longitude", "latitude",
    ];

    for (const key of fieldsToValidate) {
      if (validateField(key, form[key]) !== "") return false;
    }

    const required = ["name", "type", "licenseNumber", "contactPersonName", "contactPersonDesignation", "city", "state", "pincode"];
    for (const key of required) {
        if (!form[key] || String(form[key]).trim() === "") return false;
    }

    if (!hospital && !licenseFile) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correctly fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      if (!hospital || form.name.trim() !== hospital.name) formData.append("name", form.name.trim());
      if (!hospital || form.type !== hospital.type) formData.append("type", form.type);
      if (!hospital || form.licenseNumber.trim() !== hospital.licenseNumber) formData.append("licenseNumber", form.licenseNumber.trim());
      if (!hospital || form.phone.trim() !== hospital.phone) formData.append("phone", form.phone.trim());

      formData.append("contactPerson[name]", form.contactPersonName.trim());
      formData.append("contactPerson[designation]", form.contactPersonDesignation.trim());

      if (form.street) formData.append("address[street]", form.street.trim());
      formData.append("address[city]", form.city.trim());
      formData.append("address[state]", form.state.trim());
      formData.append("address[pincode]", form.pincode.trim());
      formData.append("address[country]", "India");

      if (form.longitude && form.latitude) {
        formData.append("location[type]", "Point");
        formData.append("location[coordinates][0]", Number(form.longitude));
        formData.append("location[coordinates][1]", Number(form.latitude));
      }

      if (form.storageCapacity !== "") formData.append("storageCapacity", Number(form.storageCapacity));
      formData.append("hasComponentSeparation", form.hasComponentSeparation);

      if (licenseFile) {
        formData.append("licenseDocument", licenseFile);
      }

      if (hospital && hospital.verificationStatus !== 'Pending') {
        setUpdating(true);
        await dispatch(updateMyHospitalProfile(formData)).unwrap();
        toast.success("Hospital profile updated successfully");
      } else if (!hospital) {
        setRegistering(true);
        await hospitalApi.registerHospital(formData);
        
        await dispatch(getMyHospitalProfile());
        await dispatch(getMyProfile());
        
        toast.success("Registration submitted for approval");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || err || "Request failed";
      toast.error(msg);
    } finally {
      setUpdating(false);
      setRegistering(false);
    }
  };

  if (isProfileLoading && !hospital) return <Spinner size="lg" className="py-20" />;

  const isPending = hospital?.verificationStatus === 'Pending';
  const isApproved = hospital?.verificationStatus === 'Approved';
  const isRejected = hospital?.verificationStatus === 'Rejected';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">
        {hospital ? "Hospital Profile" : "Register Your Hospital"}
      </h1>

      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
          <strong>Registration Pending Approval</strong>
          <p className="text-sm mt-1">Your hospital registration is currently under review by an administrator. You will be notified once approved.</p>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
          <strong>Registration Rejected</strong>
          <p className="text-sm mt-1">Your registration was rejected. Reason: <i>{hospital.rejectionReason || "Please verify your license and details."}</i></p>
          <p className="text-sm mt-2 font-medium">Please correct your details and update the profile.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            <div>
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <HiOfficeBuilding className="w-4 h-4 text-primary-500" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hospital Name *"
                  icon={HiOfficeBuilding}
                  placeholder="City General Hospital"
                  value={form.name}
                  onChange={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={touched.name ? errors.name : ""}
                  disabled={isApproved || isPending}
                />
                <Select
                  label="Type *"
                  options={[
                    { value: "Hospital", label: "Hospital" },
                    { value: "Blood Bank", label: "Blood Bank" },
                  ]}
                  value={form.type}
                  onChange={handleChange("type")}
                  onBlur={handleBlur("type")}
                  error={touched.type ? errors.type : ""}
                  disabled={isApproved || isPending}
                />
                <Input
                  label="License Number *"
                  icon={HiIdentification}
                  placeholder="MH/2024/12345"
                  value={form.licenseNumber}
                  onChange={handleChange("licenseNumber")}
                  onBlur={handleBlur("licenseNumber")}
                  error={touched.licenseNumber ? errors.licenseNumber : ""}
                  disabled={isApproved || isPending}
                />
                <Input
                  label="Contact Phone"
                  icon={HiPhone}
                  placeholder="9876543210"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => handleChange("phone")({ target: { value: e.target.value.replace(/\D/g, "") }})}
                  onBlur={handleBlur("phone")}
                  error={touched.phone ? errors.phone : ""}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2 pt-4 border-t border-surface-100">
                <HiUser className="w-4 h-4 text-primary-500" /> Contact Person
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  icon={HiUser}
                  placeholder="Dr. Sharma"
                  value={form.contactPersonName}
                  onChange={handleChange("contactPersonName")}
                  onBlur={handleBlur("contactPersonName")}
                  error={touched.contactPersonName ? errors.contactPersonName : ""}
                  disabled={isPending}
                />
                <Input
                  label="Designation *"
                  placeholder="Medical Director"
                  value={form.contactPersonDesignation}
                  onChange={handleChange("contactPersonDesignation")}
                  onBlur={handleBlur("contactPersonDesignation")}
                  error={touched.contactPersonDesignation ? errors.contactPersonDesignation : ""}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2 pt-4 border-t border-surface-100">
                <HiLocationMarker className="w-4 h-4 text-primary-500" /> Address Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Street" placeholder="123 Main Street" value={form.street} onChange={handleChange("street")} disabled={isPending} />
                <Input label="City *" placeholder="Mumbai" value={form.city} onChange={handleChange("city")} onBlur={handleBlur("city")} error={touched.city ? errors.city : ""} disabled={isPending} />
                <Input label="State *" placeholder="Maharashtra" value={form.state} onChange={handleChange("state")} onBlur={handleBlur("state")} error={touched.state ? errors.state : ""} disabled={isPending} />
                <Input label="Pincode *" placeholder="400001" value={form.pincode} onChange={handleChange("pincode")} onBlur={handleBlur("pincode")} error={touched.pincode ? errors.pincode : ""} disabled={isPending} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2 pt-4 border-t border-surface-100">
                <HiLocationMarker className="w-4 h-4 text-primary-500" /> Location Coordinates (Optional)
              </h3>

              {!isPending && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleAutoGeocode}
                    disabled={geocoding}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors border border-primary-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <HiRefresh className={`w-4 h-4 ${geocoding ? "animate-spin" : ""}`} />
                    {geocoding ? "Detecting location..." : "📍 Auto-detect from address"}
                  </button>
                  {geocodeMessage && (
                    <p className={`text-xs mt-2 ${geocodeMessage.startsWith("✅") ? "text-green-600" : "text-amber-600"}`}>
                      {geocodeMessage}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Longitude" type="number" placeholder="72.8777" value={form.longitude} onChange={handleChange("longitude")} onBlur={handleBlur("longitude")} error={touched.longitude ? errors.longitude : ""} disabled={isPending} />
                <Input label="Latitude" type="number" placeholder="19.0760" value={form.latitude} onChange={handleChange("latitude")} onBlur={handleBlur("latitude")} error={touched.latitude ? errors.latitude : ""} disabled={isPending} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2 pt-4 border-t border-surface-100">
                Additional Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Input
                  label="Storage Capacity (units)"
                  type="number"
                  placeholder="500"
                  value={form.storageCapacity}
                  onChange={handleChange("storageCapacity")}
                  disabled={isPending}
                />
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="hasComponentSeparation"
                    type="checkbox"
                    checked={form.hasComponentSeparation}
                    onChange={handleChange("hasComponentSeparation")}
                    disabled={isPending}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <label htmlFor="hasComponentSeparation" className="text-sm text-surface-700">Has Component Separation</label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-100">
              <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <HiUpload className="w-4 h-4 text-primary-500" /> License Document {!hospital && "*"}
              </h3>
              
              {hospital && hospital.licenseDocument && (
                <div className="mb-4">
                  <a href={hospital.licenseDocument.secure_url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline">
                    View Current License Document
                  </a>
                </div>
              )}

              {!isPending && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="licenseDocument"
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      licenseFile
                        ? "border-green-300 bg-green-50 text-green-700"
                        : (touched.licenseFile && errors.licenseFile)
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-surface-300 hover:border-primary-400 hover:bg-primary-50 text-surface-500"
                    }`}
                  >
                    <HiUpload className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {licenseFile ? licenseFile.name : (hospital ? "Upload new license to replace" : "Click to upload license document")}
                    </span>
                  </label>
                  <input
                    id="licenseDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      setLicenseFile(e.target.files[0] || null);
                      if (errors.licenseFile) setErrors(prev => ({ ...prev, licenseFile: "" }));
                    }}
                  />
                  {touched.licenseFile && errors.licenseFile && <p className="text-xs text-red-500">{errors.licenseFile}</p>}
                  <p className="text-xs text-surface-400">Accepted formats: PDF, JPG, PNG</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100">
              <Button type="submit" isLoading={registering || updating} disabled={isPending || !isFormValid()}>
                {hospital ? 'Save Changes' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
