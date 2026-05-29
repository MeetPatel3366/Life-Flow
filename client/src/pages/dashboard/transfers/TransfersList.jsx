import { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTransfers, getAllTransfers } from "../../../store/transferSlice";
import { useAuth } from "../../../hooks/useAuth";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import BloodGroupBadge from "../../../components/common/BloodGroupBadge";
import { formatDateTime } from "../../../utils/formatters";
import { TRANSFER_STATUSES } from "../../../utils/constants";

export default function TransfersList() {
  const { isAdmin } = useAuth();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "" });

  const { transfers, pagination, loading: isLoading } = useSelector(state => state.transfer);
  const [tab, setTab] = useState("incoming");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      import("../../../api/transferApi").then(m => {
        m.default.getTransferStats().then(res => {
          setStats(res.data?.data);
        });
      });
    }
  }, [isAdmin, transfers]);

  useEffect(() => {
    const queryParams = {
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
      type: tab
    };
    if (isAdmin) {
      dispatch(getAllTransfers(queryParams));
    } else {
      dispatch(getTransfers(queryParams));
    }
  }, [filters, tab, isAdmin, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const columns = [
    { key: "transferId", label: "ID", render: (val) => val?.slice(-6).toUpperCase() },
    { key: "createdAt", label: "Date", render: (val) => formatDateTime(val) },
    {
      key: "bloodGroup", label: "Blood", render: (_, row) => (
        <div className="flex items-center gap-2">
          <BloodGroupBadge group={row.request?.bloodGroup} />
          <span className="text-xs">{row.request?.componentType}</span>
        </div>
      )
    },
    {
      key: "priority", label: "Priority", render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${val === "Emergency"
          ? "bg-red-600 text-white animate-pulse ring-2 ring-red-300"
          : "bg-surface-100 text-surface-700"
          }`}>
          {val || "Normal"}
        </span>
      )
    },
    { key: "status", label: "Status" },
  ];

  if (!isAdmin) {
    columns.splice(2, 0, {
      key: "hospital", label: tab === "incoming" ? "From" : "To", render: (_, row) => (
        <div>
          <p className="font-medium">{tab === "incoming" ? row.fromHospital?.name : row.toHospital?.name}</p>
          <p className="text-xs text-surface-500">{tab === "incoming" ? row.fromHospital?.phone : row.toHospital?.phone}</p>
        </div>
      )
    });
  } else {
    columns.splice(2, 0, {
      key: "hospitals", label: "From → To", render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-surface-400 w-4">F:</span>
            <span className="text-xs font-medium text-surface-700">{row.fromHospital?.name}</span>
            <span className="text-[10px] text-surface-400">({row.fromHospital?.phone})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-primary-400 w-4">T:</span>
            <span className="text-xs font-bold text-primary-700">{row.toHospital?.name}</span>
            <span className="text-[10px] text-primary-400 font-medium">({row.toHospital?.phone})</span>
          </div>
        </div>
      )
    });
  }

  const filterConfig = [
    { key: "status", label: "Status", options: TRANSFER_STATUSES },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Transfers</h1>
          <p className="text-surface-500 text-sm mt-1">Manage inter-hospital blood transfers</p>
        </div>
        {!isAdmin && stats && (
          <div className="flex gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex flex-col items-center">
              <span className="text-xs text-amber-700 font-medium uppercase tracking-wider">Outgoing Pending</span>
              <span className="text-xl font-bold text-amber-900">{stats.pendingOutgoing || 0}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex flex-col items-center">
              <span className="text-xs text-blue-700 font-medium uppercase tracking-wider">Incoming Pending</span>
              <span className="text-xl font-bold text-blue-900">{stats.pendingIncoming || 0}</span>
            </div>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="flex border-b border-surface-200">
          <button
            className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${tab === 'incoming' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
            onClick={() => { setTab('incoming'); setFilters(p => ({ ...p, page: 1 })); }}
          >
            Incoming Transfers
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${tab === 'outgoing' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
            onClick={() => { setTab('outgoing'); setFilters(p => ({ ...p, page: 1 })); }}
          >
            Outgoing Transfers
          </button>
        </div>
      )}


      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100 flex items-center justify-between">
        <FilterBar filters={filterConfig} values={filters} onChange={handleFilterChange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={transfers.map(t => ({ ...t, transferId: t._id }))}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          onRowClick={isAdmin ? null : (row) => window.location.assign(`/dashboard/transfers/${row._id}`)}
          emptyTitle="No transfers found"
          emptyMessage="There are no transfer records matching your criteria."
        />
      </div>
    </div>
  );
}
