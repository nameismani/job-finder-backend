import Users from "../models/userModel.js";
import UsersLoginHistory from "../models/usersLoginHistoryModel.js";
import passwordRest from "../models/passwordRestModel.js";
import Companies from "../models/companiesModel.js";
import path from "path"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {format} from "date-fns";
import crypto from "crypto"
// import date from "date-and-time"
import ipinfo from "ipinfo"
import { updatePassword } from "./userController.js";
import { updateCompanyPassword } from "./companiesController.js";



// console.log(date.format((new Date()), 'YYYY.MM.DD HH:mm:ss'))
// date.format()
// console.log(format(new Date(), 'MMMM dd, yyyy pp'))
// console.log(format(new Date(),'yyyy.MM.dd HH:mm:ss'))

const __dirname = dirname(fileURLToPath(import.meta.url));
export const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  //validate fileds

  if (!firstName) {
    next("First Name is required");
  }
  if (!email) {
    next("Email is required");
  }
  if (!lastName) {
    next("Last Name is required");
  }
  if (!password) {
    next("Password is required");
  }

  try {
    const userExist = await Users.findOne({ email });

    if (userExist) {
      next("Email Address already exists");
      // res.status(404).json({
      //   message:'Email already exists'
      // })
      return;
    }
    let userName = firstName.concat(" ",lastName)
    const template = await req.app
    .get("nmp_ejs")
    .renderFile(path.join(__dirname,"../mailtemplate/emailtemplate.ejs"),{userName});
  var mailOptions = {
    from: 'nameismani',
    to: email,
    subject: "Thank you for choosing our app",
    html: template,
  };
  req.app.get("mailer").sendMail(mailOptions, async (error, info) => {
    if (error) {
      // res.status(404).json({
      //   message: "Some error occured",
      //   status: 404,
      // });
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);

      // res.status(200).json({
      //   message: "Email sent successfully",
      //   staus: 200,
      // });
    }
  });
    const user = await Users.create({
      firstName,
      lastName,
      email,
      password,
    });

    // user token
    const token = await user.createJWT();
    ipinfo(async (err, data) => {
      if (err) {
          console.error(err);
      } else {
    
    
          let obj = {}
          // obj.login_time =request.session.login_time
          // obj.psp_id = rows[0].id
          obj.ipaddress = data.ip
          obj.city = data.city
          obj.region = data.region
          obj.country = data.country
            
          let location = `${obj.city}, ${obj.region}, ${obj.country}`
     
    
         console.log(obj.ipaddress,location)
    
         const userLoginHistory = await UsersLoginHistory.create({
          userId:user._id,
          login_time:format(new Date(),'yyyy.MM.dd HH:mm:ss'),
          remote_ip:data.ip,
          // logout_time:null,
          location:location
        });
        // let History = {}

        // const userLoginHistoryDetail = await UsersLoginHistory.find({userId:user._id})
        // console.log(userLoginHistoryDetail.length,'asdfd')

        const currentDate = new Date(); // Current date

const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

const userLoginHistoryDetail = await UsersLoginHistory.find({
  userId: user._id,
  login_time: { $gte: startOfDay, $lt: endOfDay }
});

const totalLogins = userLoginHistoryDetail.length;
const lastLogoutTime = userLoginHistoryDetail.length >= 2 ? userLoginHistoryDetail[userLoginHistoryDetail.length - 2].logout_time : null;
let lastLoginTime = userLoginHistoryDetail.length >=1 ?  userLoginHistoryDetail[userLoginHistoryDetail.length - 1].login_time :null

// console.log(lastLogoutTime)
// let totalWorkHours = 0;
// userLoginHistoryDetail.forEach((login) => {
//   // totalWorkHours += Number(login.logout_time) - Number(login.login_time);
//   const loginTime = new Date(login.login_time);
//   const logoutTime = new Date(login.logout_time);
//   totalWorkHours += Number(logoutTime) - Number(loginTime);
//   console.log(login.login_time,login.logout_time)
// });

let totalWorkMinutes = 0;

for (let i = 0; i < userLoginHistoryDetail.length - 1; i++) {
  const loginTime = new Date(userLoginHistoryDetail[i].login_time);
  const logoutTime = new Date(userLoginHistoryDetail[i].logout_time);

  totalWorkMinutes += (logoutTime - loginTime) / (1000);

//  console.log(`${format(loginTime,'yyyy.MM.dd HH:mm:ss')} ${format(logoutTime,'yyyy.MM.dd HH:mm:ss')}`);
}

// Calculate total work hours and remaining minutes
const totalWorkHours = Math.floor(totalWorkMinutes / 3660);
const remainingMinutes = Math.floor((totalWorkMinutes % 3660)/60);
const remainingSeconds = Math.round((totalWorkMinutes) % 60);
let totalHours= `${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`
function calculateTimeDifference(totalWorkedHours) {
  const regex = /(\d+)\s*hour[s]*\s*(\d*)\s*minute[s]*\s*(\d*)\s*second[s]*/i;
  const match = totalWorkedHours.match(regex);

  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    const totalMilliseconds = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    const currentDate = new Date();
    const adjustedDate = new Date(currentDate.getTime() - totalMilliseconds);

    return adjustedDate;
  } else {
    return null; // Invalid format, return null
  }
}

// Example usage:
const adjustDate = totalHours;
const calcualtedTotalHours = calculateTimeDifference(adjustDate);
// // console.log(`User ID: ${userId}`);
console.log(`Total Logins: ${totalLogins}`);
console.log(`Last Logout Time: ${lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null}`);
console.log(`Total Work Hours: ${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`);
console.log(new Date())
        req.session.userId = userLoginHistory._id
        let userLogins = {
          totalLogins:totalLogins,
          lastLogoutTime:lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null,
          lastLoginTime:lastLoginTime,
          totalHours:calcualtedTotalHours
        }
        res.status(201).json({
          success: true,
          message: "Account created successfully",
          user,
          userLogins,
          token,
          // session:req.session
          role:1,
          session:req.session
        });
      }
    
    });

  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    //validation
    if (!email || !password) {
      next("Please Provide AUser Credentials");
      return;
    }

    // find user by email
    const user = await Users.findOne({ email }).select("+password");

    if (!user) {
      next("Invalid -email or password");
      return;
    }

    // compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      next("Invalid email or password");
      return;
    }

    user.password = undefined;

    const token = user.createJWT();
            req.session.loggedin = true
      
        req.session.save()

    ipinfo(async (err, data) => {
      if (err) {
          console.error(err);
      } else {
    
    
          let obj = {}
          // obj.login_time =request.session.login_time
          // obj.psp_id = rows[0].id
          obj.ipaddress = data.ip
          obj.city = data.city
          obj.region = data.region
          obj.country = data.country
            
          let location = `${obj.city}, ${obj.region}, ${obj.country}`
     
    
         console.log(obj.ipaddress,location)
    
         const userLoginHistory = await UsersLoginHistory.create({
          userId:user._id,
          login_time:format(new Date(),'yyyy.MM.dd HH:mm:ss'),
          remote_ip:data.ip,
          // logout_time:null,
          location:location
        });
        // let History = {}

        // const userLoginHistoryDetail = await UsersLoginHistory.find({userId:user._id})
        // console.log(userLoginHistoryDetail.length,'asdfd')

        const currentDate = new Date(); // Current date

const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

const userLoginHistoryDetail = await UsersLoginHistory.find({
  userId: user._id,
  login_time: { $gte: startOfDay, $lt: endOfDay }
});

const totalLogins = userLoginHistoryDetail.length;
const lastLogoutTime = userLoginHistoryDetail.length >= 2 ? userLoginHistoryDetail[userLoginHistoryDetail.length - 2].logout_time : null;
let lastLoginTime = userLoginHistoryDetail.length >=1 ?  userLoginHistoryDetail[userLoginHistoryDetail.length - 1].login_time :null

// console.log(lastLogoutTime)
// let totalWorkHours = 0;
// userLoginHistoryDetail.forEach((login) => {
//   // totalWorkHours += Number(login.logout_time) - Number(login.login_time);
//   const loginTime = new Date(login.login_time);
//   const logoutTime = new Date(login.logout_time);
//   totalWorkHours += Number(logoutTime) - Number(loginTime);
//   console.log(login.login_time,login.logout_time)
// });

let totalWorkMinutes = 0;

for (let i = 0; i < userLoginHistoryDetail.length - 1; i++) {
  const loginTime = new Date(userLoginHistoryDetail[i].login_time);
  const logoutTime = new Date(userLoginHistoryDetail[i].logout_time);

  totalWorkMinutes += (logoutTime - loginTime) / (1000);

//  console.log(`${format(loginTime,'yyyy.MM.dd HH:mm:ss')} ${format(logoutTime,'yyyy.MM.dd HH:mm:ss')}`);
}

// Calculate total work hours and remaining minutes
const totalWorkHours = Math.floor(totalWorkMinutes / 3660);
const remainingMinutes = Math.floor((totalWorkMinutes % 3660)/60);
const remainingSeconds = Math.round((totalWorkMinutes) % 60);
let totalHours= `${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`
function calculateTimeDifference(totalWorkedHours) {
  const regex = /(\d+)\s*hour[s]*\s*(\d*)\s*minute[s]*\s*(\d*)\s*second[s]*/i;
  const match = totalWorkedHours.match(regex);

  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    const totalMilliseconds = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    const currentDate = new Date();
    const adjustedDate = new Date(currentDate.getTime() - totalMilliseconds);

    return adjustedDate;
  } else {
    return null; // Invalid format, return null
  }
}

// Example usage:
const adjustDate = totalHours;
const calcualtedTotalHours = calculateTimeDifference(adjustDate);
// // console.log(`User ID: ${userId}`);
console.log(`Total Logins: ${totalLogins}`);
console.log(`Last Logout Time: ${lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null}`);
console.log(`Total Work Hours: ${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`);
console.log(new Date())
        req.session.userId = userLoginHistory._id
        let userLogins = {
          totalLogins:totalLogins,
          lastLogoutTime:lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null,
          lastLoginTime:lastLoginTime,
          totalHours:calcualtedTotalHours
        }
        res.status(201).json({
          success: true,
          message: "Login successfully",
          user,
          userLogins,
          token,
          // session:req.session
          role:1,
          session:req.session
        });
      }
    
    });


    // req.session.user = user
    // console.log(user._id)

  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const forgotPassword = async(req,res,next)=>{
    const {email} = req.body
  if (!email) {
    next("Please Provide AUser Credentials");
    return;
  }
  let userName;
  try {
    let user = await Users.findOne({ email });
  

    if (!user) {
       user = await Companies.findOne({ email });
      
      if(!user){
        return res.json({
          message: "No user found with these email address",
         success:false
      })
      }else{
        userName = user.name
      }
    }
    else{
      userName = user.firstName.concat(" ",user.lastName)
    }
    const userEmail = user.email

    // request.id = user.id

    // check user having token or not, if exist then remove
    // const [resetToken] = await request.app.get("db").query("select token from password_reset_token where psp_staff_id = ?", [user.id])
   const resetToken = await passwordRest.findOne({ email });
    if (resetToken) {
        await removeToken(req,userEmail)
    }

    // create and insert the token

    const resetpasswordToken = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
    // const query = "INSERT INTO password_reset_token (psp_staff_id, token, expiry_time) values(?,?,?)"
    // const result = await request.app.get("db").query(query, [user.id, resetpasswordToken, expiryTime])
    const result = await passwordRest.create({
      email:userEmail,
      token:resetpasswordToken,
      expirytime:format(expiryTime,'yyyy.MM.dd HH:mm:ss')   
    });

    // const template = await req.app
    // .get("nmp_ejs")
    // .renderFile(path.join(__dirname,"../mailtemplate/emailtemplate.ejs"));
  var mailOptions = {
    from: 'nameismani',
    to: userEmail,
    subject: "Reset password link",
    html: `
    <h5 style="text-align:left">${userName}</h5>
    <p>click here to 
    <a href="https://nameismani-jobfinder-mern.netlify.app/resetpassword/${resetpasswordToken}" 
    <span style="display:block;padding:15px 40px;line-height:120%;"><span style="font-size: 18px; line-height: 21.6px;">Reset Password</span></span>
  </a>
  </p>
    `,
  };
  req.app.get("mailer").sendMail(mailOptions, async (error, info) => {
    if (error) {
      // res.status(404).json({
      //   message: "Some error occured",
      //   status: 404,
      // });
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);

      res.status(200).json({
        message: "Email sent successfully",
        success:true
      });
    }
  });

}

