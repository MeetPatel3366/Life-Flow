import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },
    category: {
      type: String,
      enum: [
        "Blood Request Issue",
        "Donation Issue",
        "Hospital Staff Behavior",
        "Delay in Service",
        "System Error",
        "Other",
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        fileUrl: {
          type: String,
        },
        uploadedAt: {
          type: Date,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "Open", // just submitted
        "In Review", // admin checking
        "Resolved", // fixed
        "Rejected", // invalid complaint
        "Closed", // finished process
      ],
      default: "Open",
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedbackComment: String,
  },
  { timestamps: true },
);

export default mongoose.model("Complaint", complaintSchema);
