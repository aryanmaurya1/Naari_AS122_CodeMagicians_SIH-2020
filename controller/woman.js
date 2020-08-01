const bcrypt = require("bcryptjs");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const { query } = require("../db");


/**
 * 
 * @param  req 
 * @param  res
 * GET /woman/login 
 */

const getLogin = (req, res) => {
  res.render("womanlogin");
};

/**
 * 
 * @param  req 
 * @param  res
 * POST /woman/login 
 */

const postLogin = async (req, res, next) => {
  await check("password").isLength({ min: 1 }).run(req);
  await check("woman_phonenumber").isMobilePhone("en-IN").run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render("womanlogin", { err: "invalid details kindly check phone number" });
    return;
  }
  console.log(req.body);
  passport.authenticate("local.woman", {
    failureRedirect: "/woman/login",
    successRedirect: "/woman/dashboard",
    failureFlash: true
  })(req, res, next);
};

/**
 * 
 * @param  req 
 * @param  res
 * GET /woman/signup 
*/
const getSignup = (req, res) => {
  res.render("womansignup");
}


/**
 * 
 * @param  req 
 * @param  res
 * POST /woman/signup 
 */
const postSignup = async (req, res) => {
  await check("woman_phonenumber").isMobilePhone("en-IN").run(req);
  await check("woman_name").notEmpty().run(req);
  await check("password").isLength({ min: 1 }).run(req);
  await check("confirmPassword").equals(req.body.password).run(req);
  await check("woman_date_of_birth").isLength({ min: 1 }).run(req);

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
    res.render("womansignup", { err: `${err}` });
    return;
  }

  const { woman_phonenumber, woman_name, password, woman_date_of_birth } = req.body;
  query("SELECT woman_phonenumber FROM women WHERE  woman_phonenumber=$1", [woman_phonenumber])
    .then(function (result) {
      const data = result.rows.length;
      if (data !== 0) {
        res.render("womansignup", { err: "user already exist try to login" });
        return;
      }
      bcrypt.genSalt(3)
        .then(function (salt) {
          bcrypt.hash(password, salt)
            .then(function (hash) {
              query("INSERT INTO wallets(wallet_balance) VALUES($1) RETURNING wallet_no", [0])
                .then(function (result) { 
                  const wallet_no = result.rows[0].wallet_no;
                  query("INSERT INTO women (woman_phonenumber, woman_name, woman_password, woman_date_of_birth, woman_wallet_no) VALUES($1,$2,$3,$4,$5)", [woman_phonenumber, woman_name, hash, woman_date_of_birth,wallet_no])
                    .then(function () {
                      req.flash("success_message", "Registered successfully... Login to continue..");
                      res.redirect("/woman/login");
                    })
                    .catch(function (err) {
                      console.log(err);
                      res.render("womansignup", { err: "internal server error" });
                    })
                })
                .catch(function (err) {
                  console.log(err);
                  res.render("womansignup", { err: "internal server error" });

                })
            })
            .catch(function (err) {
              console.log(err);
              res.render("womansignup", { err: "internal server error" });
            });
        })
        .catch(function (err) {
          console.log(err);
          res.render("womansignup", { err: "internal server error" });
        });
    })
    .catch(function (err) {
      console.log(err);
      res.render("womansignup", { err: "internal server error" });
    });
};
/**
 * GET /woman/logout 
 */
const getLogout = (req, res) => {
  req.logOut();
  res.redirect("/");
}
/**
 * GET /woman/dashboard 
 */
const getWomanDashboard = (req, res) => {
  res.render("womandashboard");
};

/**
 * GET /woman/documentaion 
 */
const getWomanDocumentation = (req, res) => {
  res.render("womandocumentation")
}

const getWomanBankAccount = (req, res) => {
  res.render("bankaccount");
}

module.exports = {
  getLogin: getLogin,
  postLogin: postLogin,
  getSignup: getSignup,
  postSignup: postSignup,
  getLogout: getLogout,
  getWomanDashboard: getWomanDashboard,
  getWomanDocumentation: getWomanDocumentation,
  getWomanBankAccount: getWomanBankAccount
};