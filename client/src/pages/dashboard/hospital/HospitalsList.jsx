import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getHospitals } from "../../../store/hospitalSlice";
import hospitalApi from "../../../api/hospitalApi";
import DataTable from "../../../components/common/DataTable";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import { formatDateTime } from "../../../utils/formatters";
import toast from "react-hot-toast";

export default function HospitalsList() {
  const dispatch = useDispatch();
  const { hospitals: hospitalsData, loading } = useSelector((state) => state.hospital);
  
  const [filter, setFilter] = useState("All"); 
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchHospitals();
  }, [filter]); 

  const fetchHospitals = () => {
    const params = { limit: 50 };
    if (filter !== "All") params.status = filter;
    dispatch(getHospitals(params));
  };

  const handleApproveConfirm = async () => {
    if (!approveId) return;
    try {
      await hospitalApi.approveHospital(approveId);
      toast.success("Hospital approved successfully");
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve hospital");
    } finally {
      setApproveId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectId || rejectReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    try {
      await hospitalApi.rejectHospital(rejectId, rejectReason);
      toast.success("Hospital rejected successfully");
      fetchHospitals();
    } catch (err) {
      const errorMsg = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || "Failed to reject hospital";
      toast.error(errorMsg);
    } finally {
      setRejectId(null);
      setRejectReason("");
    }
  };

  const columns = [
    { key: "name", label: "Hospital Name" },
    { key: "phone", label: "Contact Phone" },
    { 
      key: "verificationStatus", 
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          val === 'Approved' ? 'bg-green-100 text-green-800' :
          val === 'Rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {val}
        </span>
      )
    },
    { key: "createdAt", label: "Date Applied", render: (val) => formatDateTime(val) },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelectedHospital(row)}>View Details</Button>
          {row.verificationStatus === "Pending" && (
            <>
              <Button size="sm" onClick={() => setApproveId(row._id)}>Approve</Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectId(row._id)}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Hospitals</h1>
          <p className="text-surface-500">Manage hospital registrations and accounts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-48">
            <Select 
              label="Verification Status"
              options={["All", "Pending", "Approved", "Rejected"]}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={hospitalsData?.hospitals || []} 
          isLoading={loading} 
          emptyMessage="No hospitals found matching current filters." 
        />
      </div>

      {selectedHospital && (
        <Modal 
          isOpen={!!selectedHospital} 
          onClose={() => setSelectedHospital(null)} 
          title="Hospital Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-surface-500">Name</p><p className="font-medium">{selectedHospital.name}</p></div>
              <div><p className="text-sm text-surface-500">Type</p><p className="font-medium">{selectedHospital.type || "Hospital"}</p></div>
              <div><p className="text-sm text-surface-500">License Number</p><p className="font-medium">{selectedHospital.licenseNumber}</p></div>
              <div><p className="text-sm text-surface-500">Phone</p><p className="font-medium">{selectedHospital.phone || "N/A"}</p></div>
            </div>
            
            <div className="border-t border-surface-100 pt-4">
              <h4 className="font-medium text-surface-900 mb-2">Location & Address</h4>
              <p className="text-sm text-surface-700">
                {selectedHospital.address?.street && `${selectedHospital.address.street}, `}
                {selectedHospital.address?.city}, {selectedHospital.address?.state} - {selectedHospital.address?.pincode}
              </p>
              {selectedHospital.location?.coordinates && selectedHospital.location.coordinates.length === 2 && (
                <p className="text-xs text-surface-500 mt-1">
                  Coordinates: {selectedHospital.location.coordinates[0]}, {selectedHospital.location.coordinates[1]}
                </p>
              )}
            </div>

            <div className="border-t border-surface-100 pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-surface-500">Contact Person</p>
                <p className="font-medium">{selectedHospital.contactPerson?.name || "N/A"} {selectedHospital.contactPerson?.designation ? `(${selectedHospital.contactPerson.designation})` : ""}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Storage Capacity</p>
                <p className="font-medium">{selectedHospital.storageCapacity ? `${selectedHospital.storageCapacity} units` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Component Separation</p>
                <p className="font-medium">{selectedHospital.hasComponentSeparation ? "Available" : "Not Available"}</p>
              </div>
            </div>

            {selectedHospital.licenseDocument?.secure_url && (
              <div className="border-t border-surface-100 pt-4">
                <a 
                  href={selectedHospital.licenseDocument.secure_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary-600 font-medium hover:underline text-sm"
                >
                  View License Document PDF/Image
                </a>
              </div>
            )}
            
            {selectedHospital.rejectionReason && selectedHospital.verificationStatus === "Rejected" && (
              <div className="border-t border-surface-100 pt-4">
                <p className="text-sm text-red-600"><strong>Rejection Reason:</strong> {selectedHospital.rejectionReason}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal isOpen={!!approveId} onClose={() => setApproveId(null)} title="Approve Hospital" size="sm">
        <p className="text-surface-600 mb-6">Are you sure you want to approve this hospital? This will grant them full access to the dashboard and platform systems.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setApproveId(null)}>Cancel</Button>
          <Button onClick={handleApproveConfirm}>Confirm Approval</Button>
        </div>
      </Modal>

      <Modal isOpen={!!rejectId} onClose={() => { setRejectId(null); setRejectReason(""); }} title="Reject Hospital Registration" size="sm">
        <p className="text-surface-600 mb-4">Please provide a reason for rejecting this hospital registration. The hospital will see this reason on their dashboard.</p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Invalid license number, address mismatch..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[100px] mb-6 border-surface-300"
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
          <Button variant="danger" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRejectConfirm}>Confirm Rejection</Button>
        </div>
      </Modal>
    </div>
  );
}
