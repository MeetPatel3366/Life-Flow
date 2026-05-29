export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const COMPONENT_TYPES = ["Whole Blood", "RBC", "Plasma", "Platelets"];

export const REQUEST_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Awaiting Donor",
  "Transfer Required",
  "Ready for Issue",
  "Completed",
  "Cancelled",
];

export const DONATION_STATUSES = [
  "Scheduled",
  "Screening",
  "Completed",
  "Deferred",
  "Cancelled",
];

export const BLOOD_STOCK_STATUSES = [
  "Testing",
  "Available",
  "Reserved",
  "In Transit",
  "Issued",
  "Used",
  "Expired",
  "Discarded",
];

export const TRANSFER_STATUSES = [
  "Pending Approval",
  "Approved",
  "Dispatched",
  "Delivered",
  "Completed",
  "Cancelled",
];

export const COMPLAINT_STATUSES = [
  "Open",
  "In Review",
  "Resolved",
  "Rejected",
  "Closed",
];

export const COMPLAINT_CATEGORIES = [
  "Blood Request Issue",
  "Donation Issue",
  "Hospital Staff Behavior",
  "Delay in Service",
  "System Error",
  "Other",
];

export const CONTACT_STATUSES = ["Unread", "Read", "Replied"];

export const URGENCY_LEVELS = ["Normal", "Emergency"];

export const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Awaiting Donor": "bg-purple-100 text-purple-800",
  "Transfer Required": "bg-blue-100 text-blue-800",
  "Ready for Issue": "bg-emerald-100 text-emerald-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  Scheduled: "bg-blue-100 text-blue-800",
  Screening: "bg-indigo-100 text-indigo-800",
  Deferred: "bg-orange-100 text-orange-800",
  Open: "bg-blue-100 text-blue-800",
  "In Review": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-600",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Dispatched: "bg-cyan-100 text-cyan-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Testing: "bg-purple-100 text-purple-800",
  Available: "bg-green-100 text-green-800",
  Reserved: "bg-yellow-100 text-yellow-800",
  "In Transit": "bg-blue-100 text-blue-700",
  Issued: "bg-indigo-100 text-indigo-700",
  Expired: "bg-red-100 text-red-800",
  Used: "bg-gray-100 text-gray-600",
  Discarded: "bg-red-100 text-red-700",
  Unread: "bg-blue-100 text-blue-800",
  Read: "bg-yellow-100 text-yellow-800",
  Replied: "bg-green-100 text-green-800",
};

export const BLOOD_GROUP_COLORS = {
  "A+": "bg-red-500",
  "A-": "bg-red-600",
  "B+": "bg-blue-500",
  "B-": "bg-blue-600",
  "AB+": "bg-purple-500",
  "AB-": "bg-purple-600",
  "O+": "bg-green-500",
  "O-": "bg-green-600",
};

export const ROLE_MENU = {
  patient: [
    { label: "Dashboard", path: "/dashboard", icon: "HiHome" },
    { label: "My Requests", path: "/dashboard/requests", icon: "HiClipboardList" },
    { label: "New Request", path: "/dashboard/requests/new", icon: "HiPlus" },
    { label: "Complaints", path: "/dashboard/complaints", icon: "HiExclamationCircle" },
    { label: "Profile", path: "/dashboard/profile", icon: "HiUser" },
  ],
  donor: [
    { label: "Dashboard", path: "/dashboard", icon: "HiHome" },
    { label: "My Donations", path: "/dashboard/donations", icon: "HiHeart" },
    { label: "Schedule Donation", path: "/dashboard/donations/new", icon: "HiPlus" },
    { label: "Complaints", path: "/dashboard/complaints", icon: "HiExclamationCircle" },
    { label: "Profile", path: "/dashboard/profile", icon: "HiUser" },
  ],
  hospital: [
    { label: "Dashboard", path: "/dashboard", icon: "HiHome" },
    { label: "Blood Stock", path: "/dashboard/blood-stock", icon: "HiBeaker" },
    { label: "Requests", path: "/dashboard/requests", icon: "HiClipboardList" },
    { label: "Transfers", path: "/dashboard/transfers", icon: "HiSwitchHorizontal" },
    { label: "Donations", path: "/dashboard/donations", icon: "HiHeart" },
    { label: "Complaints", path: "/dashboard/complaints", icon: "HiExclamationCircle" },
    { label: "Hospital Profile", path: "/dashboard/hospital-profile", icon: "HiOfficeBuilding" },
    { label: "Profile", path: "/dashboard/profile", icon: "HiUser" },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: "HiHome" },
    { label: "User Management", path: "/dashboard/users", icon: "HiUsers" },
    { label: "All Requests", path: "/dashboard/requests", icon: "HiClipboardList" },
    { label: "Hospitals", path: "/dashboard/hospitals", icon: "HiOfficeBuilding" },
    { label: "All Complaints", path: "/dashboard/complaints", icon: "HiExclamationCircle" },
    { label: "Transfers", path: "/dashboard/transfers", icon: "HiSwitchHorizontal" },
    { label: "Blood Stock", path: "/dashboard/blood-stock", icon: "HiBeaker" },
    { label: "Donations", path: "/dashboard/donations", icon: "HiHeart" },
    { label: "Contact Messages", path: "/dashboard/contact-messages", icon: "HiMail" },
  ],
};
