const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require('../services/email');

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

// GET /auth/forgot-password
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password.ejs', { error: null, success: null });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        
        if (!user) {
            // Don't reveal if email exists or not (security)
            return res.render('auth/forgot-password.ejs', { 
                error: null, 
                success: 'If that email exists, a reset link has been sent.' 
            });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        
        // Send email
        await sendPasswordResetEmail(user, resetToken);
        
        res.render('auth/forgot-password.ejs', { 
            error: null, 
            success: 'If that email exists, a reset link has been sent.' 
        });
    } catch (error) {
        console.log(error);
        res.render('auth/forgot-password.ejs', { 
            error: 'Something went wrong. Try again.', 
            success: null 
        });
    }
});

// GET /auth/reset-password/:token
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.render('auth/reset-password.ejs', { 
                error: 'Invalid or expired reset link.', 
                token: null 
            });
        }
        
        res.render('auth/reset-password.ejs', { 
            error: null, 
            token: req.params.token 
        });
    } catch (error) {
        console.log(error);
        res.render('auth/reset-password.ejs', { 
            error: 'Something went wrong.', 
            token: null 
        });
    }
});

// POST /auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.render('auth/reset-password.ejs', { 
                error: 'Invalid or expired reset link.', 
                token: null 
            });
        }
        
        if (req.body.password !== req.body.confirmPassword) {
            return res.render('auth/reset-password.ejs', { 
                error: 'Passwords do not match.', 
                token: req.params.token 
            });
        }
        
        // Hash new password
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        await user.save();
        
        res.redirect('/auth/sign-in?success=Password reset successful. Please sign in.');
    } catch (error) {
        console.log(error);
        res.render('auth/reset-password.ejs', { 
            error: 'Something went wrong.', 
            token: req.params.token 
        });
    }
});

//Sign out
// get
router.get("/sign-out", (req, res) => {
    req.session.destroy(() => {
  res.redirect("/");

    });
});


module.exports = router;
