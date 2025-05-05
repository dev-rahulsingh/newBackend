import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //One who is subscribing
      ref: "User",
    },
    Channel: {
      type: Schema.Types.ObjectId, // one to whjom "subscriber is subscrbing"
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
