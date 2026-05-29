import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllContacts } from "../../../store/contactSlice";
import contactApi from "../../../api/contactApi";
import DataTable from "../../../components/common/DataTable";
import FilterBar from "../../../components/common/FilterBar";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { formatDateTime } from "../../../utils/formatters";
import { CONTACT_STATUSES } from "../../../utils/constants";
import { HiMail, HiReply, HiEye } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ContactMessages() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "", search: "" });
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);


  const dispatch = useDispatch();
  const { contacts, pagination, loading: isLoading } = useSelector((state) => state.contact);

  useEffect(() => {
    const queryParams = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    dispatch(fetchAllContacts(queryParams));
  }, [filters, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewContact = async (row) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const res = await contactApi.getContactById(row._id);
      setSelectedContact(res.data.data);
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      dispatch(fetchAllContacts(queryParams));
    } catch {
      toast.error("Failed to load contact message");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenReply = () => {
    setReplyText(selectedContact?.adminReply || "");
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (replyText.trim().length < 10) {
      toast.error("Reply must be at least 10 characters");
      return;
    }

    try {
      setReplyLoading(true);
      const res = await contactApi.replyToContact(selectedContact._id, { reply: replyText });
      setSelectedContact(res.data.data);
      toast.success("Reply sent to user's email!");
      setShowReplyModal(false);
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      dispatch(fetchAllContacts(queryParams));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "message",
      label: "Message",
      render: (val) => (
        <span className="block max-w-[200px] truncate text-surface-600">{val}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const colors = {
          Unread: "bg-blue-100 text-blue-800",
          Read: "bg-yellow-100 text-yellow-800",
          Replied: "bg-green-100 text-green-800",
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[val] || "bg-gray-100 text-gray-600"}`}>
            {val}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => formatDateTime(val),
    },
    {
      key: "_id",
      label: "Actions",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewContact(row);
            }}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary-600 transition-colors cursor-pointer"
            title="View Details"
          >
            <HiEye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterConfig = [
    { key: "status", label: "Status", options: CONTACT_STATUSES },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Contact Messages</h1>
          <p className="text-surface-500 text-sm mt-1">
            View and respond to messages from visitors
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <FilterBar filters={filterConfig} values={filters} onChange={handleFilterChange} />
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100">
        <DataTable
          columns={columns}
          data={contacts}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
          onRowClick={handleViewContact}
          emptyTitle="No contact messages"
          emptyMessage="No one has reached out yet."
        />
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedContact(null);
        }}
        title="Contact Message Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : selectedContact ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Name</p>
                <p className="text-sm font-semibold text-surface-900 mt-1">{selectedContact.name}</p>
              </div>
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-surface-900 mt-1">{selectedContact.email}</p>
              </div>
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  {(() => {
                    const colors = {
                      Unread: "bg-blue-100 text-blue-800",
                      Read: "bg-yellow-100 text-yellow-800",
                      Replied: "bg-green-100 text-green-800",
                    };
                    return (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[selectedContact.status]}`}>
                        {selectedContact.status}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-surface-900 mt-1">
                  {formatDateTime(selectedContact.createdAt)}
                </p>
              </div>
            </div>

            <div className="bg-surface-50 rounded-lg p-4">
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">
                {selectedContact.message}
              </p>
            </div>

            {selectedContact.adminReply && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-2">
                  Admin Reply
                  {selectedContact.repliedBy && (
                    <span className="normal-case font-normal text-green-500">
                      {" "}— by {selectedContact.repliedBy.name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">
                  {selectedContact.adminReply}
                </p>
                {selectedContact.repliedAt && (
                  <p className="text-xs text-green-500 mt-2">
                    Replied on {formatDateTime(selectedContact.repliedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedContact(null);
                }}
              >
                Close
              </Button>
              <Button onClick={handleOpenReply}>
                <HiReply className="w-4 h-4" />
                {selectedContact.adminReply ? "Update Reply" : "Reply"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        title={`Reply to ${selectedContact?.name || "User"}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-surface-50 rounded-lg p-3">
            <p className="text-xs text-surface-400 font-medium mb-1">Original message:</p>
            <p className="text-sm text-surface-600 line-clamp-3">{selectedContact?.message}</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-surface-700">Your Reply</label>
            <textarea
              id="reply-message"
              rows={5}
              placeholder="Type your reply here... (min 10 characters)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 resize-none"
            />
            <p className="text-xs text-surface-400">{replyText.length} / 2000 characters</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> This reply will be sent as an email to{" "}
              <strong>{selectedContact?.email}</strong>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowReplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} isLoading={replyLoading}>
              <HiMail className="w-4 h-4" /> Send Reply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
