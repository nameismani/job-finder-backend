import express from "express";
import { rateLimit } from "express-rate-limit";
import { forgotPassword, getResetPassword, register, resetPassword, signIn } from "../controllers/authController.js";
import UsersLoginHistory from "../models/usersLoginHistoryModel.js";
import {format} from "date-fns";

//ip rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const router = express.Router();

// Register routes
router.post("/register", limiter, register);
router.post("/login", signIn);
// router.get('/forgotpassword',(req,res)=>

// res.render("forgotpassword")
// )
router.post("/forgotpassword",forgotPassword)
router.get("/resetpassword",getResetPassword)
router.post("/resetpassword",resetPassword)
router.post("/logout",async(req,res)=>{
  console.log("logout",req.session.loggedin)
let {id} = req.body
  // req.session.loggedin = true
  // req.session.save()
  // req.session.destory()

 let user = await UsersLoginHistory.findByIdAndUpdate(id,{logout_time:format(new Date(),'yyyy.MM.dd HH:mm:ss')})
//  console.log(user)
 if(user){
  res.status(200).json({
    success:true,
    message:'user logged out'
  })
 }

})

export default router;