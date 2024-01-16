import mongoose from "mongoose";
import Companies from "../models/companiesModel.js";
import path from "path"
import { dirname } from 'path';
import bcrypt from "bcryptjs"
import { fileURLToPath } from 'url';
import {format} from "date-fns";
// import date from "date-and-time"
import ipinfo from "ipinfo"

const __dirname = dirname(fileURLToPath(import.meta.url));
import { response } from "express";
import UsersLoginHistory from "../models/usersLoginHistoryModel.js";


export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  //validate fields
  if (!name) {
    next("Company Name is required!");
    return;
  }
  if (!email) {
    next("Email address is required!");
    return;
  }
  if (!password) {
    next("Password is required and must be greater than 6 characters");
    return;
  }

  try {
    const accountExist = await Companies.findOne({ email });

    if (accountExist) {
      next("Email Already Registered. Please Login");
      return;
    }

    // create a new account
    const company = await Companies.create({
      name,
      email,
      password,
    });

    // user token
    let userName = name
    const token = company.createJWT();
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
        userId:company._id,
        login_time:format(new Date(),'yyyy.MM.dd HH:mm:ss'),
        remote_ip:data.ip,
        location:location
      });
    
      const currentDate = new Date(); // Current date

const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

const userLoginHistoryDetail = await UsersLoginHistory.find({
userId: company._id,
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

console.log(`${format(loginTime,'yyyy.MM.dd HH:mm:ss')} ${format(logoutTime,'yyyy.MM.dd HH:mm:ss')}`);
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
const adjustDate = totalHours;
const calcualtedTotalHours = calculateTimeDifference(adjustDate);
// // console.log(`User ID: ${userId}`);
console.log(`Total Logins: ${totalLogins}`);
console.log(`Last Logout Time: ${lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null}`);
console.log(`Total Work Hours: ${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`);
// console.log(new Date())
      req.session.userId = userLoginHistory._id
      let userLogins = {
        totalLogins:totalLogins,
        lastLogoutTime:lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null,
        lastLoginTime:lastLoginTime,
        totalHours:calcualtedTotalHours
      }

      res.status(200).json({
        success: true,
        message: "Login SUccessfully",
        user: company,
        userLogins,
        session:req.session,
        role:2,
        token,
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

    const company = await Companies.findOne({ email }).select("+password");

    if (!company) {
      next("Invalid email or Password");
      return;
    }

    //compare password
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      next("Invalid email or Password");
      return;
    }
    company.password = undefined;
    req.session.loggedin = true
    req.session.save()
    const token = company.createJWT();

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
          userId:company._id,
          login_time:format(new Date(),'yyyy.MM.dd HH:mm:ss'),
          remote_ip:data.ip,
          location:location
        });
      
        const currentDate = new Date(); // Current date

const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

const userLoginHistoryDetail = await UsersLoginHistory.find({
  userId: company._id,
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

 console.log(`${format(loginTime,'yyyy.MM.dd HH:mm:ss')} ${format(logoutTime,'yyyy.MM.dd HH:mm:ss')}`);
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
const adjustDate = totalHours;
const calcualtedTotalHours = calculateTimeDifference(adjustDate);
// // console.log(`User ID: ${userId}`);
console.log(`Total Logins: ${totalLogins}`);
console.log(`Last Logout Time: ${lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null}`);
console.log(`Total Work Hours: ${totalWorkHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds`);
// console.log(new Date())
        req.session.userId = userLoginHistory._id
        let userLogins = {
          totalLogins:totalLogins,
          lastLogoutTime:lastLogoutTime !== null ? format(lastLogoutTime,'yyyy.MM.dd HH:mm:ss'):null,
          lastLoginTime:lastLoginTime,
          totalHours:calcualtedTotalHours
        }

        res.status(200).json({
          success: true,
          message: "Login SUccessfully",
          user: company,
          userLogins,
          session:req.session,
          role:2,
          token,
        });
      }
    
    });


  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const updateCompanyProfile = async (req, res, next) => {
  const { name, contact, location, profileUrl, about } = req.body;

  try {
    // validation
    if (!name || !location || !about || !contact || !profileUrl) {
      next("Please Provide All Required Fields");
      return;
    }

    const id = req.body.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No Company with id: ${id}`);

    const updateCompany = {
      name,
      contact,
      location,
      profileUrl,
      about,
      _id: id,
    };

    const company = await Companies.findByIdAndUpdate(id, updateCompany, {
      new: true,
    });

    const token = company.createJWT();

    company.password = undefined;

    res.status(200).json({
      success: true,
      message: "Company Profile Updated SUccessfully",
      company,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getCompanyProfile = async (req, res, next) => {
  try {
    const id = req.body.user.userId;

    const company = await Companies.findById({ _id: id });

    if (!company) {
      return res.status(200).send({
        message: "Company Not Found",
        success: false,
      });
    }

    company.password = undefined;
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

//GET ALL COMPANIES
export const getCompanies = async (req, res, next) => {
  // console.log(req.session.loggedin)
  console.log("getcom",req.session.userId)
  try {
    const { search, sort, location } = req.query;

    //conditons for searching filters
    const queryObject = {};

    if (search) {
      queryObject.name = { $regex: search, $options: "i" };
    }

    if (location) {
      queryObject.location = { $regex: location, $options: "i" };
    }

    let queryResult = Companies.find(queryObject).select("-password");

    // SORTING
    if (sort === "Newest") {
      queryResult = queryResult.sort("-createdAt");
    }
    if (sort === "Oldest") {
      queryResult = queryResult.sort("createdAt");
    }
    if (sort === "A-Z") {
      queryResult = queryResult.sort("name");
    }
    if (sort === "Z-A") {
      queryResult = queryResult.sort("-name");
    }

    // PAGINATIONS
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // records count
    const total = await Companies.countDocuments(queryResult);
    const numOfPage = Math.ceil(total / limit);
    // move next page
    // queryResult = queryResult.skip(skip).limit(limit);

    // show mopre instead of moving to next page
    queryResult = queryResult.limit(limit * page);

    const companies = await queryResult;

    res.status(200).json({
      success: true,
      total,
      data: companies,
      page,
      numOfPage,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

//GET  COMPANY JOBS
export const getCompanyJobListing = async (req, res, next) => {
  const { search, sort } = req.query;
  const id = req.body.user.userId;

  try {
    //conditons for searching filters
    const queryObject = {};

    if (search) {
      queryObject.location = { $regex: search, $options: "i" };
    }

    let sorting;
    //sorting || another way
    if (sort === "Newest") {
      sorting = "-createdAt";
    }
    if (sort === "Oldest") {
      sorting = "createdAt";
    }
    if (sort === "A-Z") {
      sorting = "name";
    }
    if (sort === "Z-A") {
      sorting = "-name";
    }

    let queryResult = await Companies.findById({ _id: id }).populate({
      path: "jobPosts",
      options: { sort: sorting },
    });
    const companies = await queryResult;

    res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

// GET SINGLE COMPANY
export const getCompanyById = async (req, res, next) => {
 
  try {
    const { id } = req.params;

    const company = await Companies.findById({ _id: id }).populate({
      path: "jobPosts",
      options: {
        sort: "-_id",
      },
    });

    if (!company) {
      console.log('notfound')
      return res.status(200).send({
        message: "Company Not Found",
        success: false,
      });
    }

    company.password = undefined;
   console.log(company)
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};


export const updateCompanyPassword = async (newPassword,email,next) => {
  const salt = await bcrypt.genSalt(10);
  let newHasshedPassword = await bcrypt.hash(newPassword, salt);
  // this.password=newHasshedPassword ;
 let updatePasswrod =  Companies.findOneAndUpdate({email},{password:newHasshedPassword})
 return updatePasswrod
};