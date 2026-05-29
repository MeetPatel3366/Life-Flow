import { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyComplaints, getHospitalComplaints, getAllComplaints } from "../../../store/complaintSlice";
import { useAuth } from "../../../hooks/useAuth";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import Button from "../../../components/ui/Button";
import { formatDateTime } from "../../../utils/formatters";
import { COMPLAINT_STATUSES, COMPLAINT_CATEGORIES } from "../../../utils/constants";
import { HiPlus } from "react-icons/hi";

export default function ComplaintsList() {
  const { isPatient, isDonor, isHospital } = useAuth();
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "", category: "" });

  const isUser = isPatient || isDonor;
  const dispatch = useDispatch();
  const { complaints, pagination, loading: isLoading } = useSelector(state => state.complaint);

  useEffect(() => {
    const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
    if (isUser) {
      dispatch(getMyComplaints(queryParams));
    } else if (isHospital) {
      dispatch(getHospitalComplaints(queryParams));
    } else {
      dispatch(getAllComplaints(queryParams));
    }
  }, [filters, isUser, isHospital, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const columns = [
    { key: "complaintId", label: "Ticket ID", render: (val) => val.slice(-6).toUpperCase() },
    { key: "createdAt", label: "Date", render: (val) => formatDateTime(val) },
    { key: "category", label: "Category" },
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status" },
  ];

  if (!isUser) {
    columns.splice(2, 0, { key: "raisedBy", label: "Raised By", render: (val) => val?.name || "Unknown" });
  }
  if (!isHospital) {
    columns.splice(-2, 0, { key: "hospital", label: "Hospital", render: (val) => val?.name || "N/A" });
  }

  const filterConfig = [
    { key: "status", label: "Status", options: COMPLAINT_STATUSES },
    { key: "category", label: "Category", options: COMPLAINT_CATEGORIES },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Complaints</h1>
          <p className="text-surface-500 text-sm mt-1">Manage feedback and issues</p>
        </div>
        {isUser && (
          <Link to="/dashboard/complaints/new">
            <Button>
              <HiPlus className="w-5 h-5" /> Raise Complaint
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100 flex items-center justify-between">
        <FilterBar filters={filterConfig} values={filters} onChange={handleFilterChange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={complaints.map(c => ({ ...c, complaintId: c._id }))}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          onRowClick={(row) => window.location.assign(`/dashboard/complaints/${row._id}`)}
          emptyTitle="No complaints found"
          emptyMessage="There are no tickets matching your criteria."
        />
      </div>
    </div>
  );
}
