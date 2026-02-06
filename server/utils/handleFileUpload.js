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

    fs.unlinkSync(path.join(process.cwd(), "uploads", file.filename));

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    if (file?.filename) {
      const localPath = path.join(process.cwd(), "uploads", file.filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
    console.error("File upload error:", error);
    throw new Error("Image upload failed");
  }
};

export default handleFileUpload;
