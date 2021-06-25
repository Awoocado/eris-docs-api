const express = require("express")
const docs = require("./eris")

const app = express()

app.get('/', function (req, res) {
  var query = req.query.query
  if (!query) return res.send({ usage: "https://eris-docs-api.herokuapp.com/?query=Client#createMessage" })
  res.send(docs(query.split(" ")))
})

app.listen(process.env.PORT || 5000)

