const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const User = require("./models/user");
const tracksController = require("./controllers/tracks.js")
const { ROLES, PRO_OPTIONS, DAW_OPTIONS } = require('./config/constants');
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require('express-session');
const MongoStore = require("connect-mongo").default
const path =require("path");

const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");



// Set the port from environment variable or default to 3000
const port = process.env.PORT ? process.env.PORT : "3000";

// ternary operator
// let port;
// if (process.env.PORT) {
//   port = process.env.PORT;
// } else {
//   port = 3000;
// }

// controllers
const authController = require("./controllers/auth.js");
const apiController = require("./controllers/api.js");


mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Middleware for using HTTP verbs such as PUT or DELETE
app.use(methodOverride("_method"));
// Morgan for logging HTTP requests
app.use(morgan('dev'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    // store: MongoStore.create({
    //   mongoUrl: process.env.MONGODB_URI,
    // }),
  })
);
// Add our custom middleware right after the session middleware
app.use(passUserToView);
app.use((req, res, next) => {
  res.locals.ROLES= ROLES;
  res.locals.PRO_OPTIONS = PRO_OPTIONS;
  res.locals.DAW_OPTIONS = DAW_OPTIONS;
  next();
});

// GET /
app.get("/", async (req, res) => {
  if(req.session.user) {
    res.redirect("/hub");
  } else {
  res.render("index.ejs");
  }
});

// auth routes
app.use("/auth", authController);
app.use('/tracks', isSignedIn, tracksController);
app.use('/api', apiController)
// Profile routes
app.get("/hub", isSignedIn, async (req,res) => {
    const user = await User.findById(req.session.user._id);
    res.render("profile/hub.ejs", { user });
});

//PUT
app.put("/hub", isSignedIn, async (req,res) => {
  try {
    const updateData = {
      displayName: req.body.displayName,
      roles: Array.isArray(req.body.roles) ? req.body.roles : [req.body.roles].filter(Boolean),
      stageName: req.body.stageName || '',
      genre: req.body.genre || '',
      producerTag: req.body.producerTag || '',
      daw: req.body.daw || '',
      writerPro: req.body.writerPro || '',
      writerIpi: req.body.writerIpi || '',
      publishingCompany: req.body.publishingCompany || '',
      publisherPro: req.body.publisherPro || '',
      publisherIpi: req.body.publisherIpi || '',
    };
    await User.findByIdAndUpdate(req.session.user._id, updateData);

    //updat session
    req.session.user.displayName = updateData.displayName;

    res.redirect("/hub");
  } catch (error) {
    console.log(error);
    res.redirect("/hub")  
  }
});


app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});

