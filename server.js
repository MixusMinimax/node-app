const express = require('express')
const app = express()

var port = process.env.PORT || 8080

app.set('view-engine', 'ejs')

// routes

app.get("/", (req, res) => {
    res.render("index.ejs")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.post("/register", (req, res) => {
    
})

// start

app.listen(port, () => {
    console.log("app running")
})