var db = require("../models");
var passport = require("../config/passport");
var express = require("express");
var session = require('express-session')
var path = require("path");

var isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function (app) {
    
    app.get("/home", isAuthenticated, function (req, res) {
        res.redirect("Home.html");
    });
    
    app.get("/signup", function (req, res) {
        if (req.user) {
            res.redirect("/home");
            return;
        }

        res.status(200).render("auth/signup");
    });

    app.post("/signup", function (req, res, next) {
        if (req.user) {
            res.redirect("/home");
            return;
        }

        req.check("first_name", "First Name is Required").notEmpty();
        req.check("last_name", "Last Name is Required").notEmpty();
        req.check("user_name", "User Name is Required").notEmpty();
        req.check("email", "Email is Required").notEmpty();
        req.check("email", "Email is not valid.").isEmail();
        req.check("password", "Password is Required").notEmpty();
        req.check("password", "Password should have at least 5 characters.").isLength({ min: 5 })

        var errors = req.validationErrors();
        
        if (errors.length > 0) {
            req.flash("message", errors[0].msg);
            res.redirect("/signup");
            return;
        }

        passport.authenticate("local.signup", function(err, user, info) {
            if (err) {
                console.log("Error: ", err);
                return next(err);
            }
            if (!user) {
                return res.redirect("/login");
            }

            req.logIn(user, function(err) {
                console.log("Signup user: ", req.user);

                if (err) {
                    return next(err);
                }

                return res.redirect("/home");
              });

        })(req, res, next);
    });

    app.get("/login", function (req, res) {
        if (req.user) {
            res.redirect("/home");
            return;
        }

        res.status(200).render("auth/login");
    });

    app.post("/login", function(req, res, next) {
        if (req.user) {
            res.redirect("/");
            return;
        }

        req.check("user_name", "User Name is Required").notEmpty();
        req.check("password", "Password is Required").notEmpty();
        
        var errors = req.validationErrors();
        
        if (errors.length > 0) {
            req.flash("message", errors[0].msg);
            res.redirect("/login");
            return;
        }

        passport.authenticate("local.login", function(err, user, info) {
            if (err) {
                console.log("Error: ", err);
                return next(err);
            }
            if (!user) {
                return res.redirect("/login");
            }

            req.logIn(user, function(err) {
                console.log("Login user: ", req.user);

                if (err) {
                    return next(err);
                }

                return res.redirect("/home");
              });

        })(req, res, next);

    });

    app.get("/userprofile", isAuthenticated, function (req, res) {
        console.log("User profile, user: ", req.user);

        var user = {
            id: req.user.id,
            userName: req.user.userName,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email
        };

        res.status(200).render("userprofile", {
            user: user
        });
    });

    app.post("/userprofile", isAuthenticated, function (req, res) {
        var userId = req.user.id;

        var newInfo = {
            firstName: req.body.first_name,
            lastName: req.body.last_name,
            email: req.body.email,
            password: req.body.password
        };
        if (newInfo.password.length === 0) {
            delete newInfo.password;
        }

        db.User.update(newInfo, {
                where: {
                    id: userId
                },
                individualHooks: true
            })
            .then(function (rowsUpdated) {

                req.user.firstName = newInfo.firstName;
                req.user.lastName = newInfo.lastName;
                req.user.email = newInfo.email;

                res.redirect(302, "userprofile");
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    app.get("/edituserprofile", isAuthenticated, function (req, res) {
        var user = {
            id: req.user.id,
            userName: req.user.userName,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email
        };

        res.status(200).render("edituserprofile", {
            user: user
        });
    });

    app.get("/logout", function (req, res) {
        req.logout();
        res.redirect("/");
    });
};