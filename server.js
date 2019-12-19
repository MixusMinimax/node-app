const express = require('express')
const app = express()

var port = process.env.PORT || 8080

app.set('view-engine', 'ejs')

// routes

app.get("/", (req, res) => {
    res.render("index.ejs")
})

app.listen(port, () => {
    console.log("app running")
})