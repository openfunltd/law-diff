const express = require('express')
const path = require('path')
const app = express()

app.use('/favicon.ico', express.static(__dirname + '/favicon.ico'))
app.use('/images', express.static(__dirname + '/images'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/search.html'))
})
app.use('/bills', express.static(__dirname + '/bills.html'))
app.use('/sample_bill_api', express.static(__dirname + '/sample_bill_api.json'))
 
app.listen(3005)
