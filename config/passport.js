const brcypt = require("bcryptjs");
const passportLocal = require("passport-local");
const LocalStrategy = passportLocal.Strategy;
const { query } = require("../db");


const digi_shopkeeper_strategy = new LocalStrategy(

)


const configStrategy = (passport) => {
  
  passport.serializeUser(function (id, done) {
    console.log("serialize user id" , id);
    done(null, id);
  });


  passport.deserializeUser(function (id, done) {
    console.log("deserailize user id", id);
    done(null, id);
  });

};

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log("request is authenticated");
    res.set("Cache-control", "no-cache, private, no-store, must-revalidate, post-check=0,pre-check=0");
    return next();
  } else {
    console.log("the request was not authenticated");
    res.redirect("/");
  }
};

module.exports = {
  configStrategy: configStrategy,
  isAuthenticated: isAuthenticated
};