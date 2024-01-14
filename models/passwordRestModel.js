import mongoose, { Schema } from "mongoose";

const passwordResetSchema = new mongoose.Schema(
  {
    email:{type:String},
    token: { type: String }, //token for resetting the password
    expireytime: { type: Date, default: new Date(Date.now() + 30 * 60 * 1000) },
  },
  { timestamps: true }
);

const passwordRest = mongoose.model("passwordreset", passwordResetSchema );

export default passwordRest;