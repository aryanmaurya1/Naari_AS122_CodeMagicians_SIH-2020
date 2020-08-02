const bcrypt = require("bcryptjs");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const { query,digishopkeeper_transaction } = require("../db");
const child = require("../config/child");;
const checksum_lib = require("../config/checksum");
const https = require("https");
const cookieParser = require('cookie-parser');


const PaytmConfig = {
  mid: "WAdOtf51495931344880",
  key: "Ka@oQE5rr!hILh6n",
  website: "WEBSTAGING"
}

const params = {};
  params['MID'] = PaytmConfig.mid;
  params['WEBSITE'] = PaytmConfig.website;
  params['CHANNEL_ID'] = 'WEB';
  params['INDUSTRY_TYPE_ID'] = 'Retail';
  params['ORDER_ID'] = 'TEST_' + new Date().getTime();
  params['CUST_ID'] = 'Customer001';
  params['TXN_AMOUNT'] = '1.00';
  params['CALLBACK_URL'] = 'http://localhost:7432/digishopkeeper/oncompletion';
  params['EMAIL'] = 'abc@mailinator.com';
  params['MOBILE_NO'] = '7777777777';
  


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

const getsendpage = (req, res) => {
  const digishopkeeper_id = req.session.passport.user;
  query("SELECT digishopkeeper_wallet_no FROM digishopkeeper WHERE digishopkeeper_id=$1",[digishopkeeper_id])
    .then(function(result){
      const wallet_no = result.rows[0].digishopkeeper_wallet_no;
      query("SELECT wallet_balance FROM wallets WHERE wallet_no=$1",[wallet_no])
        .then(function(result) {
          const wallet_balance = result.rows[0].wallet_balance;
          res.render("send",{wallet_balance:wallet_balance});
        })
        .catch(function(err){
          console.log(err);
          req.flash("error", "kindly try again");
          res.redirect("/digishopkeeper/login");
        })
    })
    .catch(function(err) {
      console.log(err);
      req.flash("error", "kindly try again");
      res.redirect("/digishopkeeper/login");
    })  
}


const postConvertMoney = async (req, res) => {
  await check("reciever").isMobilePhone("en-IN").run(req);
  const errors = validationResult(req);
  
  if(!errors.isEmpty()) {
    res.statusCode = 422;
    console.log(errors);
    req.flash("error","Invalid Request, Kindly check for all the details");
    res.redirect("/digishopkeeper/send");
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    req.flash("error", "no currency note image is uploaded");
    res.redirect('/digishopkeeper/send');
    return;
  }
  const {reciever} = req.body;
  const sender_id = req.session.passport.user;
  const file = req.files.money;
  console.log(file);
  const extension = file.name.split('.')[1];
  console.log(req.sessionID);
  const filename = req.sessionID +  "." + extension;
  file.mv(`/home/onbit-syn/AS122_CodeMagicians_SIH2020/money/${filename}`, function(err) {
    if (err) {
      console.log(err);
      req.flash("error","error occured while uploading a file");
      res.redirect('/digishopkeeper/send');
      return;
    }
    child.run(filename)
    .then(async function(amnt){
      console.log("Predicted Amount is", amnt);
      // await digiIndianTransferMoney(reciever,sender_id);
      res.cookie("reciever_phonenumber",reciever);
      renderPaymentGateway(amnt,req,res);

    })
    .catch(function(err){
      console.log(err);
      req.flash("error", "internal server error");
    })
  });
}

function renderPaymentGateway(amount,req,res) {
  console.log(typeof(amount));
  
  
  
  const txn_url = "https://securegw-stage.paytm.in/theia/processTransaction";
  
  
  params['TXN_AMOUNT'] = amount.toString() + '.00';
  console.log(params);
  // starting paytm transaction
  checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {
    let form_fields = "";
    for (let x in params) {
      form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
    }
    form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
    res.end();
  });
}
/**
 * POST /digishopkeeper/oncompletion 
 */
const digishopkeeperoncompletion = async (req, res) => {
  console.log("digishopkeeper on completion",req.body);
  const sender_id = req.session.passport.user;
  const reciever_phonenumber = req.cookies.reciever_phonenumber;

  // verify the checksum
  let checksumhash = req.body.CHECKSUMHASH;
  let result = checksum_lib.verifychecksum(req.body, PaytmConfig.key, checksumhash);
  console.log("Checksum Result => ", result, "\n");



  // Send Server-to-Server request to verify Order Status
  let params = { "MID": PaytmConfig.mid, "ORDERID": req.body.ORDERID };

  checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

    params.CHECKSUMHASH = checksum;
    let post_data = 'JsonData=' + JSON.stringify(params);

    var options = {
      hostname: 'securegw-stage.paytm.in', // for staging
      port: 443,
      path: '/merchant-status/getTxnStatus',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      }
    };


    // Set up the request
    var response = "";
    var post_req = https.request(options, async function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });

      post_res.on('end', async function () {
        console.log('S2S Response: ', response, "\n");
        let tnx_response = JSON.parse(response);
        console.log(tnx_response);

        if (tnx_response.STATUS !== 'TXN_SUCCESS') {
          req.flash("error", "error occured while adding money to gullak");
          res.send("/digishopkeeper/send");
        }
        else {
          try{
            await digishopkeeper_transaction(sender_id, reciever_phonenumber);
            req.flash("success_message", "success");
            res.redirect("/digishopkeeper/send");
          } catch(err) {
            console.log(err);
            req.flash("error", "error occured while performing transaction");
            res.redirect("/digishopkeeper/send");
          }

          
        }
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });
}


module.exports = {
  getSignUp: getSignUp,
  postSignUp: postSignUp,
  getLogin: getLogin,
  postLogin: postLogin,
  send: getsendpage,
  postConvertMoney: postConvertMoney,
  digishopkeeperoncompletion : digishopkeeperoncompletion
};
