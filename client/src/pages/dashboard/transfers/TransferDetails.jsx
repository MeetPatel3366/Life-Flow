import { useParams, useNavigate } from "react-router-dom";
import transferApi from "../../../api/transferApi";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDateTime } from "../../../utils/formatters";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TransferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfer = async () => {
    try {
      setIsLoading(true);
      const res = await transferApi.getTransferById(id);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load transfer details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  const transfer = data?.data;

  const [dispatchModal, setDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ transportMode: "Ambulance", trackingNumber: "" });

  if (isLoading) return <Spinner size="lg" className="py-20" />;
  if (!transfer) return <div className="text-center py-20 text-surface-500">Transfer not found.</div>;

  const handleAction = async (actionText, actionFn) => {
    try {
      await actionFn();
      toast.success(actionText);
      fetchTransfer();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleApprove = () => handleAction("Transfer approved", () => transferApi.approveTransfer(id));
  const handleDispatch = () => handleAction("Transfer dispatched", () => {
    setDispatchModal(false);
    return transferApi.dispatchTransfer(id, { 
      transportMode: dispatchForm.transportMode, 
      trackingNumber: dispatchForm.trackingNumber 
    });
  });
  const handleDelivered = () => handleAction("Transfer delivered", () => transferApi.markDelivered(id));
  const handleComplete = () => handleAction("Transfer marked as completed", () => transferApi.completeTransfer(id));

  const isSource = transfer.isSourceHospital;
  const isDest = transfer.isDestinationHospital;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            Transfer #{transfer._id.slice(-6).toUpperCase()}
            {transfer.priority === 'Emergency' && (
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs animate-pulse ring-2 ring-red-100">EMERGENCY</span>
            )}
            <StatusBadge status={transfer.status} />
          </h1>
          <p className="text-surface-500 text-sm mt-1">Initiated on {formatDateTime(transfer.createdAt)}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Hospitals
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Source (Provider)</span>
              <div className="text-right">
                <p className="font-medium text-surface-900">{transfer.fromHospital?.name}</p>
                <p className="text-sm text-surface-500">{transfer.fromHospital?.phone}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Destination (Requester)</span>
              <div className="text-right">
                <p className="font-medium text-surface-900">{transfer.toHospital?.name}</p>
                <p className="text-sm text-surface-500">{transfer.toHospital?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Request Details
          </div>
          <div className="p-5 space-y-4">
             <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Blood Group</span>
              <span className="font-bold text-primary-600">{transfer.request?.bloodGroup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Component</span>
              <span className="font-medium text-surface-900">{transfer.request?.componentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Units Needed</span>
              <span className="font-medium text-surface-900">{transfer.request?.unitsRequired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">Urgency</span>
              <span className={`font-medium ${transfer.request?.urgency === 'Emergency' ? 'text-red-600' : 'text-surface-900'}`}>{transfer.request?.urgency}</span>
            </div>
            <div className="flex justify-between border-t border-surface-50 pt-3">
              <span className="text-surface-500 text-sm">Diagnosis</span>
              <span className="font-medium text-surface-900 text-right">{transfer.request?.diagnosis}</span>
            </div>
          </div>
        </div>
      </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden mt-6">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Transport Info
          </div>
          <div className="p-5 flex gap-10">
            {transfer.transportMode && (
              <div>
                <span className="text-surface-500 text-sm block">Mode</span>
                <span className="font-medium text-surface-900">{transfer.transportMode}</span>
              </div>
            )}
            {transfer.trackingNumber && (
              <div>
                <span className="text-surface-500 text-sm block">Tracking No</span>
                <span className="font-medium text-surface-900">{transfer.trackingNumber}</span>
              </div>
            )}
            {transfer.dispatchDate && (
              <div>
                <span className="text-surface-500 text-sm block">Dispatched</span>
                <span className="font-medium text-surface-900">{formatDateTime(transfer.dispatchDate)}</span>
              </div>
            )}
             {transfer.deliveryDate && (
              <div>
                <span className="text-surface-500 text-sm block">Delivered</span>
                <span className="font-medium text-surface-900">{formatDateTime(transfer.deliveryDate)}</span>
              </div>
            )}
          </div>
        </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5 flex justify-end gap-3 border-t">
        {isSource && transfer.status === "Pending Approval" && (
          <Button variant="primary" onClick={handleApprove}>Approve Transfer</Button>
        )}
        {isSource && transfer.status === "Approved" && (
          <Button variant="primary" onClick={() => setDispatchModal(true)}>Dispatch Stock</Button>
        )}

        {isDest && transfer.status === "Dispatched" && (
          <Button variant="success" onClick={handleDelivered}>Mark Delivered</Button>
        )}
        {isDest && transfer.status === "Delivered" && (
          <Button variant="success" onClick={handleComplete}>Complete Transfer</Button>
        )}
      </div>

       <ConfirmDialog
        isOpen={dispatchModal}
        title="Dispatch Transport"
        message={(
          <div className="mt-4 space-y-3">
             <select 
               className="w-full border rounded p-2 text-sm" 
               value={dispatchForm.transportMode} 
               onChange={e => setDispatchForm(p => ({...p, transportMode: e.target.value}))}
             >
               <option value="Ambulance">Ambulance</option>
               <option value="Courier">Courier</option>
               <option value="Cold Chain Vehicle">Cold Chain Vehicle</option>
             </select>
             <input 
               type="text" 
               placeholder="Tracking Number / Vehicle No" 
               className="w-full border rounded p-2 text-sm" 
               value={dispatchForm.trackingNumber} 
               onChange={e => setDispatchForm(p => ({...p, trackingNumber: e.target.value}))} 
             />
          </div>
        )}
        confirmText="Dispatch"
        onClose={() => setDispatchModal(false)}
        onConfirm={handleDispatch}
      />
    </div>
  );
}
