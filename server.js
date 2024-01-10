import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import session from "express-session";

import cookieParser from "cookie-parser";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import dbConnection from "./dbConfig/dbConnection.js";

// import dbConnection from "./dbConfig/dbConnection.js";
import router from "./routes/index.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import nodemailer from "nodemailer";
import ejs from "ejs";

dotenv.config();
// console.log('asdf')
const app = express();

const PORT = process.env.PORT || 8000;

// MONGODB CONNECTION
// dbConnection();
dbConnection()

// middlenames
app.use(cors("*"));
app.use(xss());
app.use(mongoSanitize());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(session({
  secret:'secret',
  resave:false,
  saveUninitialized:false,
  cookie:{
    secure:false,
    maxAge: 1000*60*2
  }
}))

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  service:'gmail',
  auth: {
    user: "mm2529025@gmail.com",
    pass: "posv sajk kxpo vads",
  },
});

app.set("mailer", transporter);
app.set("nmp_ejs",ejs)

app.use(morgan("dev"));

app.use(router);

//error middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Dev Server running on port: ${PORT}`);
});