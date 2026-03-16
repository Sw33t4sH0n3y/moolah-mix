const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user.js");

// get signup template
router.get("/sign-up", (req, res) => {
  res.render("auth/sign-up.ejs");
});
// create a user
// post: auth/sign-up
router.post("/sign-up", async (req, res) => {
   const userInDatabase = await User.findOne({ username: req.body.username });
if (userInDatabase) {
  return res.send("Username already taken.");
}

if (req.body.password !== req.body.confirmPassword) {
  return res.send("Password and Confirm Password must match");
}

// checks to see if user exits
const hashedPassword = bcrypt.hashSync(req.body.password, 10);
req.body.password = hashedPassword;

// validation logic

//creating new user
const user = await User.create(req.body);
req.session.user = {
  _id: user._id,
  username: user.username,
  displayName: user.displayName
};
req.session.save(() => {
  res.redirect('/');
});
});

router.get("/sign-in", (req, res) => {
  res.render("auth/sign-in.ejs");
});
//find a user
//post/auth/signin
router.post("/sign-in", async (req, res) => {
const userInDatabase = await User.findOne({ username: req.body.username });
if (!userInDatabase) {
  return res.send("Login failed. User not found.");
    }


//comparing password
const validPassword = bcrypt.compareSync(
  req.body.password,
  userInDatabase.password
);

if (!validPassword) {
  return res.send("Login failed. Password doesn't match.");
}
req.session.user = {
  _id: userInDatabase._id,
  username: userInDatabase.username,
  displayName: userInDatabase.displayName,
};
req.session.save(() => {
  res.redirect("/");
  });
});

//Sign out
// get
router.get("/sign-out", (req, res) => {
    req.session.destroy(() => {
  res.redirect("/");

    });
});


module.exports = router;
