const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mysql = require('mysql')
const query = require('./server.js').query
const userHashValid = require('./server.js').userHashValid

function initialize(passport) {
    const authenticateUser = (email, password, done) => {
        const user = {
            email: email,
            name: "",
            password: password,
            date: ""
        }

        query(`SELECT * FROM users WHERE email = '${user.email}'`, async (err, rows) => {
            if (err)
                throw err;

            if (rows.length == 1) {
                const row = rows[0]
                user.name = row.name
                user.date = row.date
                const hashValid = await userHashValid(user, row.hash)
                if (hashValid) {
                    return done(null, user)
                }
                else {
                    // wrong password
                    return done(null, false, { message: "Invalid email" })
                }
            }
            else {
                // user doesn't exist
                return done(null, false, { message: "Wrong password" })
            }
        })
    }

    passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser))
    passport.serializeUser((user, done) => { })
    passport.deserializeUser((id, done) => { })
}

module.exports = initialize