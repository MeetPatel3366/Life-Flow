import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { emitEvent } from "./socket.js";

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedModel,
  relatedId,
}) => {
  try {
    const newNotification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedModel,
      relatedId,
    });

    emitEvent(recipient.toString(), "newNotification", newNotification);

  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

export const notifyPatient = async (
  patientId,
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  await createNotification({
    recipient: patientId,
    type,
    title,
    message,
    relatedModel,
    relatedId,
  });
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

      donors.forEach((donor) => {
        emitEvent(
          donor._id.toString(),
          "newNotification",
          { type, title, message, relatedModel, relatedId }
        );
      });
    }
    return donors.length;
  } catch (error) {
    console.error("Donor notification failed:", error.message);
    return 0;
  }
};

export const notifyEscalation = async (request, hospitalId) => {
  try {
    const isRare = ['AB-', 'O-', 'Bombay Blood Group'].includes(request.bloodGroup);
    const escalationTitle = isRare ? "RARE BLOOD EMERGENCY - No Donors Found" : "No Matching Donors Available";
    
    const payload = {
      requestId: request._id,
      bloodGroup: request.bloodGroup,
      componentType: request.componentType,
      urgency: request.urgency,
      isRare
    };

    await notifyHospital(
      hospitalId,
      "donor_search_failed",
      escalationTitle,
      `No eligible ${request.bloodGroup} donors are currently available for emergency request #${request._id.toString().slice(-6).toUpperCase()}. Manual intervention required.`,
      "Request",
      request._id
    );

    await notifyAdmin(
      "emergency_escalation",
      isRare ? `CRITICAL: Rare Blood (${request.bloodGroup}) Escalation` : "Emergency Escalation Required",
      `No eligible ${request.bloodGroup} donors exist for emergency request #${request._id.toString().slice(-6).toUpperCase()}`,
      "Request",
      request._id
    );

    await notifyPatient(
      request.patient,
      "donor_search_failed",
      "No Compatible Donor Found",
      `No eligible ${request.bloodGroup} donors exist for your request #${request._id.toString().slice(-6).toUpperCase()}`,
      "Request",
      request._id
    );

    emitEvent("adminRoom", "emergency:no-donor-found", payload);
    emitEvent(hospitalId.toString(), "emergency:no-donor-found", payload);

  } catch (error) {
    console.error("Escalation notification failed:", error.message);
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

export const notifyAdmin = async (
  type,
  title,
  message,
  relatedModel,
  relatedId,
) => {
  try {
    const admins = await User.find({ role: "admin", isActive: true })
      .select("_id")
      .lean();

    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        type,
        title,
        message,
        relatedModel,
        relatedId,
      }));

      await Notification.insertMany(notifications);

      admins.forEach((admin) => {
        emitEvent(admin._id.toString(), "newNotification", {
          type,
          title,
          message,
          relatedModel,
          relatedId,
        });
      });
    }
  } catch (error) {
    console.error("Admin notification failed:", error.message);
  }
};

export const emitEmergencyAlert = (type, data) => {
  if (type === "emergency_request_created") {
    emitEvent("adminRoom", "emergency_request_created", data);
    if (data.hospital) {
      emitEvent(data.hospital.toString(), "emergency_request_created", data);
    }
  } else if (type === "emergency_transfer_created") {
    emitEvent("adminRoom", "emergency_transfer_created", data);
    if (data.fromHospital) {
      emitEvent(data.fromHospital.toString(), "emergency_transfer_created", data);
    }
    if (data.toHospital) {
      emitEvent(data.toHospital.toString(), "emergency_transfer_created", data);
    }
  } else if (type === "emergency_donor_alert") {
    emitEvent("adminRoom", "emergency_donor_alert", data);
  }
};
