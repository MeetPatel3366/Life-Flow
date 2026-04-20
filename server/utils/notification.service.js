import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedModel,
  relatedId,
}) => {
  try {
    await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedModel,
      relatedId,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

export const notifyPatient = (
  patientId,
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  createNotification({
    recipient: patientId,
    type,
    title,
    message,
    relatedModel,
    relatedId,
  }).catch(() => {});
};

export const notifyHospital = async (
  hospitalId,
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  try {
    const hospitalUser = await User.findOne({
      hospitalId,
      role: "hospital",
    })
      .select("_id")
      .lean();

    if (hospitalUser) {
      await createNotification({
        recipient: hospitalUser._id,
        type,
        title,
        message,
        relatedModel,
        relatedId,
      });
    }
  } catch (error) {
    console.error("Hospital notification failed:", error.message);
  }
};

export const notifyDonors = async (
  bloodGroup,
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  try {
    const donors = await User.find({
      role: "donor",
      bloodGroup,
      isActive: true,
      eligibilityStatus: "Eligible",
    })
      .select("_id")
      .limit(50)
      .lean();

    if (donors.length > 0) {
      const notifications = donors.map((donor) => ({
        recipient: donor._id,
        type,
        title,
        message,
        relatedModel,
        relatedId,
      }));

      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Donor notification failed:", error.message);
  }
};

export const notifyUser = (
  userId,
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  createNotification({
    recipient: userId,
    type,
    title,
    message,
    relatedModel,
    relatedId,
  }).catch(() => {});
};
