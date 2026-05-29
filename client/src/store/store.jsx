import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import hospitalReducer from "./hospitalSlice";
import requestReducer from "./requestSlice";
import donationReducer from "./donationSlice";
import bloodStockReducer from "./bloodStockSlice";
import transferReducer from "./transferSlice";
import complaintReducer from "./complaintSlice";
import notificationReducer from "./notificationSlice";
import contactReducer from "./contactSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hospital: hospitalReducer,
    request: requestReducer,
    donation: donationReducer,
    bloodStock: bloodStockReducer,
    transfer: transferReducer,
    complaint: complaintReducer,
    notification: notificationReducer,
    contact: contactReducer,
  },
});
