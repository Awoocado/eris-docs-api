const docs = require("./eris")

require("express")().get('/', function (req, res) {
  var query = req.query.query
  if (!query) return res.send({ usage: "https://eris-docs-api.herokuapp.com/?query=Client#createMessage" })
  res.send(docs(query.split(" ")))
}).listen(process.env.PORT || 5000)