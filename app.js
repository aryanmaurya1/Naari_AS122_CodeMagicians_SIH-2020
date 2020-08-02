const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const app = express();
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const fileUpload = require("express-fileupload");
const { COOKIE_SECRET, SESSION_SECRET, PORT, HOSTNAME } = require("./env");


const { configStrategy, isAuthenticated } = require("./config/passport");
const woman = require("./controller/woman");
const msme = require("./controller/msme");
const money = require("./controller/money");
const wallet = require("./controller/wallet");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(fileUpload());

app.use(cookieParser(COOKIE_SECRET));

app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
configStrategy(passport);

app.use(function (req, res, next) {
  res.locals.success_message = req.flash("success_message");
  res.locals.error_message = req.flash("error_message");
  res.locals.error = req.flash("error");
  next();
});

app.use(express.static(path.join(__dirname, "/public")));
// woman login logout related routes...
app.get("/woman/login", woman.getLogin);
app.post("/woman/login", woman.postLogin);
app.get("/woman/signup", woman.getSignup);
app.post("/woman/signup", woman.postSignup);
app.get("/woman/logout", isAuthenticated, woman.getLogout);
app.get("/woman/dashboard",isAuthenticated, woman.getWomanDashboard);
app.get("/woman/documentation", isAuthenticated, woman.getWomanDocumentation);
app.get("/woman/dashboard", isAuthenticated, woman.getWomanDashboard);



app.get("/woman/wallet", isAuthenticated, wallet.getWallet);
app.post("/gullak/addmoney",isAuthenticated, wallet.postGullakAddMoney);
app.post("/callback", isAuthenticated, wallet.successfulTransaction);
app.get("/gullak/reedem", isAuthenticated, wallet.getGullakReedem);
app.post("/wallet/addmoney", isAuthenticated, wallet.postAddWalletMoney);
app.post("/callback2", isAuthenticated, wallet.successfulTransaction2);
app.post("/callback3",isAuthenticated,money.successfulTransaction3);
// msme routes...
app.get("/msme/signup", msme.getMsmeSignup);
app.post("/msme/signup", msme.postMsmeSignup);
app.get("/msme/login", msme.getMsmeLogin);
app.post("/msme/login", msme.postMsmeLogin);
app.get("/msme/dashboard", isAuthenticated, msme.getMsmeDashboard);
app.get("/msme/logout", isAuthenticated, msme.getMsmeLogout);
app.get("/msme/addjob", isAuthenticated, msme.getMsmeAddJob);
app.post("/msme/addjob",isAuthenticated, msme.postMsmeAddJob);

//convert money
app.get("/money/convert",money.getConvertMoney);
app.post("/money/convert",money.postConvertMoney);

const server = http.createServer(app);

server.listen(PORT, HOSTNAME, function () {
  console.log(`server is listening at http://${HOSTNAME}:${PORT}`);
})