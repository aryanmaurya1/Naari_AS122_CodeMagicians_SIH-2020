const pg = require("pg");
const {Promise} = require("bluebird");
const {dbConfig} = require("./env");

const pool  = new pg.Pool(dbConfig);

const query = function (sqlcommand,params) {
  return new Promise(function (resolve,reject) {
    pool.query(sqlcommand,params)
      .then(function(result){
        resolve(result);
      })
      .catch(function(err) {
        reject(err);
      });
  });
}

const digishopkeeper_transaction = async function(reciever_phonenumber, sender_id, amount) {
  const client = await pool.connect();
  try{
    await client.query('BEGIN');
    const reciever_wallet_no = (await client.query("SELECT woman_wallet_no FROM women WHERE woman_phonenumber=$1",[reciever_phonenumber])).rows[0].woman_wallet_no;
    const sender_wallet_no = (await client.query("SELECT digishopkeeper_wallet_no FROM digishopkeeper WHERE digishopkeeper_id=$1",[sender_id])).rows[0].digishopkeeper_wallet_no;

    await client.query("UPDATE wallets SET wallet_balance=wallet_balance-$1 WHERE wallet_no=$2",[amount,sender_wallet_no]);

    await client.query("UPDATE wallets SET wallet_balance=wallet_balance+$1 WHERE wallet_no=$2",[amount, reciever_wallet_no]);

    await client.query('COMMIT');
  } catch(err){
    console.log(err);
    await client.query('ROLLBACK')
    throw err;
  } finally {
    client.release()
  }
};

module.exports = {
  pool:pool,
  query:query,
  digishopkeeper_transaction:digishopkeeper_transaction
}