import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Server Error : ", error);
      throw error;
    });
    app.listen(PORT, async () => {
      console.log(`Server running at PORT : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed ", err);
    process.exit(1);
  });
