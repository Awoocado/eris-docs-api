const express = require("express")
const docs = require("./eris")

const app = express()

app.get('/', function (req, res) {
  var query = req.query.query
  if (!query) return res.send({ content: "?" })
  res.send(docs(query.split(" ")))
})

app.listen(process.env.PORT || 5000)

