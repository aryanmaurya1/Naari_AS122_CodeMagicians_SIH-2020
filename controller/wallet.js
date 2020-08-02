const https = require('https');
const qs = require("querystring");
const checksum_lib = require("../config/checksum");
const {query} = require("../db");

const { HOSTNAME } = require("../env");
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
params['CALLBACK_URL'] = `http://${HOSTNAME}:7432/`;
params['EMAIL'] = 'abc@mailinator.com';
params['MOBILE_NO'] = '7777777777';

const getWallet = (req, res) => {
  const woman_id = req.session.passport.user;
  query("SELECT woman_wallet_no FROM women WHERE woman_id=$1", [woman_id])
    .then(function (result) {
      const wallet_no = result.rows[0].woman_wallet_no;
      console.log("wallet no ", wallet_no);
      query("SELECT wallet_balance FROM wallets WHERE wallet_no=$1", [wallet_no])
        .then(function (result) {
          const my_wallet_balance = result.rows[0].wallet_balance;
          query("SELECT amnt FROM gullak_ledger WHERE from_wallet_no=$1", [wallet_no])
            .then(function (result) {
              let total_contribution = 0;
              result.rows.forEach((ele) => {
                total_contribution += parseInt(ele.amnt, 10);
              });
              query("SELECT gullak_balance FROM gullak WHERE gullak_id=$1", [1])
                .then(function (result) {
                  const gullak_balance = result.rows[0].gullak_balance;
                  console.log("my wallet balance", my_wallet_balance);
                  console.log("total_contribution", total_contribution);
                  console.log("gullak_balance", gullak_balance);
                  res.render("wallet", {
                    data: { my_wallet_balance: my_wallet_balance, total_contribution: total_contribution, gullak_balance: gullak_balance }
                  });
                })
                .catch(function (err) {
                  console.log(err);
                  req.flash("error", "error while getting wallet kindly try again");
                  res.redirect("/woman/dashboard");
                })

            })
            .catch(function (err) {
              console.log(err);
              req.flash("error", "error while getting wallet kindly try again");
              res.redirect("/woman/dashboard");
            })
        })
        .catch(function (err) {
          console.log(err);
          req.flash("error", "error while getting wallet kindly try again");
          res.redirect("/woman/dashboard");
        })
    })
    .catch(function (err) {
      console.log(err);
      req.flash("error", "error while getting wallet kindly try again");
      res.redirect("/woman/dashboard");
    })
}




module.exports = {
  getWallet: getWallet
}