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
// select woman_wallet_no from women where woman_phonenumber='9415436545';


const digishopkeeper_transaction = async function(reciever_phonenumber, sender_id, amount) {
  const client = await pool.connect();
  try{
    console.log(typeof(reciever_phonenumber));
    console.log(sender_id);
    console.log(amount);
    await client.query('BEGIN');
    


    let result = await client.query("SELECT woman_wallet_no FROM women WHERE woman_phonenumber=$1",[reciever_phonenumber])
    // console.log(result);
    const reciever_wallet_no = result.rows[0].woman_wallet_no;
    
    const sender_wallet_no = (await client.query("SELECT digishopkeeper_wallet_no FROM digishopkeeper WHERE digishopkeeper_id=$1",[sender_id])).rows[0].digishopkeeper_wallet_no;

    const sender_wallet_balance = (await client.query("SELECT wallet_balance FROM wallets WHERE wallet_no=$1",[sender_wallet_no])).rows[0].wallet_balance;

    if(sender_wallet_balance < amount) {
      throw new Error("insufficient balance");
    }
    await client.query("UPDATE wallets SET wallet_balance=wallet_balance-$1 WHERE wallet_no=$2",[amount,sender_wallet_no]);

    await client.query("UPDATE wallets SET wallet_balance=wallet_balance+$1 WHERE wallet_no=$2",[amount, reciever_wallet_no]);

    await client.query("DELETE FROM recievers WHERE sender_id=$1",[sender_id]);

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