const docs = require("./eris")

require("express")().get('/:query?', function (req, res) {
  var query = req.params.query
  if (!query) return res.send({ content: "?" })
  res.send(docs(query.split(" ")))
}).listen(process.env.PORT || 8000)

