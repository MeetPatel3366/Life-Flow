import { Outlet, Link } from "react-router-dom";
import { HiHeart, HiArrowLeft } from "react-icons/hi";
import { useEffect, useState } from "react";
import authApi from "../api/authApi";

export default function AuthLayout() {
  const [stats, setStats] = useState({ donors: 0, hospitals: 0, livesSaved: 0 });

  useEffect(() => {
    authApi.getPublicStats().then((res) => {
      if (res.data?.success) {
        setStats(res.data.data);
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <HiHeart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">Life Flow</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            Blood Bank Management System — Connecting donors, patients, and
            hospitals to save lives.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">
                {stats.donors > 1000
                  ? `${(stats.donors / 1000).toFixed(1)}K+`
                  : stats.donors}
              </p>
              <p className="text-sm text-white/60 mt-1">Donors</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {stats.hospitals > 1000
                  ? `${(stats.hospitals / 1000).toFixed(1)}K+`
                  : stats.hospitals}
              </p>
              <p className="text-sm text-white/60 mt-1">Hospitals</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {stats.livesSaved > 1000
                  ? `${(stats.livesSaved / 1000).toFixed(1)}K+`
                  : stats.livesSaved}
              </p>
              <p className="text-sm text-white/60 mt-1">Lives Saved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 lg:px-12">
          <div className="lg:hidden flex items-center gap-2">
            <HiHeart className="w-6 h-6 text-primary-600" />
            <Link to="/" className="text-xl font-bold text-surface-900">
              Life Flow
            </Link>
          </div>
          <div className="hidden lg:block"></div>
          <Link
            to="/"
            className="flex items-center gap-2 text-surface-500 hover:text-primary-600 font-medium transition-colors text-sm"
          >
            <HiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}