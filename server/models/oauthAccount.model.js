import mongoose from "mongoose";

const oauthAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["google"],
      required: true,
    },
    providerAccountId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("OauthAccount", oauthAccountSchema);