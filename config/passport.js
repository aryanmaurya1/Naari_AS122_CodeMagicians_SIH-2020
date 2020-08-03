const brcypt = require("bcryptjs");
const passportLocal = require("passport-local");
const LocalStrategy = passportLocal.Strategy;
const { query } = require("../db");





const digishopkeeper = new LocalStrategy(
  {
    usernameField: "digishopkeeper_phonenumber",
    passwordField: "digishopkeeper_password"
  },
  function (digishopkeeper_phonenumber, digishopkeeper_password, done) {
    query("SELECT digishopkeeper_phonenumber,digishopkeeper_pass,digishopkeeper_id FROM digishopkeeper WHERE digishopkeeper_phonenumber=$1", [digishopkeeper_phonenumber])
      .then(function (result) {
        const data = result.rows;

        if (data.length === 0) {
          done(null, false, { message: "User Doesn't Exist.Kindly signup" });
        }

        const hash = data[0].digishopkeeper_pass;
        brcypt.compare(digishopkeeper_password, hash)
          .then(function (match) {
            return match ? done(null, data[0].digishopkeeper_id) : done(null, false, { message: "Invalid Password" });
          })
          .catch(function (err) {
            console.log(err);
            return done(null, false, { message: "Internal Server Error. Kindly try Again" });
          });
      })
      .catch(function (err) {
        console.log(err);
        return done(null, false, { message: "Internal Server Error. Kindly try Again" });
      });
  })

  const womanStrategy = new LocalStrategy(
    {
      usernameField: "woman_phonenumber",
      passwordField: "password"
    },
    function (woman_phonenumber, password, done) {
      query("SELECT woman_phonenumber,woman_password,woman_id FROM women WHERE woman_phonenumber=$1", [woman_phonenumber])
        .then(function (result) {
          const data = result.rows;
  
          if (data.length === 0) {
            done(null, false, { message: "User Doesn't Exist.Kindly signup" });
          }
  
          const hash = data[0].woman_password;
          brcypt.compare(password, hash)
            .then(function (match) {
              return match ? done(null, data[0].woman_id) : done(null, false, { message: "Invalid Password" });
            })
            .catch(function (err) {
              console.log(err);
              return done(null, false, { message: "Internal Server Error. Kindly try Again" });
            });
        })
        .catch(function (err) {
          console.log(err);
          return done(null, false, { message: "Internal Server Error. Kindly try Again" });
        });
    })

    const msmeStrategy = new LocalStrategy(
      {
        usernameField: "phonenumber",
        passwordField: "password"
      },
      function (phonenumber, password, done) {
        console.log(phonenumber);
        console.log(password);
        query("SELECT msme_phonenumber,msme_password,msme_id FROM msmes WHERE msme_phonenumber=$1", [phonenumber])
          .then(function (result) {
            const data = result.rows[0];
    
            if (data.length === 0) {
              done(null, false, { message: "User Doesn't Exist.Kindly signup" });
            }
    
            const hash = data.msme_password;
            brcypt.compare(password, hash)
              .then(function (match) {
                return match ? done(null, data.msme_id) : done(null, false, { message: "Invalid Password" });
              })
              .catch(function (err) {
                console.log(err);
                return done(null, false, { message: "Internal Server Error. Kindly try Again" });
              });
          })
          .catch(function (err) {
            console.log(err);
            return done(null, false, { message: "Internal Server Error. Kindly try Again" });
          });
      })
  

const configStrategy = (passport) => {
  passport.use('local.digishopkeeper',digishopkeeper);
  passport.use("local.woman", womanStrategy);
  passport.use("local.msme", msmeStrategy);  
  
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