catch (error) {
    res.json({
        success:false,
        message: error.message
    })
}
}
let flag =1;
export const getResetPassword = async(req,res,next)=>{
  try {
    const { token } = req.query
    if (!token) {
        if (flag == 0) {
            // return res.redirect('/api/forgotpassword')
            res.status(200).json({
              success:false,
              message:"Please provide the token",
              navigate:'/forgotpassword'
            })
            return
        }
        // if (req.session.loggedin) {
        //     return res.render("resetpassword", { title: "Update password" })
        // }
        // return res.redirect("/")
        res.status(200).json({
          success:false,
          message:"Please provide the token",
          navigate:'/'
        })
       return
    }
    // check if token in databasee or not
    // const [tokendetails] = await req.app.get('db').query('select * from password_reset_token where token = ?', [token])
    let tokenDetails = await passwordRest.findOne({token:token})
    console.log(tokenDetails)
    const currentTime = new Date(Date.now()).getTime()
    
    if (!tokenDetails || tokenDetails.token !== token) {
        // return res.redirect("/api/tokenexpire")
        res.status(200).json({
          success:false,
          message:"Please provide the token",
          navigate:'/tokenexpire'
        })
      return
    }else if(token){
      const expiredTime = new Date(tokenDetails.expireytime).getTime()
      if (currentTime > expiredTime) {
        console.log('expired token')
          // await users_model.removeToken(request)
          // return res.json({
  
          //     message: "Link is expired",
          //     status: "400"
          // })
          await removeToken(req,tokenDetails.email)
          res.json({
                message: "Link is expired",
                success: false,
                navigate:'/tokenexpire'
            })
          return
      }
    }
    // return res.render("resetpassword", { title: "Reset password" })
    res.status(200).json({
      success:true,
      message:"token is valid",
      navigate:'/resetpassword'
    })
}

catch (err) {

    res.json({

        message: err.message,
        status: "500"
    })
}
}
export const resetPassword = async(req,res,next)=>{
  try {
    const { newpassword, confirmPassword } = req.body
    const { token } = req.query


    if (!newpassword || !confirmPassword) {
        return res.status(200).json({
            message: "all fields are mandatory",
            success:false
        });
    }
    // check newpassword with confirmpassword
    if (newpassword !== confirmPassword) {
        return res.status(200).json({
            message: "Newpassword and confirmpassword are not same",
            success:false
        });
    }
    // if (token == "null") {
    //     // sometimes loggin user coming directly to updatepassword with out token based on the flag value
    //     // check if session contains email or not
    //     // if no email in session, then user is not login user
    //     const {email} = req.session
    //     if(!email){
    //         return res.json({
    //             message: "Unauthorized user",
    //             status: "401"
    //         });
    //     }
    //     // if email is in session then update the password
    //     const hashedpassword = await bcrypt.hash(newpassword, 10)
    //     const updatepassword = await req.app.get("db").query("UPDATE psp_staff SET password = ? WHERE email = ?",[hashedpassword,email])
    //     return res.json({
    //         message: "Password updated successfully",
    //         status: "200"
    //     });
    // }
    // check token exists in database or not
    // const [tokendetails] = await req.app.get("db").query("select * from password_reset_token  where token = ?",[token])
    // if (!tokendetails) {
    //     return res.json({
    //         message: "Unauthorized user",
    //         status: "401"
    //     })
    // }

    let tokenDetails = await passwordRest.findOne({token})
    console.log(tokenDetails)
    if (!tokenDetails) {
        // return res.redirect("/api/tokenexpire")
        res.status(200).json({
          success:false,
          message:"unauthorized user",
          navigate:'/tokenexpire'
        })
      return
    }
    let email = tokenDetails.email
    // const [result] = await req.app.get("db").query("select psp_staff_id, token, expiry_time   from password_reset_token  where psp_staff_id = ?", [tokendetails.psp_staff_id])
    // let result = await await passwordRest.findOne({email})
    const currentTime = new Date(Date.now()).getTime()

    const expiredTime = new Date(tokenDetails.expireytime).getTime()
    // console.log(tokenDetails)
    //   console.log(tokenDetails.expireytime)
    if (currentTime > expiredTime) {
      console.log('expired token')
        // await users_model.removeToken(request)
        // return res.json({
        //     message: "Link is expired",
        //     status: "400"
        // })
        await removeToken(req,email)
        res.json({
              message: "Link is expired",
              status: false
          })
        return
    }

    // //update password and remove the token
    // const updatepassword = await users_model.updateUserPassword(request)
    // await users_model.removeToken(request)
    // return res.json({
    //     message: "Password reset successfully",
    //     status: "200"
       let user = await Users.findOne({email})
       if(!user){
        console.log('company')
        user = await Companies.findOne({email})
         await updateCompanyPassword(newpassword,email)
         await removeToken(req,email)
         res.json({
          message:'company password reset success',
          success:true
         })
         return
       }else{
        console.log('user')
        await updatePassword(newpassword,email)
        await removeToken(req,email)
        res.json({
         messacge:'user password reset success',
         success:true
        })
        return
       }

    // })

}
catch (error) {
    return res.json({
        status: "500",
        message: error.message
    })
}
}
export const removeToken = async (request, email) => {
  // const user_id = req.id
  // const query = 'DELETE from password_reset_token where psp_staff_id = ?'
  const deleteToken = await passwordRest.findOneAndDelete({email})
  // const result = await request.app.get("db").query(query, [user_id])
  return deleteToken
}