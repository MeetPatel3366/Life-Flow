import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Hospital", "Blood Bank"],
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    contactPerson: {
      name: {
        type: String,
        trim: true,
      },
      designation: {
        type: String,
        trim: true,
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
      },
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    storageCapacity: {
      type: Number,
    },
    hasComponentSeparation: {
      type: Boolean,
      default: false,
    },
    document: {
      name: {
        type: String,
        trim: true,
      },
      fileUrl: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true },
);

//For geo queries (find nearest center)
hospitalSchema.index({ location: "2dsphere" });

export default mongoose.model("Hospital", hospitalSchema);
