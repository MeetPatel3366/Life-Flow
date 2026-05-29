import { BLOOD_GROUP_COLORS } from "../../utils/constants";

export default function BloodGroupBadge({ group }) {
  const bg = BLOOD_GROUP_COLORS[group] || "bg-gray-500";
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${bg}`}>
      {group}
    </span>
  );
}