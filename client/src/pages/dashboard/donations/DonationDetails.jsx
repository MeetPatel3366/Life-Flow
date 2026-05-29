import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import donationApi from "../../../api/donationApi";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDateTime } from "../../../utils/formatters";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const screeningSchema = z.object({
  weight: z.coerce.number({ invalid_type_error: "Required" }).min(50, "Minimum weight is 50kg").max(200, "Maximum weight is 200kg"),
  hemoglobin: z.coerce.number({ invalid_type_error: "Required" }).min(12, "Min 12").max(20, "Max 20"),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Invalid format (e.g., 120/80)"),
  temperature: z.coerce.number({ invalid_type_error: "Required" }).min(36, "Min 36°C").max(38, "Max 38°C"),
  pulse: z.coerce.number({ invalid_type_error: "Required" }).min(60, "Min 60 bpm").max(120, "Max 120 bpm"),
  passed: z.string().transform((val) => val === "true"),
  remarks: z.string().trim().optional(),
  deferralReason: z.string().trim().optional(),
}).refine(
  (data) => {
    if (!data.passed && (!data.deferralReason || data.deferralReason.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Deferral reason is required if not eligible",
    path: ["deferralReason"],
  }
);

export default function DonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDonor, isHospital } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDonation = async () => {
    try {
      setIsLoading(true);
      const res = await donationApi.getDonationById(id);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load donation details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const donation = data?.data;

  const [cancelModal, setCancelModal] = useState(false);
  const [screeningModal, setScreeningModal] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [screeningUpdating, setScreeningUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(screeningSchema),
    defaultValues: {
      weight: "",
      hemoglobin: "",
      bloodPressure: "",
      temperature: "",
      pulse: "",
      passed: "true",
      remarks: "",
      deferralReason: "",
    },
  });

  const passedStatus = watch("passed");

  if (isLoading) return <Spinner size="lg" className="py-20" />;
  if (!donation) return <div className="text-center py-20 text-surface-500">Donation not found.</div>;

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await donationApi.cancelDonation(id);
      toast.success("Donation appointment cancelled");
      setCancelModal(false);
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setCancelling(false);
    }
  };

  const onScreeningSubmit = async (formData) => {
    try {
      setScreeningUpdating(true);
      const submissionData = {
        ...formData,
        passed: formData.passed === true || formData.passed === "true" 
      };
      
      await donationApi.updateScreening(id, submissionData);
      toast.success("Screening updated successfully");
      setScreeningModal(false);
      reset();
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setScreeningUpdating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await donationApi.completeDonation(id);
      toast.success("Donation marked as completed");
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            Donation
            <StatusBadge status={donation.status} />
          </h1>
          <p className="text-surface-500 text-sm mt-1">Scheduled for {formatDateTime(donation.scheduledDate)}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Appointment Details
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Donor</span>
              <span className="font-medium text-surface-900">{donation.donor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Target Hospital</span>
              <span className="font-medium text-surface-900">{donation.hospital?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Status</span>
              <StatusBadge status={donation.status} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Screening & Lab
          </div>
          <div className="p-5 space-y-4">
             <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Eligibility</span>
              <span className={`font-medium ${donation.screening?.passed ? 'text-green-600' : 'text-red-600'}`}>{donation.screening ? (donation.screening.passed ? "Passed" : "Deferred") : "Pending"}</span>
            </div>
            {donation.screening?.deferralReason && !donation.screening.passed && (
               <div className="flex flex-col gap-1">
                 <span className="text-surface-500 text-sm">Deferral Reason</span>
                 <span className="font-medium text-red-600 text-sm p-2 bg-red-50 rounded-md border border-red-100">{donation.screening.deferralReason}</span>
               </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-surface-500 text-sm">Weight</span>
                <span className="font-medium text-surface-900">{donation.screening?.weight ? `${donation.screening.weight} kg` : "-"}</span>
              </div>
              <div>
                <span className="block text-surface-500 text-sm">Pulse</span>
                <span className="font-medium text-surface-900">{donation.screening?.pulse ? `${donation.screening.pulse} bpm` : "-"}</span>
              </div>
              <div>
                <span className="block text-surface-500 text-sm">Blood Pressure</span>
               <span className="font-medium text-surface-900">{donation.screening?.bloodPressure ? `${donation.screening.bloodPressure}` : "-"}</span>
              </div>
              <div>
                <span className="block text-surface-500 text-sm">Temperature</span>
                <span className="font-medium text-surface-900">{donation.screening?.temperature ? `${donation.screening.temperature} °C` : "-"}</span>
              </div>
              <div>
                <span className="block text-surface-500 text-sm">Hemoglobin</span>
                <span className="font-medium text-surface-900">{donation.screening?.hemoglobin ? `${donation.screening.hemoglobin} g/dL` : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5 flex flex-wrap justify-end gap-3 border-t">
        {isDonor && ["Scheduled"].includes(donation.status) && (
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelModal(true)}>
            Cancel Appointment
          </Button>
        )}

        {isHospital && ["Scheduled"].includes(donation.status) && (
          <Button variant="primary" onClick={() => setScreeningModal(true)}>
            Update Screening
          </Button>
        )}

        {isHospital && donation.status === "Screening" && donation.screening?.passed && (
          <Button variant="success" onClick={handleComplete} isLoading={completing}>
            Complete Donation
          </Button>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelModal}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this donation appointment?"
        confirmText="Yes, Cancel"
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancelling}
      />

       {screeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-surface-100">
              <h2 className="text-xl font-bold text-surface-900">Update Screening Info</h2>
            </div>
            <div className="p-5 overflow-y-auto">
              <form id="screening-form" onSubmit={handleSubmit(onScreeningSubmit)} className="space-y-4 text-sm text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Weight (kg) *</label>
                    <input type="number" step="0.1" placeholder="min 50" className={`w-full border rounded p-2 text-surface-900 ${errors.weight ? 'border-red-500' : 'border-surface-300'}`} {...register("weight")} />
                    {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Hemoglobin (g/dL) *</label>
                    <input type="number" step="0.1" placeholder="5-20" className={`w-full border rounded p-2 text-surface-900 ${errors.hemoglobin ? 'border-red-500' : 'border-surface-300'}`} {...register("hemoglobin")} />
                    {errors.hemoglobin && <p className="text-xs text-red-500 mt-1">{errors.hemoglobin.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Blood Pressure *</label>
                    <input type="text" placeholder="120/80" className={`w-full border rounded p-2 text-surface-900 ${errors.bloodPressure ? 'border-red-500' : 'border-surface-300'}`} {...register("bloodPressure")} />
                    {errors.bloodPressure && <p className="text-xs text-red-500 mt-1">{errors.bloodPressure.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Temp (°C) *</label>
                    <input type="number" step="0.1" placeholder="36.5" className={`w-full border rounded p-2 text-surface-900 ${errors.temperature ? 'border-red-500' : 'border-surface-300'}`} {...register("temperature")} />
                    {errors.temperature && <p className="text-xs text-red-500 mt-1">{errors.temperature.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Pulse (bpm) *</label>
                    <input type="number" placeholder="60-100" className={`w-full border rounded p-2 text-surface-900 ${errors.pulse ? 'border-red-500' : 'border-surface-300'}`} {...register("pulse")} />
                    {errors.pulse && <p className="text-xs text-red-500 mt-1">{errors.pulse.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Status *</label>
                    <select className="w-full border rounded p-2 text-surface-900 border-surface-300" {...register("passed")}>
                      <option value="true">Eligible</option>
                      <option value="false">Not Eligible</option>
                    </select>
                  </div>
                </div>
                
                {passedStatus === "false" && (
                  <div>
                    <label className="block mb-1 font-medium text-red-600">Deferral Reason *</label>
                    <input type="text" placeholder="Why is the donor deferred?" className={`w-full border rounded p-2 text-surface-900 ${errors.deferralReason ? 'border-red-500' : 'border-red-300'}`} {...register("deferralReason")} />
                    {errors.deferralReason && <p className="text-xs text-red-500 mt-1">{errors.deferralReason.message}</p>}
                  </div>
                )}
                
                <div>
                  <label className="block mb-1 font-medium">Remarks (Optional)</label>
                  <textarea placeholder="General notes..." className="w-full border rounded p-2 text-surface-900 border-surface-300" {...register("remarks")} rows={2} />
                  {errors.remarks && <p className="text-xs text-red-500 mt-1">{errors.remarks.message}</p>}
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-surface-100 bg-surface-50 flex gap-3 justify-end rounded-b-2xl">
              <Button type="button" variant="secondary" onClick={() => { setScreeningModal(false); reset(); }} disabled={screeningUpdating}>
                Cancel
              </Button>
              <Button form="screening-form" type="submit" variant="primary" isLoading={screeningUpdating}>
                Save Screening
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}