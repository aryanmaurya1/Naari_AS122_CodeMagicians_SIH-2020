const https = require('https');
const qs = require("querystring");
const checksum_lib = require("../config/checksum");
const {gullakTransaction} = require("../db");

const { HOSTNAME,PORT,USER } = require("../env");
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
params['CALLBACK_URL'] = `http://198.199.72.156:7432/gullak/add/oncompletion`;
params['EMAIL'] = 'abc@mailinator.com';
params['MOBILE_NO'] = '7777777777';

/**
 *  POST /gullak/addmoney
 */
const gullakAddMoney = (req, res) => {
  const {amount} = req.body;
  renderPaymentGateway(amount, req, res)
}

function renderPaymentGateway(amount, req, res) {
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


const gullakaddoncompletion = (req, res) => {
  const id = req.session.passport.user;
  console.log("gullak add on completion=>",req.body);
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
            await gullakTransaction(id, parseFloat(tnx_response.TXNAMOUNT));
            req.flash("success_message", "transaction successfull");
            res.redirect("/woman/wallet");
          } catch (err) {
            console.log(err);
            req.flash("error", "Insufficient balance kindly add money to your wallet or internal server error");
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
// adding routes now....
module.exports = {
  gullakAddMoney: gullakAddMoney,
  gullakaddoncompletion: gullakaddoncompletion
}