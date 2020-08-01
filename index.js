const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const app  = express();

const hostname = "localhost";
const port = 7432;

const server = http.createServer(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan("dev"));


app.use(express.static(path.join(__dirname,"/public")));






server.listen(port,hostname,function(){
  console.log("server is listening at http://localhost:7432");
})