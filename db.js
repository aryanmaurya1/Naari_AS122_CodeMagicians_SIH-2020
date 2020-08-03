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


const walletTransaction = async function(woman_id, amount) {
  const client = await pool.connect();
  try{
    console.log(amount);
    await client.query('BEGIN');
    const wallet_no  = (await client.query("SELECT woman_wallet_no FROM women WHERE woman_id=$1",[woman_id])).rows[0].woman_wallet_no;
    
    await client.query("UPDATE wallets SET wallet_balance=wallet_balance+$1 WHERE wallet_no=$2",[amount, wallet_no]);
    await client.query('COMMIT');
  } catch(err){
    console.log(err);
    await client.query('ROLLBACK')
    throw err;
  } finally {
    client.release()
  }
};

const gullakTransaction = async function(woman_id, amount) {
  const client = await pool.connect();
  try{
    console.log(amount);
    await client.query('BEGIN');
    const wallet_no  = (await client.query("SELECT woman_wallet_no FROM women WHERE woman_id=$1",[woman_id])).rows[0].woman_wallet_no;
    
    const sender_wallet_balance = (await client.query("SELECT wallet_balance FROM wallets WHERE wallet_no=$1",[wallet_no])).rows[0].wallet_balance;
    
    if(sender_wallet_balance < amount) {
      throw new Error("insufficient balance");
    }

    await client.query("UPDATE wallets SET wallet_balance=wallet_balance-$1 WHERE wallet_no=$2",[amount,wallet_no]);

    await client.query("UPDATE gullak SET gullak_balance=gullak_balance+$1 WHERE gullak_id=1",[amount]);

    await client.query("INSERT INTO gullak_ledger(from_wallet_no,amnt) VALUES($1,$2)",[wallet_no,amount]);
    
    await client.query('COMMIT');
  } catch(err){
    console.log(err);
    await client.query('ROLLBACK')
    throw err;
  } finally {
    client.release()
  }
}


const gullakReedem = async function (woman_id)  {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet_no = (await client.query("SELECT woman_wallet_no FROM women WHERE woman_id=$1",[woman_id])).rows[0].woman_wallet_no; 
    //get total contribution of all women...
    const totalContribution = parseFloat((await client.query("SELECT SUM(amnt) As total FROM gullak_ledger")).rows[0].total);
    //get contribution of the particular woman...
    const totalContributionWoman = parseFloat((await client.query("SELECT SUM(amnt) AS total FROM gullak_ledger WHERE from_wallet_no=$1", [wallet_no])).rows[0].total)
    //get current balance of gullak wallet..
    const total = parseInt((await (await client.query("SELECT gullak_balance FROM gullak WHERE gullak_id=1")).rows[0].gullak_balance),10);
    console.log(total);
    console.log(totalContribution);
    console.log(totalContributionWoman);
    const ans = ((totalContributionWoman / totalContribution) * (total - totalContribution)) + totalContributionWoman;
    console.log(ans);

    await client.query("UPDATE wallets SET wallet_balance=wallet_balance + $1 WHERE wallet_no=$2", [ans, wallet_no]);

    await client.query("UPDATE gullak SET gullak_balance=gullak_balance - $1 WHERE gullak_id=1", [ans])

    await client.query("DELETE FROM gullak_ledger WHERE from_wallet_no=$1", [wallet_no]);

    await client.query("COMMIT");
  } catch(err) {
    console.log(err);
    await client.query('ROLLBACK')
    throw err;
  } finally {
    client.release()

  }
}

module.exports = {
  pool:pool,
  query:query,
  digishopkeeper_transaction:digishopkeeper_transaction,
  walletTransaction: walletTransaction,
  gullakTransaction: gullakTransaction,
  gullakReedem: gullakReedem
}