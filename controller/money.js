const { check, validationResult } = require("express-validator");
const { query } = require("../db");
const child  = require("../config/child");

const getConvertMoney = (req, res) => {
  res.render("convertmoney.ejs");
}


const postConvertMoney = async (req, res) => {
  await check("reciever").isMobilePhone("en-IN").run(req);
  const errors = validationResult(req);
  
  if(!errors.isEmpty()) {
    res.statusCode = 422;
    console.log(errors);
    req.flash("error","Invalid Request, Kindly check for all the details");
    res.redirect("/money/convert");
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    req.flash("error", "no currency note image is uploaded");
    res.redirect('/money/convert');
    return;
  }
  const {reciever} = req.body;
  const sender_id = req.session.passport.user;
  const file = req.files.money;
  console.log(file);
  const extension = file.name.split('.')[1];
  console.log(req.sessionID);
  const filename = req.sessionID +  "." + extension;
  file.mv(`/home/onbit-syn/code-for-nation/money/${filename}`, function(err) {
    if (err) {
      console.log(err);
      req.flash("error","error occured while uploading a file");
      res.redirect('/money/convert');
      return;
    }
    child.run(filename)
    .then(async function(amnt){
      console.log("Predicted Amount is", amnt);
      await digiIndianTransferMoney(reciever,sender_id);
      renderPaymentGateway(amnt);

    })
    .catch(function(err){
      console.log(err);
    })
  });
}

function renderPaymentGateway(amount) {
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
  params['CALLBACK_URL'] = 'http://localhost:5436/callback3';
  params['EMAIL'] = 'abc@mailinator.com';
  params['MOBILE_NO'] = '7777777777';
  
  const txn_url = "https://securegw-stage.paytm.in/theia/processTransaction";
  
  
  params['TXN_AMOUNT'] = amount.toString() + '.00';
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


const successfulTransaction3 = async (req, res) => {
  console.log(req.body);;

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
          res.redirect("/digiIndian/wallet");
        }
        else {
          req.flash("success_message", "Transaction failed due to some unavoidable circumstaces.Try again later");
          res.render("/digiIndian/wallet");
        }
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });
}


module.exports = {
  getConvertMoney: getConvertMoney,
  postConvertMoney: postConvertMoney,
  successfulTransaction3: successfulTransaction3
};


