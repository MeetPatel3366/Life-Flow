import { useState, useEffect } from "react";
import { getAdminUsersAnalyzed, getAdminUserById } from "../../../api/adminUserApi";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import StatusBadge from "../../../components/common/StatusBadge";
import Modal from "../../../components/ui/Modal";
import Spinner from "../../../components/ui/Spinner";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { BLOOD_GROUPS } from "../../../utils/constants";
import toast from "react-hot-toast";

const ELIGIBILITY_STATUSES = ["Eligible", "Temporarily Not Eligible", "Deferred"];
const VERIFICATION_STATUSES = ["Pending", "Approved", "Rejected"];

export default function UsersList() {
  const [activeTab, setActiveTab] = useState("hospital");
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: "" });
  const [data, setData] = useState({ users: [], pagination: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, filters]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await getAdminUsersAnalyzed({ ...filters, role: activeTab });
      setData(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTabChange = (role) => {
    setActiveTab(role);
    setFilters({ page: 1, limit: 10, search: "" });
  };

  const handleUserClick = async (user) => {
    try {
      setSelectedUserId(user._id);
      setShowModal(true);
      setIsDetailsLoading(true);
      const res = await getAdminUserById(user._id);
      setUserDetails(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch user details");
      setShowModal(false);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const getFilterConfig = () => {
    if (activeTab === "hospital") {
      return [
        { key: "verificationStatus", label: "Verification", options: VERIFICATION_STATUSES },
      ];
    }
    if (activeTab === "donor") {
      return [
        { key: "bloodGroup", label: "Blood Group", options: BLOOD_GROUPS },
        { key: "eligibilityStatus", label: "Eligibility", options: ELIGIBILITY_STATUSES },
      ];
    }
    if (activeTab === "patient") {
      return [
        { key: "bloodGroup", label: "Blood Group", options: BLOOD_GROUPS },
      ];
    }
    return [];
  };

  const getColumns = () => {
    const baseColumns = [
      { key: "name", label: "User Name" },
      { key: "email", label: "Email" },
    ];

    if (activeTab === "hospital") {
      return [
        ...baseColumns,
        {
          key: "hospitalDetails",
          label: "Hospital Details",
          render: (val) => val ? (
            <div>
              <div className="font-semibold">{val.name || "N/A"}</div>
              <div className="text-xs text-surface-500">{val.licenseNumber ? `Lic: ${val.licenseNumber}` : ""}</div>
            </div>
          ) : <span className="text-surface-400">Not Linked</span>,
        },
        {
          key: "hospitalDetails.verificationStatus",
          label: "Verification",
          render: (_, row) => (
            row.hospitalDetails ? <StatusBadge status={row.hospitalDetails.verificationStatus} /> : "-"
          ),
        },
      ];
    }

    if (activeTab === "donor") {
      return [
        ...baseColumns,
        {
          key: "bloodGroup",
          label: "Blood Group",
          render: (val) => (
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
              {val || "-"}
            </span>
          ),
        },
        {
          key: "lastDonationDate",
          label: "Recent Activity",
          render: (_, row) => (
            <div className="text-sm">
              <div className="flex gap-1 items-center">
                <span className="font-medium text-surface-700">Last:</span>
                <span>{row.lastDonationDate ? formatDateTime(row.lastDonationDate).split(',')[0] : "Never"}</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="font-medium text-surface-700">Next:</span>
                <span className={row.nextEligibleDate && new Date(row.nextEligibleDate) < new Date() ? "text-green-600" : "text-amber-600"}>
                  {row.nextEligibleDate ? formatDateTime(row.nextEligibleDate).split(',')[0] : "-"}
                </span>
              </div>
            </div>
          ),
        },
        {
          key: "lastDonationRecord",
          label: "Last Location",
          render: (val) => val?.hospitalInfo?.name ? (
            <div className="text-sm text-surface-700">{val.hospitalInfo.name}</div>
          ) : <span className="text-surface-400">-</span>,
        },
        {
          key: "eligibilityStatus",
          label: "Status",
          render: (val) => (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${val === 'Eligible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {val}
            </span>
          ),
        }
      ];
    }

    if (activeTab === "patient") {
      return [
        ...baseColumns,
        {
          key: "bloodGroup",
          label: "Blood Group",
          render: (val) => (
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
              {val || "-"}
            </span>
          ),
        },
        {
          key: "totalUnitsRequired",
          label: "Blood Needed",
          render: (val) => <span className="font-bold text-red-600 px-2 py-1 bg-red-50 rounded-md">{val || 0} Units</span>,
        },
        {
          key: "requestedHospitals",
          label: "Associated Hospitals",
          render: (val) => (
            val && val.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {val.map((h, i) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{h}</span>)}
              </div>
            ) : <span className="text-surface-400">-</span>
          )
        },
        {
          key: "requestStatuses",
          label: "Request Overview",
          render: (val) => {
            if (!val || val.length === 0) return "-";
            const counts = val.reduce((acc, status) => {
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            return (
              <div className="flex flex-wrap gap-1">
                {Object.entries(counts).map(([status, count], idx) => (
                  <div key={idx} className="flex flex-col text-xs bg-gray-50 border px-1.5 py-0.5 rounded-sm">
                    <span className="font-bold">{count}</span>
                    <span className="text-surface-500" style={{ fontSize: '0.65rem' }}>{status}</span>
                  </div>
                ))}
              </div>
            );
          }
        }
      ];
    }

    return baseColumns;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">User Management</h1>
          <p className="text-surface-500 text-sm mt-1">Deep analysis mapping across role specific activities.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-surface-100 p-1 rounded-lg w-full max-w-md">
        {["hospital", "donor", "patient"].map((role) => (
          <button
            key={role}
            onClick={() => handleTabChange(role)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${activeTab === role
                ? "bg-white text-primary-600 shadow-sm"
                : "text-surface-600 hover:text-surface-900 hover:bg-surface-200"
              }`}
          >
            {role}s
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100">
        <FilterBar
          filters={getFilterConfig()}
          values={filters}
          onChange={handleFilterChange}
          searchPlaceholder={`Search ${activeTab}s by name or email...`}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={getColumns()}
          data={data.users}
          isLoading={isLoading}
          pagination={data.pagination}
          onPageChange={(p) => handleFilterChange("page", p)}
          onRowClick={handleUserClick}
          emptyTitle={`No ${activeTab}s found`}
          emptyMessage="Adjust search constraints to find users."
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="User Analysis Profile"
        size="lg"
      >
        {isDetailsLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : userDetails && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold border-2 border-white shadow-sm">
                {userDetails.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">{userDetails.name}</h2>
                <p className="text-surface-500">{userDetails.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-semibold rounded-full border border-primary-100 uppercase tracking-wider">
                    {userDetails.role}
                  </span>
                  {userDetails.bloodGroup && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100 uppercase tracking-wider">
                      Blood: {userDetails.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-surface-900 flex items-center gap-2 border-b pb-2">
                  Account Details
                </h3>
                <div className="space-y-3">
                  <DetailItem label="Phone" value={userDetails.phone || "Not Provided"} />
                  <DetailItem label="Joined On" value={formatDateTime(userDetails.createdAt)} />
                  <DetailItem
                    label="Verification"
                    value={
                      <div className="flex flex-col gap-1 mt-1">
                        <span className={`flex items-center gap-1.5 ${userDetails.isEmailVerified ? "text-green-600" : "text-amber-600"}`}>
                          {userDetails.isVerified ? "✓ Email Verified" : "○ Email Pending"}
                        </span>
                        {userDetails.role === "hospital" && (
                          <span className={`flex items-center gap-1.5 ${userDetails.isHospitalVerified ? "text-green-600" : "text-amber-600"}`}>
                            {userDetails.isHospitalVerified ? "✓ Hospital Verified" : "○ Hospital Pending"}
                          </span>
                        )}
                      </div>
                    }
                  />
                  <DetailItem label="Address" value={userDetails.address ? `${userDetails.address.street || ""}, ${userDetails.address.city || ""}, ${userDetails.address.state || ""}` : "N/A"} />
                </div>
              </div>

              <div className="space-y-4">
                {userDetails.role === "hospital" && userDetails.hospitalDetails && (
                  <>
                    <h3 className="font-bold text-surface-900 flex items-center gap-2 border-b pb-2">
                      Hospital Profile
                    </h3>
                    <div className="space-y-3">
                      <DetailItem label="Hospital Name" value={userDetails.hospitalDetails.name} />
                      <DetailItem label="License" value={userDetails.hospitalDetails.licenseNumber} />
                      <DetailItem label="Type" value={userDetails.hospitalDetails.type} />
                      <DetailItem label="Status" value={<StatusBadge status={userDetails.hospitalDetails.verificationStatus} />} />
                    </div>
                  </>
                )}

                {userDetails.role === "donor" && (
                  <>
                    <h3 className="font-bold text-surface-900 flex items-center gap-2 border-b pb-2">
                      Donation Status
                    </h3>
                    <div className="space-y-3">
                      <DetailItem label="Total Donations" value={userDetails.donations?.length || 0} />
                      <DetailItem label="Next Eligible" value={userDetails.nextEligibleDate ? formatDate(userDetails.nextEligibleDate) : "Now"} success={!userDetails.nextEligibleDate || new Date(userDetails.nextEligibleDate) < new Date()} />
                      <DetailItem label="Eligibility" value={userDetails.eligibilityStatus} success={userDetails.eligibilityStatus === "Eligible"} />
                    </div>
                  </>
                )}

                {userDetails.role === "patient" && (
                  <>
                    <h3 className="font-bold text-surface-900 flex items-center gap-2 border-b pb-2">
                      Request History
                    </h3>
                    
                    <div className="space-y-3">
                      <DetailItem label="Total Requests" value={userDetails.requests?.length || 0} />
                      <DetailItem label="Last Request" value={userDetails.requests?.[0] ? formatDate(userDetails.requests[0].createdAt) : "N/A"} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {userDetails.role === "donor" && userDetails.donations?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-surface-900 border-b pb-2">Recent Donations</h3>
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                  {userDetails.donations.map((d, i) => (
                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-white hover:bg-surface-50">
                      <div>
                        <div className="font-medium">{d.hospital?.name}</div>
                        <div className="text-surface-500 text-xs">{formatDate(d.donationDate)}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userDetails.role === "patient" && userDetails.requests?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-surface-900 border-b pb-2">Blood Requests</h3>
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                  {userDetails.requests.map((r, i) => (
                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-white hover:bg-surface-50">
                      <div>
                        <div className="font-medium">{r.unitsRequired} Units - {r.componentType}</div>
                        <div className="text-surface-500 text-xs">{formatDate(r.createdAt)} at {r.hospital?.name}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value, success }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">{label}</span>
      <div className={`text-sm font-semibold mt-0.5 ${success ? "text-green-600" : "text-surface-900"}`}>
        {value}
      </div>
    </div>
  );
}