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


module.exports = {
  pool:pool,
  query:query,
}