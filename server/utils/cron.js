import cron from "node-cron";
import BloodStock from "../models/bloodStock.model.js";

export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running blood stock expiry check...");
      const result = await BloodStock.updateMany(
        {
          expiryDate: { $lt: new Date() },
          status: { $in: ["Available", "Testing", "Reserved", "In Transit"] }
        },
        {
          $set: { status: "Expired" }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`Updated ${result.modifiedCount} blood stock units to Expired status.`);
      }
    } catch (error) {
      console.error("Error in blood stock expiry cron job:", error);
    }
  });
  // console.log("Cron jobs initialized.");
};
