import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import BloodStock from "../models/bloodStock.model.js";
import Donation from "../models/donation.model.js";

export const createBloodStock = asyncHandler(async (req, res) => {
  const { donationId, componentType, quantity, expiryDate, notes } = req.body;

  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(403, "Hospital account not linked properly");
  }

  const [hospital, donation, existingStock] = await Promise.all([
    Hospital.findById(hospitalId).select("verificationStatus isActive").lean(),
    Donation.findById(donationId).lean(),
    BloodStock.exists({ donation: donationId, componentType }),
  ]);

  if (!hospital) {
    throw new ApiError(404, "hospital not found");
  }

  if (
    hospital.verificationStatus !== "Approved" ||
    hospital.isActive !== true
  ) {
    throw new ApiError(
      403,
      "Only approved and active hospitals can create blood stock",
    );
  }

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  if (!donation.hospital.equals(hospitalId)) {
    throw new ApiError(
      403,
      "You can only create stock for your hospital donations",
    );
  }

  if (donation.status !== "Completed") {
    throw new ApiError(
      400,
      "Stock can only be created for completed donations",
    );
  }

  const requiredTests = [
    "hiv",
    "hepatitisB",
    "hepatitisC",
    "malaria",
    "syphilis",
  ];
  const hasFailedTests = requiredTests.some(
    (test) => donation.labTests[test] !== "Negative",
  );

  if (hasFailedTests) {
    throw new ApiError(
      400,
      "Cannot create stock. all lab tests must be Negative",
    );
  }

  if (existingStock) {
    throw new ApiError(
      409,
      "Stock for this component already exists for this donation",
    );
  }

  let finalExpiryDate = expiryDate;

  if (!finalExpiryDate) {
    const donationDate = donation.donationDate || new Date();

    const expiryMap = {
      "Whole Blood": 35,
      RBC: 42,
      Plasma: 365,
      Platelets: 5,
    };

    const days = expiryMap[componentType];

    if (!days) {
      throw new ApiError(400, "Invalid componentType");
    }

    finalExpiryDate = new Date(
      donationDate.getTime() + days * 24 * 60 * 60 * 1000,
    );
  }

  const bloodStock = await BloodStock.create({
    hospital: hospitalId,
    donation: donationId,
    bloodGroup: donation.bloodGroup,
    componentType,
    quantity,
    expiryDate: finalExpiryDate,
    screeningPassed: true,
    notes,
  });

  await Donation.findByIdAndUpdate(donationId, {
    $push: {
      bloodUnits: bloodStock._id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Blood stock created successfully", bloodStock));
});
