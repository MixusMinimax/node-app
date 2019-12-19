const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mysql = require('mysql')
const config = require('./config')

const pool = mysql.createPool({
	host: config.mysql_host,
	user: config.mysql_user,
	password: config.mysql_password,
	database: config.mysql_database
})

function getUserByEmail(email) {
	var user = {
		email: email,
		name: "",
		password: "",
		date: "",
		hash: "",
		found: true
	}

	pool.query(`SELECT * FROM users WHERE email = '${user.email}'`, (err, rows) => {
		if (err)
			throw err;

		if (rows.length == 1) {
			const row = rows[0]
			user.name = row.name
			user.date = row.date
			user.hash = row.hash
			user.found = true
		}
		else {
			user.found = false
		}
	})
	return user
}

async function userHashValid(user) {
	const str = `email: ${user.email} name: ${user.name} password: ${user.password} date: ${user.date}`;
	return bcrypt.compare(str, user.hash);
}

function initialize(passport) {
	const authenticateUser = (email, password, done) => {
		const user = getUserByEmail(email)
		if (!user.found) {
			// user doesn't exist
			return done(null, false, { message: "Invalid email" })
		}
		user.password = password

		if (userHashValid(user)) {
			return done(null, user)
		}
		else {
			// wrong password
			return done(null, false, { message: "Wrong password" })
		}
	}

	passport.use(new LocalStrategy({
		usernameField: "email"
	}, authenticateUser))
	passport.serializeUser((user, done) => done(null, user.email))
	passport.deserializeUser((id, done) => {
		done(null, getUserByEmail(id))
	})
}

module.exports = initialize