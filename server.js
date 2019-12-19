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

function userHash(user) {
    const str = `email: ${user.email} name: ${user.name} password: ${user.password} date: ${user.date}`;

    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(str, "datboi", function (err, hash) {
            if (err) reject(err)
            resolve(hash)
        })
    })
    return hashedPassword
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

app.post("/login", (req, res) => {

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

    pool.query(`SELECT * FROM users WHERE email = '${user.email}'`, (err, rows) => {
        if (err)
            throw err;

        if (rows.length == 0) {
            const hash = userHash(user);
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

app.get("/users", (req, res) => {
    pool.query(`SELECT * FROM users`, (err, rows) => {
        if (err)
            throw err;

        rows.forEach(row => {
            console.log(`email: ${row.email} name: ${row.name} date: ${row.date} hash: ${row.hash}`)
        });
        res.redirect("/")
    })
})

// start

app.listen(port, () => {
    console.log("app running")
})