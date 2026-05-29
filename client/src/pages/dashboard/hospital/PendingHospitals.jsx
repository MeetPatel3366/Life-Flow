import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPendingHospitals } from "../../../store/hospitalSlice";
import hospitalApi from "../../../api/hospitalApi";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { formatDateTime } from "../../../utils/formatters";
import { HiCheckCircle, HiXCircle, HiEye } from "react-icons/hi";
import toast from "react-hot-toast";

export default function PendingHospitals() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const dispatch = useDispatch();
  const { pendingHospitals, loading: isLoading } = useSelector((state) => state.hospital);

  const hospitals = pendingHospitals?.hospitals || [];
  const pagination = pendingHospitals?.pagination || null;

  useEffect(() => {
    dispatch(getPendingHospitals(filters));
  }, [filters, dispatch]);

  const handleView = async (row) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const res = await hospitalApi.getHospitalById(row._id);
      setSelectedHospital(res.data.data);
    } catch {
      toast.error("Failed to load hospital details");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedHospital) return;
    try {
      setActionLoading(true);
      await hospitalApi.approveHospital(selectedHospital._id);
      toast.success("Hospital approved successfully!");
      setShowDetailModal(false);
      setSelectedHospital(null);
      dispatch(getPendingHospitals(filters));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve hospital");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHospital) return;
    if (rejectionReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    try {
      setActionLoading(true);
      await hospitalApi.rejectHospital(selectedHospital._id, rejectionReason);
      toast.success("Hospital rejected");
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelectedHospital(null);
      setRejectionReason("");
      dispatch(getPendingHospitals(filters));
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Failed to reject hospital";
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "name", label: "Hospital Name" },
    { key: "type", label: "Type" },
    { key: "licenseNumber", label: "License No." },
    {
      key: "phone",
      label: "Phone",
      render: (val) => val || "N/A",
    },
    {
      key: "address",
      label: "City",
      render: (val) => val?.city || "N/A",
    },
    {
      key: "createdAt",
      label: "Applied On",
      render: (val) => formatDateTime(val),
    },
    {
      key: "_id",
      label: "Actions",
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleView(row);
          }}
          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary-600 transition-colors cursor-pointer"
          title="View Details"
        >
          <HiEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Pending Hospital Approvals</h1>
        <p className="text-surface-500 text-sm mt-1">Review and approve hospital registration requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={hospitals}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
          onRowClick={handleView}
          emptyTitle="No pending approvals"
          emptyMessage="All hospital registrations have been reviewed."
        />
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedHospital(null); }}
        title="Hospital Registration Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : selectedHospital ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Hospital Name", value: selectedHospital.name },
                { label: "Type", value: selectedHospital.type },
                { label: "License Number", value: selectedHospital.licenseNumber },
                { label: "Phone", value: selectedHospital.phone || "N/A" },
                { label: "Contact Person", value: selectedHospital.contactPerson?.name || "N/A" },
                { label: "Designation", value: selectedHospital.contactPerson?.designation || "N/A" },
                { label: "City", value: selectedHospital.address?.city || "N/A" },
                { label: "State", value: selectedHospital.address?.state || "N/A" },
                { label: "Pincode", value: selectedHospital.address?.pincode || "N/A" },
                { label: "Storage Capacity", value: selectedHospital.storageCapacity || "N/A" },
                { label: "Component Separation", value: selectedHospital.hasComponentSeparation ? "Yes" : "No" },
                { label: "Applied On", value: formatDateTime(selectedHospital.createdAt) },
              ].map((item, i) => (
                <div key={i} className="bg-surface-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-surface-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {selectedHospital.licenseDocument?.secure_url && (
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">License Document</p>
                <a
                  href={selectedHospital.licenseDocument.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                >
                  View Document →
                </a>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
              <Button
                variant="outline"
                onClick={() => { setShowDetailModal(false); setSelectedHospital(null); }}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => { setRejectionReason(""); setShowRejectModal(true); }}
              >
                <HiXCircle className="w-4 h-4" /> Reject
              </Button>
              <Button
                variant="success"
                onClick={handleApprove}
                isLoading={actionLoading}
              >
                <HiCheckCircle className="w-4 h-4" /> Approve
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Hospital Registration"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              You are about to reject <strong>{selectedHospital?.name}</strong>. Please provide a reason.
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-surface-700">Rejection Reason *</label>
            <textarea
              rows={4}
              placeholder="Explain why this registration is being rejected... (min 10 characters)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} isLoading={actionLoading}>
              <HiXCircle className="w-4 h-4" /> Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
