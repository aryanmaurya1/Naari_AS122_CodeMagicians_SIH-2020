const bcrypt = require("bcryptjs");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const { query } = require("../db");


const getSignUp = (req, res) => {
  res.render("digishopkeepersignup.ejs");
}

const postSignUp = async (req, res) => {
  await check("digishopkeeper_phonenumber").isMobilePhone("en-IN").run(req);
  await check("digishopkeeper_name").isLength({min:1}).run(req);
  await check("digishopkeeper_password").isLength({min:1}).run(req);
  await check("digishopkeeper_confirmPassword").equals(req.body.digishopkeeper_confirmPassword).run(req);
  await check("digishopkeeper_latt").isLength({min:1}).run(req);
  await check("digishopkeeper_long").isLength({min:1}).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.statusCode = 422;
    console.log(errors);
    let err = "";
    errors.array().forEach(element => {
      if (element.param === "confirmPassword") {
        err += "Password do not matches";
      }
      else {
        err += "Invalid " + element.param + ".";
      }
    });
    req.flash("error",` ${err}`);
    res.redirect("/digishopkeeper/signup");
    return;
  }

  const {digishopkeeper_phonenumber, digishopkeeper_name, digishopkeeper_password, digishopkeeper_latt, digishopkeeper_long } = req.body;

  query("SELECT digishopkeeper_id FROM digishopkeeper WHERE digishopkeeper_phonenumber=$1",[digishopkeeper_phonenumber]) 
    .then(function(result) {
        if(result.rows.length !== 0) {
          req.flash("error", "already registered kindly login to continue");
          res.redirect("/digishopkeeper/signup"); 
          return;
        }
        
        bcrypt.genSalt(3)
          .then(function(salt){
            bcrypt.hash(digishopkeeper_password,salt)
             .then(function(hash) {
              query("INSERT INTO wallets(wallet_balance) VALUES($1) RETURNING wallet_no", [0])
                .then(function(result){
                  const wallet_no = result.rows[0].wallet_no;
                  query("INSERT INTO digishopkeeper(digishopkeeper_phonenumber, digishopkeeper_name, digishopkeeper_pass, digishopkeeper_latt, digishopkeeper_long, digishopkeeper_wallet_no) VALUES($1,$2,$3,$4,$5,$6)", [digishopkeeper_phonenumber,digishopkeeper_name, hash, digishopkeeper_latt, digishopkeeper_long, wallet_no ])
                    .then(function(result) {
                      req.flash("success_message", "signup successfull");
                      res.redirect("/digishopkeeper/login");
                    })
                    .catch(function(err) {
                      
                  console.log(err);

                  req.flash("error", "internal server error");
                  res.redirect("/digishopkeeper/signup");
                    })
                })
                .catch(function(err) {
                  console.log(err);

                req.flash("error", "internal server error");
                res.redirect("/digishopkeeper/signup");
                })
             })
             .catch(function(err){
                console.log(err);
                req.flash("error", "internal server error");
                res.redirect("/digishopkeeper/signup");
             })
          })
          .catch(function(err){
            console.log(err);
            req.flash("error", "internal server error");
            res.redirect("/digishopkeeper/signup");            
          })
          
      
    })
    .catch(function(err) {
      console.log(err);
      req.flash("error", "internal server error");
      res.redirect("/digishopkeeper/signup");
    })

}


const getLogin = (req, res) => {
  res.render("digishopkeeperlogin");
}

const postLogin = async (req, res,next) => {
  await check("digishopkeeper_password").isLength({ min: 1 }).run(req);
  await check("digishopkeeper_phonenumber").isMobilePhone("en-IN").run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", "invalid details kindly check mobile number");
    res.redirect("/digishopkeeper/login");
    return;
  }
  console.log(req.body);
  passport.authenticate("local.digishopkeeper", {
    failureRedirect: "/digishopkeeper/login",
    successRedirect: "/digishopkeeper/send",
    failureFlash: true
  })(req, res, next);
}

module.exports = {
  getSignUp: getSignUp,
  postSignUp: postSignUp,
  getLogin: getLogin,
  postLogin: postLogin
};
