import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import donationApi from "../../../api/donationApi";
import hospitalApi from "../../../api/hospitalApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import toast from "react-hot-toast";
import { HiExclamationCircle, HiCalendar, HiClock } from "react-icons/hi";

const now = new Date();
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + 90);

const donationSchema = z.object({
  hospital: z.string().min(1, "Please select a hospital"),
  scheduledDate: z.string()
    .min(1, "Appointment date and time is required")
    .refine((val) => new Date(val) >= new Date(), "Date must be in the future or today")
    .refine((val) => new Date(val) <= maxDate, "Cannot schedule more than 90 days ahead"),
});

export default function NewDonation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      hospital: "",
      scheduledDate: "",
    },
  });

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setEligibilityLoading(true);
        const res = await donationApi.checkEligibility();
        setEligibility(res.data?.data || null);
      } catch {
        setEligibility(null);
      } finally {
        setEligibilityLoading(false);
      }
    };
    checkEligibility();
  }, []);

  useEffect(() => {
    hospitalApi
      .getNearbyHospitals()
      .then((res) => setHospitals(res.data?.data?.hospitals || []))
      .catch(() => {});
  }, []);

  const hospitalOptions = hospitals.map((h) => ({
    label: `${h.name} (${h.address?.city})`,
    value: h._id,
  }));

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const payload = {
        hospitalId: data.hospital,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
      };
      await donationApi.createDonation(payload);
      toast.success("Donation scheduled successfully!");
      navigate("/dashboard/donations");
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to create donation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canSchedule = eligibility?.canSchedule !== false;

  const formatNextEligibleDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Schedule Donation</h1>
        <p className="text-surface-500 text-sm mt-1">
          Book an appointment to donate blood at a nearby hospital.
        </p>
      </div>

      {eligibilityLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-surface-500">Checking eligibility...</span>
        </div>
      )}

      {!eligibilityLoading && !canSchedule && eligibility?.reason === "already_scheduled" && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <HiExclamationCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-surface-900 mb-1">
                Donation Already Scheduled
              </h2>
              <p className="text-surface-600 mb-4">
                {eligibility.message}
              </p>

              {eligibility.activeDonation && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HiCalendar className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Active Appointment Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-amber-700">
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                        {eligibility.activeDonation.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Hospital:</span>{" "}
                      {eligibility.activeDonation.hospitalName || "N/A"}
                    </div>
                    {eligibility.activeDonation.scheduledDate && (
                      <div>
                        <span className="font-medium">Scheduled:</span>{" "}
                        {new Date(eligibility.activeDonation.scheduledDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/dashboard/donations">
                  <Button variant="secondary">View My Donations</Button>
                </Link>
                <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!eligibilityLoading && !canSchedule && eligibility?.reason === "cooldown_period" && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <HiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-surface-900 mb-1">
                Cooldown Period Active
              </h2>
              <p className="text-surface-600 mb-4">
                {eligibility.message}
              </p>

              {eligibility.nextEligibleDate && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <HiCalendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-sm text-blue-700 font-medium">Next Eligible Date:</span>
                      <span className="ml-2 text-base font-semibold text-blue-800">
                        {formatNextEligibleDate(eligibility.nextEligibleDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/dashboard/donations">
                  <Button variant="secondary">View My Donations</Button>
                </Link>
                <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!eligibilityLoading && canSchedule && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Hospital *"
                placeholder="Choose a hospital"
                options={hospitalOptions}
                {...register("hospital")}
                error={errors.hospital?.message}
              />
              <Input
                label="Appointment Date & Time *"
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                {...register("scheduledDate")}
                error={errors.scheduledDate?.message}
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
              <strong>Donation Requirements:</strong>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Must be between 18 and 65 years old.</li>
                <li>Must weigh at least 50kg.</li>
                <li>Must not have donated blood in the last 3 months.</li>
                <li>Eat a healthy meal before donation.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Schedule Now
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}