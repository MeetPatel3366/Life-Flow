import { cloudinary } from "./cloudinary.js";
import fs from "fs";
import path from "path";

const handleFileUpload = async (
  file,
  folder = "lifeflow",
  oldPublicId = null,
) => {
  try {
    if (!file) return null;
    const uploadOptions = {
      folder,
      resource_type: "auto",
      quality: "auto",
    };

    const result = await cloudinary.uploader.upload(file.path, uploadOptions);

    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }

    console.log("file : ", file);

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error("File upload error:", error);
    throw new Error("Image upload failed");
  }
};

export default handleFileUpload;
