import dotenv from "dotenv";

import connectDB from "./db/database.js";
import app from "./app.js";
dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on the port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("MongoDb is connect failed", err));
