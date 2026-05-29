import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { initSocket } from "./utils/socket.js";
import { initCronJobs } from "./utils/cron.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

initSocket(server);

initCronJobs();

connectDB()
  .then(() => {
    server.on("error", (error) => {
      console.log("Server Error : ", error);
      throw error;
    });
    server.listen(PORT, async () => {
      console.log(`Server running at PORT : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed ", err);
    process.exit(1);
  });
