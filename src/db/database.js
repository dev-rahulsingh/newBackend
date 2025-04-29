import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionDB = await mongoose.connect(
      `${process.env.DB_URL}/${DB_NAME}`
    );
    console.log(
      `\n Mongo DB Connected !! DB host ${connectionDB.connection.host}`
    );
  } catch (error) {
    console.log("Mongo connection is got error", error);
    process.exit(1);
  }
};

export default connectDB;
