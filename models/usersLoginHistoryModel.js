import mongoose from "mongoose";
// import validator from "validator";
// import bcrypt from "bcryptjs";
// import JWT from "jsonwebtoken";

//schema
const userLoginHisotrySchema = new mongoose.Schema(
  {
  userId:{
    type:String,
    require:[true,'UserID is requried']
  },
  login_time:{
    type:Date,
    default: Date.now()
  },
  remote_ip:{
    type:String
  },
  location:{
    type:String
  },
  logout_time:{
    type:Date
  }
  },
  { timestamps: true }
);

// middelwares
// userSchema.pre("save", async function () {
//   if (!this.isModified) return;
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// //compare password
// userSchema.methods.comparePassword = async function (userPassword) {
//   const isMatch = await bcrypt.compare(userPassword, this.password);
//   return isMatch;
// };

// //JSON WEBTOKEN
// userSchema.methods.createJWT = function () {
//   return JWT.sign({ userId: this._id }, process.env.JWT_SECRET_KEY, {
//     expiresIn: "1d",
//   });
// };

const UsersLoginHistory = mongoose.model("UsersLoginHistory", userLoginHisotrySchema);

export default  UsersLoginHistory;