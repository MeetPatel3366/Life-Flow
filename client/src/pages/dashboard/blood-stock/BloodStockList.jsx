import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getBloodStock } from "../../../store/bloodStockSlice";
import { useAuth } from "../../../hooks/useAuth";
import donationApi from "../../../api/donationApi";
import bloodStockApi from "../../../api/bloodStockApi";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import BloodGroupBadge from "../../../components/common/BloodGroupBadge";
import Button from "../../../components/ui/Button";
import { BLOOD_GROUPS, COMPONENT_TYPES, BLOOD_STOCK_STATUSES } from "../../../utils/constants";
import { HiPlus, HiX, HiBeaker } from "react-icons/hi";
import toast from "react-hot-toast";

const LAB_TESTS = [
  { key: "hiv", label: "HIV" },
  { key: "hepatitisB", label: "Hepatitis B" },
  { key: "hepatitisC", label: "Hepatitis C" },
  { key: "malaria", label: "Malaria" },
  { key: "syphilis", label: "Syphilis" },
];

export default function BloodStockList() {
  const { isHospital, isAdmin } = useAuth();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ page: 1, limit: 10, bloodGroup: "", componentType: "", status: "", hospitalId: "" });
  const [hospitals, setHospitals] = useState([]);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [labData, setLabData] = useState({
    hiv: "Negative",
    hepatitisB: "Negative",
    hepatitisC: "Negative",
    malaria: "Negative",
    syphilis: "Negative",
  });
  const [labSubmitting, setLabSubmitting] = useState(false);

  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [selectedSplitStock, setSelectedSplitStock] = useState(null);
  const [createPlatelets, setCreatePlatelets] = useState(false);
  const [splitSubmitting, setSplitSubmitting] = useState(false);

  const { stock: stocks, pagination, loading: isLoading } = useSelector(state => state.bloodStock);

  const [totalUnits, setTotalUnits] = useState(0);

  useEffect(() => {
    if (isHospital) {
      bloodStockApi.getBloodStockStats().then(res => {
        setTotalUnits(res.data?.data?.overview?.[0]?.totalUnits || 0);
      }).catch(() => { });
    }
    if (isAdmin) {
      import("../../../api/hospitalApi").then(m => {
        m.default.getHospitals({ limit: 100 }).then(res => {
          setHospitals(res.data?.data?.hospitals || []);
        });
      }).catch(() => { });
    }
  }, [isHospital, isAdmin]);

  useEffect(() => {
    const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
    dispatch(getBloodStock(queryParams));
  }, [filters, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const openLabModal = (stock) => {
    setSelectedStock(stock);
    setLabData({
      hiv: "Negative",
      hepatitisB: "Negative",
      hepatitisC: "Negative",
      malaria: "Negative",
      syphilis: "Negative",
    });
    setLabModalOpen(true);
  };

  const handleLabSubmit = async () => {
    if (!selectedStock?.donation?._id && !selectedStock?.donation) return;

    const donationId = typeof selectedStock.donation === "object"
      ? selectedStock.donation._id
      : selectedStock.donation;

    try {
      setLabSubmitting(true);
      await donationApi.updateLabTests(donationId, labData);

      const hasPositive = Object.values(labData).some(v => v === "Positive");
      toast.success(
        hasPositive
          ? "Lab tests updated. Blood stock discarded due to positive result."
          : "Lab tests passed! Blood stock is now available."
      );

      setLabModalOpen(false);
      setSelectedStock(null);

      const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
      dispatch(getBloodStock(queryParams));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lab tests");
    } finally {
      setLabSubmitting(false);
    }
  };

  const openSplitModal = (stock) => {
    setSelectedSplitStock(stock);
    setCreatePlatelets(false);
    setSplitModalOpen(true);
  };

  const handleSplitSubmit = async () => {
    if (!selectedSplitStock?._id) return;

    try {
      setSplitSubmitting(true);
      await bloodStockApi.separateComponents(selectedSplitStock._id, { createPlatelets });

      toast.success("Components separated successfully");

      setSplitModalOpen(false);
      setSelectedSplitStock(null);

      const queryParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
      dispatch(getBloodStock(queryParams));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to separate components");
    } finally {
      setSplitSubmitting(false);
    }
  };

  const columns = [
    { key: "bloodGroup", label: "Blood Group", render: (_, row) => <BloodGroupBadge group={row.bloodGroup} /> },
    { key: "componentType", label: "Component", render: (_, row) => row.componentType },
    { key: "status", label: "Status", render: (_, row) => <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Testing' ? 'bg-purple-100 text-purple-800' : row.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{row.status}</span> },
    { key: "expiryDate", label: "Expiry Date", render: (_, row) => <span className="text-sm">{new Date(row.expiryDate).toLocaleDateString()}</span> },
    { key: "quantity", label: "Available Units", render: (_, row) => <span className="font-bold text-lg">{row.quantity}</span> },
  ];

  if (isHospital) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const actions = [];
        if (row.status === "Testing") {
          actions.push(
            <button
              key="lab"
              onClick={(e) => { e.stopPropagation(); openLabModal(row); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md mb-1"
            >
              <HiBeaker className="w-3.5 h-3.5" />
              Lab Test
            </button>
          );
        }

        if (row.status === "Available" && row.componentType === "Whole Blood" && !row.isComponentSeparated && row.hospital?.hasComponentSeparation) {
          actions.push(
            <button
              key="split"
              onClick={(e) => { e.stopPropagation(); openSplitModal(row); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <HiPlus className="w-3.5 h-3.5" />
              Split Blood
            </button>
          );
        }

        return actions.length > 0 ? <div className="flex flex-col gap-1 items-start">{actions}</div> : <span className="text-surface-300 text-xs">—</span>;
      },
    });
  }

  if (isAdmin) {
    const qtyIndex = columns.findIndex(col => col.key === "quantity");
    columns.splice(qtyIndex, 0, { key: "hospitalDetails", label: "Hospital", render: (_, row) => row.hospital?.name || "N/A" });
  }

  const filterConfig = [
    { key: "status", label: "Status", options: BLOOD_STOCK_STATUSES },
    { key: "bloodGroup", label: "Blood Group", options: BLOOD_GROUPS },
    { key: "componentType", label: "Component", options: COMPONENT_TYPES },
    ...(isAdmin ? [{
      key: "hospitalId",
      label: "Hospital",
      options: [
        { label: "All Hospitals", value: "" },
        ...hospitals.map(h => ({ label: h.name, value: h._id }))
      ]
    }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">Blood Stock</h1>
            {isHospital && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full border border-red-200">
                Total Available: {totalUnits} Units
              </span>
            )}
          </div>
          <p className="text-surface-500 text-sm mt-1">Manage physical blood inventory</p>
        </div>
        {isHospital && (
          <Link to="/dashboard/blood-stock/new">
            <Button>
              <HiPlus className="w-5 h-5" /> Add Stock
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
          data={Array.isArray(stocks) ? stocks : stocks?.bloodStocks}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          emptyTitle="No blood stock found"
          emptyMessage="No inventory matches the current filters."
        />
      </div>

      {labModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !labSubmitting && setLabModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiBeaker className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Lab Test Results</h2>
                  <p className="text-purple-100 text-xs">
                    {selectedStock?.bloodGroup} — {selectedStock?.componentType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !labSubmitting && setLabModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-surface-600">
                Select the result for each test. If any test is <span className="text-red-600 font-semibold">Positive</span>, the blood stock will be automatically discarded.
              </p>

              <div className="space-y-3">
                {LAB_TESTS.map((test) => (
                  <div
                    key={test.key}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${labData[test.key] === "Positive"
                        ? "border-red-200 bg-red-50"
                        : "border-surface-200 bg-surface-50"
                      }`}
                  >
                    <span className="text-sm font-medium text-surface-800">{test.label}</span>
                    <div className="flex rounded-lg overflow-hidden border border-surface-300">
                      <button
                        type="button"
                        onClick={() => setLabData(prev => ({ ...prev, [test.key]: "Negative" }))}
                        className={`px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${labData[test.key] === "Negative"
                            ? "bg-green-600 text-white shadow-inner"
                            : "bg-white text-surface-500 hover:bg-surface-100"
                          }`}
                      >
                        Negative
                      </button>
                      <button
                        type="button"
                        onClick={() => setLabData(prev => ({ ...prev, [test.key]: "Positive" }))}
                        className={`px-3 py-1.5 text-xs font-semibold transition-all duration-200 border-l border-surface-300 ${labData[test.key] === "Positive"
                            ? "bg-red-600 text-white shadow-inner"
                            : "bg-white text-surface-500 hover:bg-surface-100"
                          }`}
                      >
                        Positive
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {Object.values(labData).some(v => v === "Positive") && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> Positive results detected. Submitting will discard this blood stock and defer the donation.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-surface-50 border-t border-surface-200 flex justify-end gap-3">
              <button
                onClick={() => setLabModalOpen(false)}
                disabled={labSubmitting}
                className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLabSubmit}
                disabled={labSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {labSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <HiBeaker className="w-4 h-4" />
                    Submit Results
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {splitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !splitSubmitting && setSplitModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Split Blood Components</h2>
                  <p className="text-blue-100 text-xs">
                    {selectedSplitStock?.bloodGroup} — Whole Blood
                  </p>
                </div>
              </div>
              <button
                onClick={() => !splitSubmitting && setSplitModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-surface-600">
                Splitting this Whole Blood unit will create <strong>RBC</strong> and <strong>Plasma</strong> components.
              </p>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 bg-surface-50 cursor-pointer hover:bg-surface-100 transition-colors">
                <input
                  type="checkbox"
                  checked={createPlatelets}
                  onChange={(e) => setCreatePlatelets(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-surface-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="font-semibold text-surface-800 text-sm">Create Platelets Component</p>
                  <p className="text-xs text-surface-500">Check this if you also extracted platelets.</p>
                </div>
              </label>
            </div>

            <div className="px-6 py-4 bg-surface-50 border-t border-surface-200 flex justify-end gap-3">
              <button
                onClick={() => setSplitModalOpen(false)}
                disabled={splitSubmitting}
                className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSplitSubmit}
                disabled={splitSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {splitSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <HiPlus className="w-4 h-4" />
                    Split Components
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}