const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const cors = require('cors');
const app = express();
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const fileUpload = require("express-fileupload");
const { COOKIE_SECRET, SESSION_SECRET, PORT, HOSTNAME } = require("./env");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const { configStrategy, isAuthenticated } = require("./config/passport");
const digishopkeeper = require("./controller/digishopkeeper");
const woman = require("./controller/woman");
const wallet = require("./controller/wallet");
const gullak = require("./controller/gullak");
const msme = require("./controller/msme");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
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

// hard cash to digi cash related routes...
app.get("/digishopkeeper/login", digishopkeeper.getLogin);
app.post("/digishopkeeper/login", digishopkeeper.postLogin);
app.get("/digishopkeeper/signup", digishopkeeper.getSignUp);
app.post("/digishopkeeper/signup", digishopkeeper.postSignUp);
app.get("/digishopkeeper/send", isAuthenticated, digishopkeeper.send);
app.post("/digishopkeeper/send", isAuthenticated, digishopkeeper.postConvertMoney);
app.post("/digishopkeeper/oncompletion", isAuthenticated, digishopkeeper.digishopkeeperoncompletion);

// woman related routes
app.get("/woman/signup", woman.getSignup);
app.post("/woman/signup", woman.postSignup);
app.get("/woman/login", woman.getLogin);
app.post("/woman/login", woman.postLogin);
app.get("/woman/dashboard", isAuthenticated, woman.getWomanDashboard);
app.get("/woman/documentation", isAuthenticated, woman.getWomanDocumentation);
// app.get("/womaneducation.html")


// woman wallet related routes
app.get("/woman/wallet", isAuthenticated, wallet.getWallet);
app.post("/wallet/addmoney", isAuthenticated, wallet.addMoneyToWallet);
app.post("/wallet/oncompletion", isAuthenticated, wallet.walletoncompletion);

// gullak related routes
app.post("/gullak/addmoney", isAuthenticated, gullak.gullakAddMoney);
app.post("/gullak/add/oncompletion", isAuthenticated, gullak.gullakaddoncompletion);
app.get("/gullak/reedem",isAuthenticated, gullak.getGullakReedem);

// msme realted routes
app.get("/msme/signup", msme.getMsmeSignup);
app.post("/msme/signup", msme.postMsmeSignup);
app.get("/msme/login", msme.getMsmeLogin);
app.post("/msme/login", msme.postMsmeLogin);
app.get("/msme/dashboard", isAuthenticated, msme.getMsmeDashboard);
app.get("/msme/logout", isAuthenticated, msme.getMsmeLogout);
app.get("/msme/addjob", isAuthenticated, msme.getMsmeAddJob);
app.post("/msme/addjob",isAuthenticated, msme.postMsmeAddJob);


const server = http.createServer(app);

server.listen(PORT, HOSTNAME, function () {
  console.log(`server is listening at http://${HOSTNAME}:${PORT}`);
})
