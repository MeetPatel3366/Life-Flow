import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMyDonations, getHospitalDonations, getAllDonations } from "../../../store/donationSlice";
import { useAuth } from "../../../hooks/useAuth";
import donationApi from "../../../api/donationApi";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import Button from "../../../components/ui/Button";
import { formatDateTime } from "../../../utils/formatters";
import { DONATION_STATUSES, BLOOD_GROUPS } from "../../../utils/constants";
import { HiPlus, HiExclamationCircle, HiClock } from "react-icons/hi";

export default function DonationsList() {
  const { isDonor, isAdmin, isHospital } = useAuth();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "", search: "", bloodGroup: "" });
  const [eligibility, setEligibility] = useState(null);

  const { donations, pagination, loading: isLoading } = useSelector(state => state.donation);

  useEffect(() => {
    if (isDonor) {
      donationApi.checkEligibility()
        .then((res) => setEligibility(res.data?.data || null))
        .catch(() => setEligibility(null));
    }
  }, [isDonor, donations]);

  useEffect(() => {
    const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
    if (isDonor) {
      dispatch(getMyDonations(queryParams));
    } else if (isAdmin) {
      dispatch(getAllDonations(queryParams));
    } else {
      dispatch(getHospitalDonations(queryParams));
    }
  }, [filters, isDonor, isAdmin, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const columns = [
    { key: "scheduledDate", label: "Date", render: (val) => formatDateTime(val) },
    { key: "status", label: "Status" },
  ];

  if (isAdmin) {
    columns.splice(1, 0,
      { key: "donor", label: "Donor", render: (val) => val?.name || "Unknown" },
      { key: "hospital", label: "Hospital", render: (val) => val?.name || "N/A" },
      { key: "bloodGroup", label: "Blood Group" },
    );
  } else if (isHospital) {
    columns.splice(1, 0, { key: "donor", label: "Donor Name", render: (val) => val?.name || "Unknown" });
  } else {
    columns.splice(1, 0, { key: "hospital", label: "Hospital", render: (val) => val?.name || "N/A" });
  }

  const filterConfig = [
    { key: "status", label: "Status", options: DONATION_STATUSES },
  ];

  if (isAdmin) {
    filterConfig.push(
      { key: "bloodGroup", label: "Blood Group", options: BLOOD_GROUPS },
    );
  }

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

  const getDisabledMessage = () => {
    if (!eligibility || canSchedule) return null;
    if (eligibility.reason === "already_scheduled") {
      return `Already ${eligibility.activeDonation?.status || "Scheduled"}`;
    }
    if (eligibility.reason === "cooldown_period" && eligibility.nextEligibleDate) {
      return `Eligible after ${formatNextEligibleDate(eligibility.nextEligibleDate)}`;
    }
    return "Not eligible";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Donations</h1>
          <p className="text-surface-500 text-sm mt-1">
            {isAdmin ? "View all donation records" : "Manage blood donation appointments"}
          </p>
        </div>
        {isDonor && (
          <div className="flex flex-col items-end gap-1">
            {canSchedule ? (
              <Link to="/dashboard/donations/new">
                <Button>
                  <HiPlus className="w-5 h-5" /> Schedule Donation
                </Button>
              </Link>
            ) : (
              <Button disabled>
                <HiPlus className="w-5 h-5" /> Schedule Donation
              </Button>
            )}
            {!canSchedule && getDisabledMessage() && (
              <span className="text-xs flex items-center gap-1 mt-1" style={{
                color: eligibility?.reason === "already_scheduled" ? "#d97706" : "#2563eb"
              }}>
                {eligibility?.reason === "already_scheduled" ? (
                  <HiExclamationCircle className="w-3.5 h-3.5" />
                ) : (
                  <HiClock className="w-3.5 h-3.5" />
                )}
                {getDisabledMessage()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100">
        <FilterBar
          filters={filterConfig}
          values={filters}
          onChange={handleFilterChange}
          searchPlaceholder={isAdmin ? "Search by donor or hospital name..." : undefined}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={[...donations].sort((a, b) => {
            if (isHospital) {
              if (a.status === "Scheduled" && b.status !== "Scheduled") return -1;
              if (a.status !== "Scheduled" && b.status === "Scheduled") return 1;
            }
            return new Date(b.scheduledDate) - new Date(a.scheduledDate);
          })}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          onRowClick={isHospital ? (row) => window.location.assign(`/dashboard/donations/${row._id}`) : undefined}
          emptyTitle="No donations found"
          emptyMessage={
            isAdmin
              ? "No donation records available."
              : "You don't have any donation records yet."
          }
        />
      </div>
    </div>
  );
}