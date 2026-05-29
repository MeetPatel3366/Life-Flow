import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import complaintApi from "../../../api/complaintApi";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDateTime } from "../../../utils/formatters";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPatient, isDonor, isAdmin } = useAuth();
  const isUser = isPatient || isDonor;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [updating, setUpdating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchComplaint = async () => {
    try {
      setIsLoading(true);
      const res = await complaintApi.getComplaintById(id);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load complaint details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const complaint = data?.data;

  const [resolveModal, setResolveModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState("");

  if (isLoading) return <Spinner size="lg" className="py-20" />;
  if (!complaint) return <div className="text-center py-20 text-surface-500">Complaint not found.</div>;

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);
      await complaintApi.updateComplaintStatus(id, status);
      toast.success(`Complaint moved to ${status}`);
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionRemarks.trim()) return toast.error("Resolution remarks required");
    try {
      setResolving(true);
      await complaintApi.resolveComplaint(id, { resolutionRemarks });
      toast.success("Complaint resolved");
      setResolveModal(false);
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await complaintApi.cancelComplaint(id);
      toast.success("Complaint cancelled");
      setCancelModal(false);
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            Ticket #{complaint._id.slice(-6).toUpperCase()}
            <StatusBadge status={complaint.status} />
          </h1>
          <p className="text-surface-500 text-sm mt-1">Submitted on {formatDateTime(complaint.createdAt)}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
        <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
          Complaint Details
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between border-b border-surface-50 pb-3">
            <span className="text-surface-500 text-sm">Raised By</span>
            <span className="font-medium text-surface-900">{complaint.raisedBy?.name} ({complaint.raisedBy?.email})</span>
          </div>
          <div className="flex justify-between border-b border-surface-50 pb-3">
            <span className="text-surface-500 text-sm">Related Hospital</span>
            <span className="font-medium text-surface-900">{complaint.hospital?.name || "Not specified"}</span>
          </div>
          <div className="flex justify-between border-b border-surface-50 pb-3">
            <span className="text-surface-500 text-sm">Category</span>
            <span className="font-medium text-surface-900">{complaint.category}</span>
          </div>
          <div>
            <span className="text-surface-500 text-sm block mb-1">Subject</span>
            <span className="font-bold text-surface-900 text-lg">{complaint.subject}</span>
          </div>
          <div>
            <span className="text-surface-500 text-sm block mb-1">Description</span>
            <p className="text-surface-700 whitespace-pre-wrap bg-surface-50 p-4 rounded-lg border border-surface-100 text-sm leading-relaxed">
              {complaint.description}
            </p>
          </div>
        </div>
      </div>

      {complaint.resolutionRemarks && (
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 overflow-hidden">
          <div className="bg-green-100 px-5 py-3 font-semibold text-green-800">
            Resolution
          </div>
          <div className="p-5">
            <div className="flex justify-between text-sm mb-2 text-green-700">
              <span>Resolved By: {complaint.resolvedBy?.name}</span>
              <span>At: {formatDateTime(complaint.resolvedAt)}</span>
            </div>
            <p className="text-green-900 bg-white/50 p-4 rounded-lg border border-green-200 text-sm">
              {complaint.resolutionRemarks}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5 flex justify-end gap-3 border-t">
        {isUser && ["Open", "In Review"].includes(complaint.status) && (
          <Button variant="outline" className="text-red-600 border-red-200" onClick={() => setCancelModal(true)}>
            Cancel Complaint
          </Button>
        )}

        {isAdmin && complaint.status === "Open" && (
          <Button variant="primary" onClick={() => handleStatusChange("In Review")} isLoading={updating}>
            Mark In Review
          </Button>
        )}

        {isAdmin && ["Open", "In Review"].includes(complaint.status) && (
          <>
            <Button variant="danger" onClick={() => handleStatusChange("Rejected")} isLoading={updating}>
              Reject Invalid
            </Button>
            <Button variant="success" onClick={() => setResolveModal(true)}>
              Resolve
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelModal}
        title="Cancel Complaint"
        message="Are you sure you want to cancel this complaint? This action cannot be undone."
        confirmText="Yes, Cancel"
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancelling}
      />

      <ConfirmDialog
        isOpen={resolveModal}
        title="Resolve Complaint"
        message={(
          <div className="mt-2">
            <p className="mb-2">Please provide resolution remarks.</p>
            <textarea 
              className="w-full border rounded p-2 text-sm" 
              rows={3}
              placeholder="How was this issue resolved?" 
              value={resolutionRemarks}
              onChange={e => setResolutionRemarks(e.target.value)}
            />
          </div>
        )}
        confirmText="Resolve"
        onClose={() => setResolveModal(false)}
        onConfirm={handleResolve}
        isLoading={resolving}
      />
    </div>
  );
}
