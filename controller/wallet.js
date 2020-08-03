const https = require('https');
const qs = require("querystring");
const checksum_lib = require("../config/checksum");
const {query,walletTransaction} = require("../db");

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
params['CALLBACK_URL'] = `http://${HOSTNAME}:7432/wallet/oncompletion`;
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

/**
 * POST /wallet/addmoney 
 */
const addMoneyToWallet = (req, res) => {
  const {amount}  = req.body;
  renderPaymentGateway(amount, req, res);
}

function renderPaymentGateway(amount, req, res, callback) {
  console.log(typeof (amount));
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
 * POST /wallet/oncompletion 
 */
const walletoncompletion = (req, res) => {
  const id = req.session.passport.user;
  console.log("walletoncompletion=>",req.body);
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
          res.send("/woman/wallet");
        }
        else {
          try {
            await walletTransaction(id, parseFloat(tnx_response.TXNAMOUNT));
            req.flash("success_message", "transaction successfull");
            res.redirect("/woman/wallet");
          } catch (err) {
            console.log(err);
            req.flash("error", "Insufficient balance kindly add money to your wallet");
            res.redirect("/woman/wallet");
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
  getWallet: getWallet,
  addMoneyToWallet: addMoneyToWallet,
  walletoncompletion: walletoncompletion
}