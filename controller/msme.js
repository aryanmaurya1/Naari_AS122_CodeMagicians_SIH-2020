const bcrypt = require("bcryptjs");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const { query } = require("../db");

/**
 * GET /msme/signup 
 */
const getMsmeSignup = (req, res) => {
  res.render("msmesignup");
};

/**
 * POST /msme/signup 
 */
const postMsmeSignup = async (req,res) => {
  await check("msme_name").notEmpty().run(req);
  await check("msme_uam").isLength({min:12, max:12}).run(req);
  await check("msme_owner").notEmpty().run(req);
  await check("msme_phonenumber").isMobilePhone("en-IN").run(req);
  await check("msme_address").notEmpty().run(req);
  await check("msme_email").isEmail().run(req);
  await check("msme_type").notEmpty().run(req);
  await check("msme_password").notEmpty().run(req);
  await check("msme_confirmPassword").equals(req.body.msme_password).run(req);
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    res.statusCode = 422;
    console.log(errors);
    req.flash("error", "Invalid request kindly check all the details");
    res.redirect("/msme/signup");
    return;
  }

  const {msme_name, msme_uam, msme_owner, msme_phonenumber, msme_address, msme_email, msme_type, msme_password} = req.body;
  let {msme_website}  = req.body;
  if (msme_website === "") msme_website = null;
  query("SELECT msme_phonenumber FROM msmes WHERE msme_phonenumber=$1",[msme_phonenumber])
    .then(function(result) {
      const data = result.rows;
      if(data.length > 0) {
        req.flash("error", "msme already registered kindly login to continue..");
        res.redirect("/msme/signup");
        return;
      }
      bcrypt.genSalt(7)
        .then(function(salt) {
          bcrypt.hash(msme_password, salt)
           .then(function(hash){
              console.log(hash);
              query("INSERT INTO msmes(msme_name, msme_owner, msme_uam, msme_address, msme_phonenumber, msme_email, msme_website, msme_type, msme_password) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",[msme_name, msme_owner, msme_uam, msme_address, msme_phonenumber, msme_email, msme_website, msme_type, hash])
                .then(function() {
                  console.log("inserted into database");
                  req.flash("success_message","successful signup login to continue");
                  res.redirect("/msme/login");
                })
                .catch(function(err) {
                  console.log(err);
                  res.statusCode = 500;
                  req.flash("error", "internal server errror");
                  res.redirect("/msme/signup");
                })
           })
        })
        .catch(function(err) {
          console.log(err);
          res.statusCode = 500;
          req.flash("error", "internal server errror");
          res.redirect("/msme/signup");
        })
    })
    .catch(function(err) {
      console.log(err);
      res.statusCode = 500;
      req.flash("error", "internal server errror");
      res.redirect("/msme/signup");
    })
};


/**
 * GET /msme/login 
 */
const getMsmeLogin = (req, res, next) => {
  res.render("msmelogin");
};

/**
 * POST /msme/login 
 */
const postMsmeLogin = async (req,res, next) => {
  await check("password").isLength({min:1}).run(req);
  await check("phonenumber").isMobilePhone("en-IN").run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.statusCode  = 400;
    req.flash("error", "invalid phone number or password length must be of length 1");
    res.redirect("/msme/login");
    return;
  }

  passport.authenticate("local.msme", {
    failureRedirect: "/msme/login",
    successRedirect: "/msme/dashboard",
    failureFlash: true
  })(req, res, next);
  
};

/**
 * GET /msme/dashboard
 * 
 */
const getMsmeDashboard = (req,res) => {
  const id = req.session.passport.user;
  query("SELECT msme_name FROM msmes WHERE msme_id=$1",[id])
    .then(function(result) {
      const data = result.rows[0];
      console.log(data);
      query("SELECT job_id,job_title FROM jobs WHERE job_msme_id=$1",[id])
        .then(function(result){
          let jobs_list  = result.rows;
          let i=0;
          console.log(jobs_list);
          const n = jobs_list.length;
          if(n==0) {
            res.render("msmedashboard",{msme_name:data.msme_name});
            return;
          }
          jobs_list.forEach((ele) => {
            query("SELECT COUNT(woman_id) FROM job_applicants WHERE job_id=$1",[ele.job_id])
            .then(function(result){
              const cnt = result.rows[0].count;
              jobs_list[i].job_applicants_count = cnt;
              i++;
              if(i >= n) {
                console.log("jobs_list",jobs_list);
                console.log("msme_name", data.msme_name);
                res.render("msmedashboard");
              }
            })
            .catch(function(err){
              console.log(err);
              res.redirect("/msme/login");
            })
          });

        })
        .catch(function(err){
          console.log(err);
          res.redirect("/msme/login");
        })
    })
    .catch(function(err) {
      console.log(err);
      res.redirect("/msme/login");
    })
};
/**
 * GET /msme/addjob  
 */
const getMsmeAddJob = (req,res) => {
  res.render("msmeaddjob");
};

/**
 *  POST /msme/addjob
 */
const postMsmeAddJob = async (req,res) => {
  await check("job_description").notEmpty().run(req);
  await check("job_contact").isMobilePhone("en-IN").run(req);
  await check("job_title").notEmpty().run(req);
  await check("job_keywords").notEmpty().run(req);
  await check("job_category").notEmpty().run(req);
  await check("job_email").isEmail().run(req);
  
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log(errors);
    req.flash("error", "Invalid request kindly check details");
    res.redirect("/msme/addjob");
    return;
  }
 
  const {job_title, job_contact, job_keywords, job_description, job_category, job_email} = req.body;
  const job_msme_id = req.session.passport.user;
  let {job_link} = req.body;
  if(job_link === "") job_link = null;
  
  const x = job_keywords.split(' ');
  let keywords = "{";
  
  for (let i=0; i<x.length; i++){
    if(x[i] !== ' ') {
      keywords +=  ("'" + x[i] +  "'" + ",")
    }
  } 
  
  keywords = keywords.substring(0, keywords.length - 1);
  console.log(keywords);
  keywords += "}";
  console.log(keywords);
  console.log(job_msme_id);
  query("INSERT INTO jobs(job_title, job_keywords, job_description, job_contact, job_email, job_msme_id, job_link, job_category) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[job_title, keywords, job_description, job_contact, job_email, job_msme_id, job_link, job_category])
    .then(function() {
      req.flash("success_message","successfully added the job");
      res.redirect("/msme/dashboard");
    })
    .catch(function(err) {
      console.log(err);
      req.flash("error","internal server errror try again");
      res.redirect("/msme/addjob");
    })

};
/**
 * GET /msme/promote 
 */
const getMsmePromote = (req, res) => {

};
/**
 * POST /msme/promote 
 */
const postMsmePromote = (req, res) => {

};

const getMsmeLogout = (req, res) => {
  req.logOut();
  res.redirect("/");
}
 
module.exports = {
  getMsmeLogin: getMsmeLogin,
  postMsmeLogin: postMsmeLogin,
  getMsmeSignup: getMsmeSignup,
  postMsmeSignup: postMsmeSignup,
  getMsmeDashboard: getMsmeDashboard,
  getMsmeAddJob: getMsmeAddJob,
  postMsmeAddJob: postMsmeAddJob,
  getMsmePromote: getMsmePromote,
  postMsmePromote: postMsmePromote,
  getMsmeLogout: getMsmeLogout
};
