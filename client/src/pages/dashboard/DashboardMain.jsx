import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { getMyRequests } from "../../store/requestSlice";
import { getMyHospitalProfile } from "../../store/hospitalSlice";
import requestApi from "../../api/requestApi";
import bloodStockApi from "../../api/bloodStockApi";
import transferApi from "../../api/transferApi";
import hospitalApi from "../../api/hospitalApi";
import complaintApi from "../../api/complaintApi";
import donationApi from "../../api/donationApi";
import StatsCard from "../../components/common/StatsCard";
import DataTable from "../../components/common/DataTable";
import BloodGroupBadge from "../../components/common/BloodGroupBadge";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/formatters";
import {
  HiHeart,
  HiClipboardList,
  HiClock,
  HiCheckCircle,
  HiBeaker,
  HiSwitchHorizontal,
  HiOfficeBuilding,
  HiExclamationCircle,
  HiUsers,
  HiBell,
  HiArrowCircleDown,
  HiArrowCircleUp,
} from "react-icons/hi";
import { getMyDonations } from "../../store/donationSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const POLL_INTERVAL = 30000;

const PatientDashboard = () => {
  const dispatch = useDispatch();
  const { requests: recentRequests, pagination, loading: reqLoading } = useSelector(state => state.request);

  const fetchData = useCallback(() => {
    dispatch(getMyRequests({ limit: 5 }));
  }, [dispatch]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = [
    { title: "Total Requests", value: pagination?.totalCount || 0, icon: HiClipboardList, color: "blue" },
    { title: "Pending", value: recentRequests.filter(r => r.status === "Pending").length, icon: HiClock, color: "orange" },
    { title: "Completed", value: recentRequests.filter(r => r.status === "Completed").length, icon: HiCheckCircle, color: "green" },
  ];

  const columns = [
    { key: "createdAt", label: "Date", render: (val) => formatDateTime(val) },
    { key: "bloodGroup", label: "Blood Group", render: (val) => <BloodGroupBadge group={val} /> },
    { key: "unitsRequired", label: "Units" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-surface-900">Recent Requests</h2>
          <Link to="/dashboard/requests" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</Link>
        </div>
        <DataTable columns={columns} data={recentRequests} isLoading={reqLoading} emptyMessage="You haven't made any requests yet." />
      </div>
    </div>
  );
};

const DonorDashboard = () => {
  const dispatch = useDispatch();
  const { pagination } = useSelector(state => state.donation);

  useEffect(() => {
    dispatch(getMyDonations({ limit: 1 }));
  }, [dispatch]);

  const total = pagination?.totalCount || 0;

  const stats = [
    { title: "Total Donations", value: total, icon: HiHeart, color: "red" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-primary-50 rounded-xl p-8 border border-primary-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <HiHeart className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Ready to save a life?</h2>
        <p className="text-surface-600 mb-6 max-w-md mx-auto">Schedule your next blood donation at a nearby hospital and help those in need.</p>
        <Link to="/dashboard/donations/new" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">
          Schedule Donation
        </Link>
      </div>
    </div>
  );
};

const HospitalDashboard = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { myProfile: hospital } = useSelector(state => state.hospital);

  const [requestStats, setRequestStats] = useState([]);
  const [stockStats, setStockStats] = useState([]);
  const [transferStats, setTransferStats] = useState(null);
  const [scheduledDonations, setScheduledDonations] = useState(0);
  const [testingUnits, setTestingUnits] = useState(0);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [escalatedRequests, setEscalatedRequests] = useState([]);

  useEffect(() => {
    if (user?.hospitalId && !hospital) {
      dispatch(getMyHospitalProfile());
    }
  }, [user?.hospitalId, dispatch, hospital]);

  const fetchDashboardData = useCallback(() => {
    if (user?.isHospitalVerified) {
      requestApi.getRequestStats().then(res => setRequestStats(res.data?.data || [])).catch(() => { });
      bloodStockApi.getBloodStockStats().then(res => setStockStats(res.data?.data || [])).catch(() => { });
      transferApi.getTransferStats().then(res => setTransferStats(res.data?.data || null)).catch(() => { });
      donationApi.getHospitalDonations({ status: "Scheduled", limit: 1 }).then(res => setScheduledDonations(res.data?.data?.pagination?.totalCount || 0)).catch(() => { });
      bloodStockApi.getBloodStock({ status: "Testing", limit: 1 }).then(res => setTestingUnits(res.data?.data?.pagination?.totalCount || 0)).catch(() => { });
      requestApi.getHospitalRequests({ urgency: "Emergency", status: "Pending", limit: 5 }).then(res => setEmergencyRequests(res.data?.data?.requests || [])).catch(() => { });
      requestApi.getHospitalRequests({ donorSearchFailed: true, limit: 5 }).then(res => setEscalatedRequests(res.data?.data?.requests || [])).catch(() => { });
    }
  }, [user?.isHospitalVerified]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (!user?.isHospitalVerified) {
    const isRejected = hospital?.verificationStatus === 'Rejected';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 text-center max-w-2xl mx-auto mt-8 animate-fade-in">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isRejected ? 'bg-red-50' : 'bg-primary-50'}`}>
          <HiOfficeBuilding className={`w-8 h-8 ${isRejected ? 'text-red-600' : 'text-primary-600'}`} />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          {isRejected ? "Hospital Registration Rejected" : "Hospital Registration Setup"}
        </h2>
        <div className="text-surface-600 mb-6">
          {isRejected
            ? (
              <div className="space-y-3">
                <p className="text-red-700 font-medium max-w-lg mx-auto">Your registration request was rejected by the admin because of the following reason:</p>
                <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {hospital?.rejectionReason || "No explicit reason provided."}
                </div>
                <p className="text-surface-600">Please view your profile for details and update your application.</p>
              </div>
            )
            : user?.hospitalId
              ? <p>Your hospital registration request has been sent to the admin and is currently pending approval. You will gain full dashboard access once approved.</p>
              : <p>Please complete your hospital profile registration. After applying, your registration approval request will be sent to the admin.</p>
          }
        </div>
        <Link to="/dashboard/hospital-profile" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">
          {user?.hospitalId ? "View Profile Status" : "Register Hospital Profile"}
        </Link>
      </div>
    );
  }

  const pendingRequests = requestStats?.statusStats?.find?.(s => s._id === "Pending")?.count || 0;
  const approvedRequests = requestStats?.statusStats?.find?.(s => s._id === "Approved")?.count || 0;
  const awaitingDonor = requestStats?.statusStats?.find?.(s => s._id === "Awaiting Donor")?.count || 0;
  const transferRequired = requestStats?.statusStats?.find?.(s => s._id === "Transfer Required")?.count || 0;

  const totalStock = stockStats?.overview?.[0]?.totalUnits || 0;
  const activeTransfers = transferStats?.totalTransfers || 0;

  const chartData = Array.isArray(stockStats?.byBloodGroup)
    ? stockStats.byBloodGroup.map(s => ({
      bloodGroup: s._id || "Unknown",
      units: s.available || 0,
    }))
    : [];

  const stats = [
    { title: "Scheduled Donors", value: scheduledDonations, icon: HiUsers, color: "pink" },
    { title: "Testing Blood Units", value: testingUnits, icon: HiBeaker, color: "purple" },
    { title: "Pending Requests", value: pendingRequests, icon: HiClock, color: "orange" },
    { title: "Incoming Transfers", value: transferStats?.pendingIncoming || 0, icon: HiArrowCircleDown, color: "cyan" },
    { title: "Outgoing Transfers", value: transferStats?.pendingOutgoing || 0, icon: HiArrowCircleUp, color: "indigo" },
    { title: "Awaiting Donor", value: awaitingDonor, icon: HiBell, color: "purple" },
    // { title: "Transfer Required", value: transferRequired, icon: HiSwitchHorizontal, color: "blue" },
    { title: "Total Blood Units", value: totalStock, icon: HiBeaker, color: "red" },
  ];

  return (
    <div className="space-y-6">
      {emergencyRequests.length > 0 && (
        <div className="bg-red-600 rounded-xl p-4 text-white shadow-lg animate-pulse border-2 border-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-full">
              <HiBell className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none uppercase">Action Required: {emergencyRequests.length} Emergency Requests!</p>
              <p className="text-white/80 text-sm mt-1">Check the request list to allocate stock or initiate transfers immediately.</p>
            </div>
          </div>
          <Link to="/dashboard/requests?urgency=Emergency" className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition shadow-sm">
            Handle Now
          </Link>
        </div>
      )}

      {/* {escalatedRequests.length > 0 && (
        <div className="bg-orange-600 rounded-xl p-4 text-white shadow-lg animate-bounce border-2 border-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-full">
              <HiExclamationCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none uppercase">CRITICAL: No Donors Available for {escalatedRequests.length} Requests!</p>
              <p className="text-white/80 text-sm mt-1">Manual escalation required. Please contact external blood banks immediately.</p>
            </div>
          </div>
          <Link to="/dashboard/requests?donorSearchFailed=true" className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition shadow-sm">
            Escalate Now
          </Link>
        </div>
      )} */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
        <h2 className="text-lg font-bold text-surface-900 mb-4">System Processing Statuses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></span>
            <div>
              <p className="text-sm font-semibold text-green-800">AUTO APPROVED</p>
              <p className="text-xs text-green-700">Same hospital stock available — system auto-approves the request.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>
            <div>
              <p className="text-sm font-semibold text-blue-800">TRANSFER REQUIRED</p>
              <p className="text-xs text-blue-700">Stock not available locally — requires transfer from another center.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mt-1 flex-shrink-0"></span>
            <div>
              <p className="text-sm font-semibold text-purple-800">AWAITING DONOR</p>
              <p className="text-xs text-purple-700">No stock anywhere — waiting for donor to schedule and donate.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
          <h2 className="text-lg font-bold text-surface-900 mb-4">Stock Overview by Blood Group</h2>
          {chartData.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {chartData.map(group => (
                <div key={group.bloodGroup} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-100 shadow-sm flex items-center gap-1.5">
                  <span className="text-lg">{group.bloodGroup}</span>
                  <span className="text-red-300">|</span>
                  <span>{group.units} Units</span>
                </div>
              ))}
            </div>
          )}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bloodGroup" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Bar dataKey="units" fill="#dc2626" radius={[6, 6, 0, 0]} name="Units" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg text-surface-400 text-sm">
              No blood stock data available yet
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
          <h2 className="text-lg font-bold text-surface-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/dashboard/requests" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <HiClipboardList className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">View Patient Requests</p>
                <p className="text-xs text-surface-500">{pendingRequests} pending requests need attention</p>
              </div>
            </Link>
            <Link to="/dashboard/blood-stock" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <HiBeaker className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Manage Blood Stock</p>
                <p className="text-xs text-surface-500">{totalStock} total units in inventory</p>
              </div>
            </Link>
            <Link to="/dashboard/transfers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <HiSwitchHorizontal className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">View Transfers</p>
                <p className="text-xs text-surface-500">{activeTransfers} active transfers</p>
              </div>
            </Link>
            <Link to="/dashboard/donations" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <HiHeart className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Donor Management</p>
                <p className="text-xs text-surface-500">{scheduledDonations} donors scheduled for screening</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [reqStats, setReqStats] = useState(null);
  const [transStats, setTransStats] = useState(null);
  const [stockStats, setStockStats] = useState(null);
  const [hospitalCounts, setHospitalCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [complaintCounts, setComplaintCounts] = useState({ open: 0, inReview: 0, total: 0 });
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [escalatedRequests, setEscalatedRequests] = useState([]);

  const fetchData = useCallback(() => {
    requestApi.getRequestStats().then(res => setReqStats(res.data?.data || null)).catch(() => { });
    transferApi.getTransferStats().then(res => setTransStats(res.data?.data || null)).catch(() => { });
    bloodStockApi.getBloodStockStats().then(res => setStockStats(res.data?.data || null)).catch(() => { });

    hospitalApi.getHospitals({ status: "Pending", limit: 5 })
      .then(res => {
        const data = res.data?.data;
        setHospitalCounts(prev => ({ ...prev, pending: data?.pagination?.totalCount || 0 }));
        setPendingHospitals(data?.hospitals || []);
      }).catch(() => { });

    hospitalApi.getHospitals({ status: "Approved", limit: 1 })
      .then(res => {
        setHospitalCounts(prev => ({ ...prev, approved: res.data?.data?.pagination?.totalCount || 0 }));
      }).catch(() => { });

    hospitalApi.getHospitals({ limit: 1 })
      .then(res => {
        setHospitalCounts(prev => ({ ...prev, total: res.data?.data?.pagination?.totalCount || 0 }));
      }).catch(() => { });

    complaintApi.getAllComplaints({ status: "Open", limit: 1 })
      .then(res => {
        setComplaintCounts(prev => ({ ...prev, open: res.data?.data?.pagination?.totalCount || res.data?.data?.length || 0, total: (res.data?.data?.pagination?.totalCount || 0) }));
      }).catch(() => { });

    requestApi.getAllRequests({ donorSearchFailed: true, limit: 5 })
      .then(res => setEscalatedRequests(res.data?.data?.requests || [])).catch(() => { });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalReq = reqStats?.totalRequests || 0;
  const totalTrans = transStats?.totalTransfers || 0;
  const adminTotalUnits = stockStats?.overview?.[0]?.totalUnits || 0;

  const stats = [
    { title: "Pending Hospital Requests", value: hospitalCounts.pending, icon: HiOfficeBuilding, color: "orange" },
    { title: "Approved Hospitals", value: hospitalCounts.approved, icon: HiOfficeBuilding, color: "green" },
    { title: "Emergency Requests", value: reqStats?.urgencyStats?.find(s => s._id === "Emergency")?.count || 0, icon: HiBell, color: "red" },
    { title: "Total Blood Units", value: adminTotalUnits, icon: HiBeaker, color: "red" },
    { title: "Platform Transfers", value: totalTrans, icon: HiSwitchHorizontal, color: "cyan" },
    { title: "Open Complaints", value: complaintCounts.open, icon: HiExclamationCircle, color: "red" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      {/* {escalatedRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <HiExclamationCircle className="w-6 h-6 animate-pulse" />
              Donor Search Escalation Queue ({escalatedRequests.length})
            </h2>
            <Link to="/dashboard/requests?donorSearchFailed=true" className="text-sm font-bold text-red-600 hover:text-red-700">View All Escalations →</Link>
          </div>
          <div className="divide-y divide-red-50">
            {escalatedRequests.map(req => (
              <div key={req._id} className="p-4 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-red-600 text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <p className="font-bold text-surface-900">{req.patient?.name || 'Emergency Patient'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-surface-500">
                        {req.hospital?.name} • {req.componentType} • {req.unitsRequired} Units
                      </p>
                      {['O-', 'AB-'].includes(req.bloodGroup) && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse">RARE</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-1 rounded">No Donor Found</p>
                  <p className="text-xs text-surface-400 mt-1">{formatDateTime(req.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {stockStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <HiBeaker className="w-5 h-5 text-red-500" />
              Blood Group Distribution (Available)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockStats.byBloodGroup?.map(s => ({ name: s._id, units: s.available })) || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="units" fill="#ef4444" radius={[4, 4, 0, 0]} name="Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {stockStats.byBloodGroup?.slice(0, 8).map((c) => (
                <div key={c._id} className="text-center p-2 rounded-lg bg-surface-50 border border-surface-100">
                  <p className="text-xs font-bold text-surface-900">{c._id}</p>
                  <p className="text-[10px] text-red-600 font-semibold">{c.available}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <HiOfficeBuilding className="w-5 h-5 text-blue-500" />
              Hospital-wise Stock (Available)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stockStats.byHospital?.slice(0, 6).map(h => ({ name: h.name, units: h.available })) || []}
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="units" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {stockStats.byHospital?.map((h) => (
                <div key={h.name} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <span className="text-xs font-medium text-surface-900 truncate max-w-[180px]" title={h.name}>{h.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{h.available} U</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stockStats?.byComponentType && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 mt-6">
          <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
            <HiBeaker className="w-5 h-5 text-purple-500" />
            Platform-wide Component Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stockStats.byComponentType.map((c) => (
              <div key={c._id} className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-center">
                <p className="text-sm text-purple-600 font-medium">{c._id}</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{c.available}</p>
                <p className="text-[10px] text-purple-400 mt-1 uppercase tracking-wider font-semibold">Total Available Units</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingHospitals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <HiOfficeBuilding className="w-5 h-5 text-orange-500" />
              Pending Hospital Approvals
            </h2>
            <Link to="/dashboard/hospitals" className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingHospitals.slice(0, 5).map((h) => (
              <div key={h._id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                <div>
                  <p className="text-sm font-medium text-surface-900">{h.name}</p>
                  <p className="text-xs text-surface-500">
                    {h.address?.city}, {h.address?.state} • License: {h.licenseNumber}
                  </p>
                </div>
                <Link
                  to="/dashboard/hospitals"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 text-red-500" />
            Complaints Overview
          </h2>
          <Link to="/dashboard/complaints" className="text-sm text-primary-600 font-medium hover:text-primary-700">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-red-50 border border-red-100">
            <p className="text-2xl font-bold text-red-700">{complaintCounts.open}</p>
            <p className="text-xs text-red-600 font-medium mt-1">Open Complaints</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-700">{complaintCounts.inReview}</p>
            <p className="text-xs text-yellow-600 font-medium mt-1">In Review</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-surface-50 border border-surface-200">
            <p className="text-2xl font-bold text-surface-700">{complaintCounts.total}</p>
            <p className="text-xs text-surface-500 font-medium mt-1">Total Complaints</p>
          </div>
        </div>
      </div>
    </div>
  );
};



export default function DashboardMain() {
  const { user, isPatient, isDonor, isHospital, isAdmin } = useAuth();

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500">Welcome back, {user?.name}</p>
      </div>

      {isPatient && <PatientDashboard />}
      {isDonor && <DonorDashboard />}
      {isHospital && <HospitalDashboard />}
      {isAdmin && <AdminDashboard />}
    </div>
  );
}