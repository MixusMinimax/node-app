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

async function userHashValid(user, hash)
{
	const str = `email: ${user.email} name: ${user.name} password: ${user.password} date: ${user.date}`;
	return bcrypt.compare(str, hash);
}

function initialize(passport) {
    const authenticateUser = (email, password, done) => {
        const user = {
            email: email,
            name: "",
            password: password,
            date: ""
        }

        pool.query(`SELECT * FROM users WHERE email = '${user.email}'`, async (err, rows) => {
            if (err)
                throw err;

            if (rows.length == 1) {
                const row = rows[0]
                user.name = row.name
                user.date = row.date
                user.id = user.date
                const hashValid = await userHashValid(user, row.hash)
                if (hashValid) {
                    return done(null, user)
                }
                else {
                    // wrong password
                    return done(null, false, { message: "Wrong password" })
                }
            }
            else {
                // user doesn't exist
                return done(null, false, { message: "Invalid email" })
            }
        })
    }

    passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser))
    passport.serializeUser((user, done) => { })
    passport.deserializeUser((id, done) => { })
}

module.exports = initialize