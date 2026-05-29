import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import requestApi from "../../../api/requestApi";
import transferApi from "../../../api/transferApi";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import BloodGroupBadge from "../../../components/common/BloodGroupBadge";
import Spinner from "../../../components/ui/Spinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import {
  HiExclamationCircle,
  HiSwitchHorizontal,
} from "react-icons/hi";

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPatient, isHospital, isAdmin } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [readymarking, setReadymarking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [completingTransfer, setCompletingTransfer] = useState(false);

  const [cancelModal, setCancelModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");



  const fetchRequest = async () => {
    try {
      setIsLoading(true);

      let res;

      if (isPatient) {
        res = await requestApi.getMyRequestById(id);
      } else {
        res = await requestApi.getRequestByIdForHospital(id);
      }

      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id, isPatient, isHospital]);

  const request = data?.data;

  if (isLoading) {
    return <Spinner size="lg" className="py-20" />;
  }

  if (!request) {
    return (
      <div className="text-center py-20 text-surface-500">
        Request not found.
      </div>
    );
  }

  const handleAction = async (
    action,
    apiMethod,
    setLoad,
    payload = null
  ) => {
    try {
      setLoad(true);

      let response;

      if (payload) {
        response = await requestApi[apiMethod](id, payload.reason);
      } else {
        response = await requestApi[apiMethod](id);
      }

      const updatedRequest = response.data?.data;

      if (updatedRequest) {
        setData((prev) => ({
          ...prev,
          data: updatedRequest,
        }));
      }

      if (updatedRequest?.donorSearchFailed) {
        toast.error(
          `NO COMPATIBLE DONOR FOUND: ${request.bloodGroup} Blood Units!`,
          {
            duration: 8000,
            style: {
              background: "#dc2626",
              color: "#fff",
              fontWeight: "bold",
              border: "2px solid #fff",
              padding: "16px",
            },
            icon: "🚨",
          }
        );
      } else {
        toast.success(`${action} successful`);
      }

      await fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoad(false);
    }
  };

  const handleTransferAction = async (
    action,
    apiMethod,
    setLoad
  ) => {
    try {
      setLoad(true);

      const response = await transferApi[apiMethod](
        request.transfer._id
      );

      const updatedRequest = response.data?.data;

      if (updatedRequest) {
        setData((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            ...updatedRequest,
          },
        }));
      }

      toast.success(`${action} successful`);

      await fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoad(false);
    }
  };

  const hasDonorStep =
    request.status === "Awaiting Donor" ||
    request.donorSearchFailed;

  const getCurrentStepIndex = () => {
    const statusOrder = {
      Pending: 1,
      "Awaiting Donor": hasDonorStep ? 3 : 2,
      Approved: hasDonorStep ? 4 : 3,
      "Transfer Required": hasDonorStep ? 4 : 3,
      "Ready for Issue": hasDonorStep ? 5 : 4,
      Completed: hasDonorStep ? 6 : 5,
    };

    return statusOrder[request.status] ?? 1;
  };

  const currentStepIndex = getCurrentStepIndex();

  const steps = [
    {
      id: "submitted",
      label: "Request Submitted",
    },
    {
      id: "stock",
      label:
        request.status === "Pending"
          ? "Verifying Request"
          : "Stock Checked",
    },
  ];

  if (hasDonorStep) {
    steps.push({
      id: "donor",
      label: request.donorSearchFailed
        ? "No Compatible Donor Found"
        : "Donor Search Started",
      isCritical: request.donorSearchFailed,
    });
  }

  steps.push(
    {
      id: "transfer",
      label: "Approval / Transfer",
    },
    {
      id: "ready",
      label: "Ready for Issue",
    },
    {
      id: "completed",
      label: "Completed",
    }
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            Request #{request._id.slice(-6).toUpperCase()}
            <StatusBadge status={request.status} />
          </h1>

          <p className="text-surface-500 text-sm mt-1">
            Submitted on {formatDateTime(request.createdAt)}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between min-w-[700px] py-4 px-10">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className="flex-1 flex items-center"
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10
                    ${
                      step.isCritical
                        ? "bg-orange-600 border-orange-600 text-white animate-pulse"
                        : isCompleted
                        ? "bg-primary-600 border-primary-600 text-white"
                        : isActive
                        ? "bg-primary-50 border-primary-600 text-primary-600"
                        : "bg-white border-surface-200 text-surface-400"
                    }
                    ${
                      isActive
                        ? step.isCritical
                          ? "ring-4 ring-orange-100 scale-110 shadow-lg"
                          : "ring-4 ring-primary-100 scale-110 shadow-lg"
                        : ""
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-12 w-32 -left-11 text-center">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors
                      ${
                        isActive
                          ? "text-primary-600"
                          : isCompleted
                          ? "text-surface-900"
                          : "text-surface-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-surface-100 relative overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-primary-500 transition-all duration-1000 origin-left
                      ${
                        idx < currentStepIndex - 1
                          ? "scale-x-100"
                          : "scale-x-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {request.donorSearchFailed && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 flex items-start gap-4 animate-fade-in">
          <HiExclamationCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />

          <div>
            <h3 className="text-lg font-bold text-orange-800">
              No Compatible Donor Found
            </h3>

            <p className="text-orange-700 mt-1">
              No eligible <strong>{request.bloodGroup}</strong>{" "}
              donors exist for request{" "}
              <strong>
                #
                {request._id
                  .toString()
                  .slice(-6)
                  .toUpperCase()}
              </strong>
              .
            </p>
          </div>
        </div>
      )}

      {request.status === "Transfer Required" &&
        request.transfer && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 flex items-start gap-4 animate-fade-in">
            <HiSwitchHorizontal className="w-8 h-8 text-blue-600 flex-shrink-0" />

            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-800">
                Blood Transfer in Progress
              </h3>

              <p className="text-blue-700 mt-1">
                Stock has been identified at another
                hospital.{" "}
                <strong>
                  {request.transfer.fromHospital?.name}
                  {" ("}
                  <span>
                    Phone no: {" "}
                    {request.transfer.fromHospital?.phone}
                  </span>
                  {" )"}
                </strong>{" "}

                is providing the required blood units.
              </p>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Requirement Details
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Patient
              </span>

              <span className="font-medium text-surface-900">
                {request.patient?.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Blood
              </span>

              <div className="flex items-center gap-2">
                <BloodGroupBadge
                  group={request.bloodGroup}
                />

                <span className="text-sm font-medium">
                  {request.componentType}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Units Required
              </span>

              <span className="font-bold text-primary-600">
                {request.unitsRequired}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Urgency
              </span>

              <span
                className={`font-medium ${
                  request.urgency === "Emergency"
                    ? "text-red-600"
                    : "text-surface-900"
                }`}
              >
                {request.urgency}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Needed By
              </span>

              <span className="font-medium text-surface-900">
                {formatDate(request.requiredDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="bg-surface-50 px-5 py-3 border-b border-surface-100 font-semibold text-surface-700">
            Fulfillment Details
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Treatment Hospital
              </span>

              <span className="font-medium text-surface-900">
                {request.hospital?.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-surface-500 text-sm">
                Diagnosis
              </span>

              <span className="font-medium text-surface-900 text-right">
                {request.diagnosis}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5 flex flex-col sm:flex-row flex-wrap justify-end gap-3 border-t">
        {isPatient && request.status === "Pending" && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setCancelModal(true)}
          >
            Cancel Request
          </Button>
        )}

        {isHospital &&
          (request.status === "Pending" ||
            request.status === "Awaiting Donor") && (
            <>
              <Button
                variant="danger"
                onClick={() => setRejectModal(true)}
              >
                Reject
              </Button>

              <Button
                variant="primary"
                onClick={() =>
                  handleAction(
                    "Approve",
                    "approveRequest",
                    setApproving
                  )
                }
                isLoading={approving}
              >
                Approve Request
              </Button>
            </>
          )}

        {isHospital && request.status === "Approved" && (
          <Button
            variant="success"
            onClick={() =>
              handleAction(
                "Mark Ready",
                "markRequestReady",
                setReadymarking
              )
            }
            isLoading={readymarking}
          >
            Mark Ready for Issue
          </Button>
        )}

        {isHospital &&
          request.status === "Ready for Issue" && (
            <Button
              variant="success"
              onClick={() =>
                handleAction(
                  "Complete",
                  "completeRequest",
                  setCompleting
                )
              }
              isLoading={completing}
            >
              Complete Request
            </Button>
          )}

        {isHospital &&
          request.transfer &&
          request.transfer.status === "Dispatched" && (
            <Button
              variant="success"
              onClick={() =>
                handleTransferAction(
                  "Mark Delivered",
                  "markDelivered",
                  setMarkingDelivered
                )
              }
              isLoading={markingDelivered}
            >
              Mark Transfer Delivered
            </Button>
          )}

        {isHospital &&
          request.transfer &&
          request.transfer.status === "Delivered" && (
            <Button
              variant="success"
              onClick={() =>
                handleTransferAction(
                  "Complete Transfer",
                  "completeTransfer",
                  setCompletingTransfer
                )
              }
              isLoading={completingTransfer}
            >
              Ready for Issue
            </Button>
          )}
      </div>

      <ConfirmDialog
        isOpen={cancelModal}
        title="Cancel Request"
        message="Are you sure you want to cancel this blood request?"
        confirmText="Yes, Cancel"
        onClose={() => setCancelModal(false)}
        onConfirm={async () => {
          await handleAction(
            "Cancel",
            "cancelRequest",
            setCancelling
          );

          setCancelModal(false);
        }}
        isLoading={cancelling}
      />

      <ConfirmDialog
        isOpen={rejectModal}
        title="Reject Request"
        message={
          <div className="mt-2">
            <p className="mb-2">
              Please provide a reason for rejecting
              this blood request.
            </p>

            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              placeholder="Not enough stock..."
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
            />
          </div>
        }
        confirmText="Reject"
        onClose={() => setRejectModal(false)}
        onConfirm={async () => {
          if (!rejectReason.trim()) {
            return toast.error("Reason is required");
          }

          await handleAction(
            "Reject",
            "rejectRequest",
            setRejecting,
            { reason: rejectReason }
          );

          setRejectModal(false);
        }}
        isLoading={rejecting}
      />
    </div>
  );
}