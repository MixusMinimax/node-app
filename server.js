if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

const express = require('express')
const bcrypt = require('bcrypt')
const escape = require('sql-escape')
const mysql = require('mysql')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const initializePassport = require('./passport-config')
const config = require('./config')
const app = express()

var port = process.env.PORT || 8080

initializePassport(passport)

app.set('view-engine', 'ejs')
app.set('views', './public/views');
app.use('/', express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// mysql

const pool = mysql.createPool({
	host: config.mysql_host,
	user: config.mysql_user,
	password: config.mysql_password,
	database: config.mysql_database
})

// functions

async function userHash(user) {
	const str = `email: ${user.email} name: ${user.name} password: ${user.password} date: ${user.date}`;
	return bcrypt.hash(str, 10)
}

function twoDigits(d) {
	if (0 <= d && d < 10) return "0" + d.toString();
	if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
	return d.toString();
}

Date.prototype.toMysqlFormat = function () {
	return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate())
};

// routes

app.get("/", (req, res) => {
	if (req.isAuthenticated())
		res.render("pages/index.ejs", req.user)
	else
		res.render("pages/indexAnonymous.ejs", req.user)
})

app.get("/login", (req, res) => {
	if (req.isAuthenticated())
		res.redirect("/")
	else
		res.render("pages/login.ejs")
})

app.post("/login", passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}))

app.get("/register", (req, res) => {
	if (req.isAuthenticated())
		res.redirect("/")
	else
		res.render("pages/register.ejs")
})

app.post("/register", async (req, res) => {
	const date = new Date();
	const user = {
		email: req.body.email,
		name: escape(req.body.name),
		password: req.body.password,
		date: date.toMysqlFormat()
	}
	console.log(user)
	const hash = await userHash(user)
	console.log(hash)

	pool.query(`SELECT * FROM users WHERE email = '${user.email}'`, async (err, rows) => {
		if (err)
			throw err;

		if (rows.length == 0) {
			pool.query(`INSERT INTO users (email, name, date, hash) VALUES ('${user.email}', '${user.name}', '${user.date}', '${hash}')`, (err2, rows2) => {
				if (err2)
					throw err2;
			});
			res.redirect("/login")
		}
		else {
			res.redirect("/register")
		}
	})
})

app.delete("/logout", (req, res) => {
	req.logOut()
	res.redirect("/")
})

// start

app.listen(port, () => {
	console.log("app running")
})