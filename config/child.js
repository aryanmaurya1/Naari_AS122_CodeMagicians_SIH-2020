const Promise = require("bluebird");

const execFile = Promise.promisify(require("child_process").execFile);  

const run = function(args) {
  return new Promise(function(resolve, reject) {
    execFile("/home/onbit-syn/AS122_CodeMagicians_SIH2020/config/ml")
    .then(function(stdout, stderr) {
      console.log(stdout);
      resolve(stdout);
    })
    .catch(function(err){
      console.log(err);
    })
  })
}

module.exports = {
  run: run
}
