const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const app  = express();
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { COOKIE_SECRET, SESSION_SECRET, PORT, HOSTNAME } = require("./env");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const { configStrategy, isAuthenticated } = require("./config/passport");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

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

const server = http.createServer(app);

server.listen(PORT, HOSTNAME, function () {
  console.log(`server is listening at http://${HOSTNAME}:${PORT}`);
})
