import { useState, useEffect } from "react";
import bloodStockApi from "../../api/bloodStockApi";
import { Link } from "react-router-dom";
import { HiHeart, HiSearch, HiLocationMarker, HiOfficeBuilding } from "react-icons/hi";
import { BLOOD_GROUPS } from "../../utils/constants";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import BloodGroupBadge from "../../components/common/BloodGroupBadge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatRelativeTime } from "../../utils/formatters";

export default function SearchBloodPage() {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    city: "",
  });

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!filters.bloodGroup && !filters.city) {
      setData([]);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await bloodStockApi.getAvailableBloodStock(filters);
        setData(res.data?.data?.stocks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const stocks = data;

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <HiHeart className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-surface-900">Life Flow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-surface-900">Find Blood Availability</h1>
          <p className="text-surface-500 mt-2">Search for available blood stock in nearby hospitals</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Select
                label="Blood Group"
                placeholder="Select Blood Group"
                options={BLOOD_GROUPS}
                value={filters.bloodGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, bloodGroup: e.target.value }))}
              />
            </div>
            <div className="flex-1 w-full">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLocationMarker className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter city..."
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 pl-9 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto h-[38px]"
              disabled={isLoading}
            >
              <HiSearch className="w-5 h-5" /> Search
            </Button>
          </form>
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-20" />
        ) : (!filters.bloodGroup && !filters.city) ? (
          <EmptyState
            title="Search for Blood"
            message="Please select a blood group or enter a city to see available blood stock."
            icon={HiSearch}
          />
        ) : stocks.length === 0 ? (
          <EmptyState
            title="No Results Found"
            message="We couldn't find any available blood stock matching your current search criteria."
          />
        ) : (
          <div className="animate-fade-in grid gap-4">
            {stocks.map((stock) => (
              <div key={stock._id} className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0">
                    <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100 shadow-sm">
                      <BloodGroupBadge group={stock._id.bloodGroup} />
                      <p className="text-xs font-semibold text-surface-500 mt-1">{stock._id.componentType}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <HiOfficeBuilding className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold text-surface-900">{stock.hospitalDetails.hospitalName}</h3>
                    </div>
                    <p className="text-sm text-surface-500 flex items-center gap-1">
                      <HiLocationMarker className="w-4 h-4" />
                      {stock.hospitalDetails.address.city}, {stock.hospitalDetails.address.state}
                    </p>
                    <p className="text-xs text-surface-400 mt-2">
                      Last updated: {formatRelativeTime(stock.latestUpdate)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end border-t sm:border-t-0 sm:border-l border-surface-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                  <p className="text-surface-500 text-sm">Available Units</p>
                  <p className="text-3xl font-bold text-primary-600">{stock.totalUnits}</p>
                  <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium underline mt-2">
                    Login to Request
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
