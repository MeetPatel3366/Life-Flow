import { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyRequests, getHospitalRequests, getAllRequests } from "../../../store/requestSlice";
import { useAuth } from "../../../hooks/useAuth";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import BloodGroupBadge from "../../../components/common/BloodGroupBadge";
import Button from "../../../components/ui/Button";
import { formatDateTime } from "../../../utils/formatters";
import { BLOOD_GROUPS, REQUEST_STATUSES } from "../../../utils/constants";
import { HiPlus } from "react-icons/hi";

export default function RequestsList() {
  const { isPatient, isHospital } = useAuth();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "", bloodGroup: "", hospital: "", search: "" });

  const { requests, pagination, loading: isLoading } = useSelector(state => state.request);

  useEffect(() => {
    const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
    if (isPatient) {
      dispatch(getMyRequests(queryParams));
    } else if (isHospital) {
      dispatch(getHospitalRequests(queryParams));
    } else {
      dispatch(getAllRequests(queryParams));
    }
  }, [filters, isPatient, isHospital, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const columns = [
    { key: "createdAt", label: "Date", render: (val) => formatDateTime(val) },
    { key: "bloodGroup", label: "Target Blood", render: (val) => <BloodGroupBadge group={val} /> },
    { key: "unitsRequired", label: "Units" },
    { key: "urgency", label: "Urgency", render: (val) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
        val === "Emergency" 
          ? "bg-red-600 text-white animate-pulse ring-2 ring-red-300" 
          : "bg-surface-100 text-surface-700"
      }`}>
        {val}
      </span>
    )},
    { key: "componentType", label: "Component" },
    { key: "status", label: "Status" },
  ];

  const { isAdmin } = useAuth();
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      import("../../../api/hospitalApi").then(m => {
        m.default.getHospitals({ limit: 100 }).then(res => {
          const list = res.data?.data?.hospitals || [];
          setHospitals(list.map(h => ({ label: h.name, value: h._id })));
        });
      });
    }
  }, [isAdmin]);

  if (!isPatient) {
    columns.splice(1, 0, { key: "patient", label: "Patient", render: (val) => val?.name || "Unknown" });
  }

  if (isAdmin) {
    columns.splice(2, 0, { key: "hospital", label: "Hospital", render: (val) => val?.name || "Unknown" });
  }

  const filterConfig = [
    { key: "status", label: "Status", options: REQUEST_STATUSES },
    { key: "bloodGroup", label: "Blood Group", options: BLOOD_GROUPS },
  ];

  if (isAdmin) {
    filterConfig.push({ key: "hospital", label: "Hospital", options: hospitals });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Blood Requests</h1>
          <p className="text-surface-500 text-sm mt-1">Manage and track blood requests</p>
        </div>
        {isPatient && (
          <Link to="/dashboard/requests/new">
            <Button>
              <HiPlus className="w-5 h-5" /> New Request
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100 flex items-center justify-between">
        <FilterBar 
          filters={filterConfig} 
          values={filters} 
          onChange={handleFilterChange} 
          searchPlaceholder={isPatient ? "" : "Search by name..."}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={[...requests].sort((a, b) => {
            // 1. Pending status takes highest priority
            if (a.status === "Pending" && b.status !== "Pending") return -1;
            if (a.status !== "Pending" && b.status === "Pending") return 1;

            // 2. Within the same status category, prioritize Emergency urgency
            if (a.urgency === "Emergency" && b.urgency !== "Emergency") return -1;
            if (a.urgency !== "Emergency" && b.urgency === "Emergency") return 1;

            // 3. Finally sort by date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
          })}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          onRowClick={(row) => window.location.assign(`/dashboard/requests/${row._id}`)}
          emptyTitle="No requests found"
          emptyMessage="You don't have any active blood requests."
        />
      </div>
    </div>
  );
}
