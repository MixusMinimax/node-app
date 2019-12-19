const express = require('express')
const bcrypt = require('bcrypt')
const escape = require('sql-escape')
const mysql = require('mysql')
const config = require('./config.json')
const app = express()

var port = process.env.PORT || 8080

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

// mysql

const pool = mysql.createPool({
	host: config.mysql_host,
	user: config.mysql_user,
	password: config.mysql_password,
	database: config.mysql_database
})

pool.query(`CREATE TABLE if not exists users ( email varchar(255), name varchar(255), date DATE, hash varchar(255) )`, (err, rows) => {
	if (err)
		throw err
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
	res.render("index.ejs")
})

app.get("/login", (req, res) => {
	res.render("login.ejs")
})

app.post("/login", async (req, res) => {
	const user = {
		email: req.body.email,
		name: "",
		password: req.body.password,
		date: ""
	}

	pool.query(`SELECT * FROM users WHERE email = '${user.email}'`, async (err, rows) => {
		if (err)
			throw err;

		if (rows.length == 1) {
			const row = rows[0]
			user.name = row.name
			user.date = row.date
			const hash = await userHash(user)
			if (hash === row.hash) {
				res.redirect("/")
			}
			else {
				// wrong password
				res.redirect("/login")
			}
		}
		else {
			// user doesn't exist
			res.redirect("/login")
		}
	})
})

app.get("/register", (req, res) => {
	res.render("register.ejs")
})

app.post("/register", async (req, res) => {
	const date = new Date();
	const user = {
		email: req.body.email,
		name: escape(req.body.name),
		password: req.body.password,
		date: date.toMysqlFormat()
	}
	const hash = await userHash(user)

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

// start

app.listen(port, () => {
	console.log("app running")
})