import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bloodStockApi from "../../../api/bloodStockApi";
import { BLOOD_GROUPS, COMPONENT_TYPES } from "../../../utils/constants";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../../utils/formatters";

export default function NewBloodStock() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    bloodGroup: "",
    componentType: "Whole Blood",
    volume: 450,
    collectionDate: new Date().toISOString().split("T")[0],
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const payload = {
        ...form,
        volume: Number(form.volume),
      };
      await bloodStockApi.createBloodStock(payload);
      toast.success("Blood stock added successfully!");
      navigate("/dashboard/blood-stock");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to add blood stock");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Add External Blood Stock</h1>
        <p className="text-surface-500 text-sm mt-1">Manually add blood stock that was not collected through the app's donation flow.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Blood Group" 
              placeholder="Select Group" 
              required 
              options={BLOOD_GROUPS} 
              value={form.bloodGroup} 
              onChange={set("bloodGroup")} 
            />
            <Select 
              label="Component Type" 
              required 
              options={COMPONENT_TYPES} 
              value={form.componentType} 
              onChange={set("componentType")} 
            />
            <Input 
              label="Volume (ml)" 
              type="number" 
              min="50" 
              max="1000" 
              required 
              value={form.volume} 
              onChange={set("volume")} 
              placeholder="e.g. 450"
            />
            <Input 
              label="Collection Date" 
              type="date" 
              max={today} 
              required 
              value={form.collectionDate} 
              onChange={set("collectionDate")} 
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800">
            <strong>Note:</strong> Addition of manual inventory should only be performed for external or legacy bulk imports. Normal stock should flow through the Donation module. Expiry will be automatically calculated based on the component type from the collection date.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Add Stock Unit</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
