var express = require('express')
var fs = require('fs')
var path = require('path')
var app = express()
var giphy = require('giphy-api')()
var Dictionary = require('oxford-dictionary-api')
var dict = new Dictionary(process.env.DICTIONARY_APP_ID, process.env.DICTIONARY_API_KEY)
var stringSimilarity = require('string-similarity')
var FuzzySet = require('fuzzyset.js')

/* serves main page */
app.get('/', function (req, res) {
  res.sendfile('index.html')
})

app.get('/read', function (req, res) {
  res.sendfile('save.json')
})

app.post('/response', function (req, res) {
  let inputArray = getInputs()
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    var fuzzySet = FuzzySet(getInputs())
    var matches = stringSimilarity.findBestMatch(body, inputArray)
    matches.ratings = matches.ratings.sort((a, b) => {
      if (a.rating > b.rating) return -1
      return 1
    })
    let fuzzyResults = fuzzySet.get(body).sort((a, b) => {
      if (a[0] > b[0]) return -1
      return 1
    })
    for (var j = 0; j < fuzzyResults.length && j < 10; j++) {
      var matchFound = false
      for (var i = 0; i < matches.ratings.length && i < 10; i++) {
        if (matches.ratings[i].target === fuzzyResults[j][1]) {
          matches.ratings[i].rating = (matches.ratings[j].rating + fuzzyResults[j][0]) / 2
          matchFound = true
        }
      }
      if (!matchFound) {
        matches.ratings.push({ target: fuzzyResults[j][1], rating: fuzzyResults[j][0] })
      }
    }
    var highestValue = 0
    var highestValueEntity
    for (i = 0; i < matches.ratings.length; i++) {
      if (matches.ratings[i].rating > highestValue) {
        highestValue = matches.ratings[i].rating
        highestValueEntity = matches.ratings[i].target
      }
    }
    res.end(highestValueEntity)
  })
})

app.post('/dictionary', function (req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    dict.find(body, function (error, data) {
      if (!error) {
        res.send(data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0])
      }
    })
  })
})

app.post('/youtube', function (req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    const YouTube = require('simple-youtube-api')
    const youtube = new YouTube(process.env.YOUTUBE_API_KEY)
    youtube.searchVideos(body, 1)
      .then(results => {
        res.end(results[0].id)
      })
      .catch(err => {
        res.end('error')
        console.log(err)
      })
  })
})

app.post('/write', function (req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    fs.writeFile('save.json', body, 'utf8', () => {
      res.end('ok')
    })
  })
})

app.post('/giphy', function (req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    giphy.search(body, function (err, data) {
      if (!err) {
        res.send(data.data)
      }
    })
  })
})

app.post('/read', function (req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', () => {
    fs.writeFile('save.json', body, 'utf8', () => {
      res.end('ok')
    })
  })
})

/* serves all the static files */
app.get(/^(.+)$/, function (req, res) {
  res.sendFile(path.join(__dirname, req.params[0]))
})

var port = process.env.PORT || 5000
app.listen(port, function () {
  console.log('Listening on ' + port)
})

function getInputs() {
  var response = []
  var obj = JSON.parse(fs.readFileSync('save.json', 'utf8'))
  for (var i = 0; i < obj.commands.length; i++) {
    for (var j = 0; j < obj.commands[i].inputs.length; j++) {
      response.push(obj.commands[i].inputs[j])
    }
  }
  return response
}
