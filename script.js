var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
var recognition = new SpeechRecognition()
var conversationTextarea = $('#conversation-textarea')
var conversation = ''
var awaitingResponse = false
var awaitingResponseFromCommandId
var awaitingResponseFromcommandstep = 0
var tempCommand
var tempResponse
window.triggers = []
window.commands = []
var faceId = 0
var nospeecherror = false
var video;
var videoStream;
var videoEnabled = false;
var useTriggers = true;
let classifier;
let predictions = [];

readData()
/* -----------------------------
     Command Functions
------------------------------ */

function enableTriggers() {
  useTriggers = true
}

function showWebcamStream() {
  if (!videoEnabled) {
    startVideoInput()
  }
  document.getElementById('videoContainer').style.display = 'block'
}

function hideWebcamStream() {
  document.getElementById('videoContainer').style.display = 'none'
}

function stopListening() {
  recognition.onend = () => {
    $('#startBtn').html('Start')
  }
  stopVideoInput()
  recognition.abort()
}

function disableTriggers() {
  useTriggers = false
}

function resetFace() {
  $('#mediaContainer').html("<img style='max-height:200px;' src='./face.gif' />")
}

function tempGiphy(search) {
  giphy(search, 0, false)
}

function youtube(search) {
  youtubeSearch(search)
}

function dictionarySearch(search) {
  define(search.split(" ")[search.split(" ").length - 1])
}

function closeYoutube() {
  resetFace()
}

function changeFace() {
  if (faceId < 20) {
    faceId++
  } else {
    faceId = 0
  }
  giphy('face', faceId)
}

function addTrigger(trigger) {
  window.triggers.push(trigger)
  writeData()
  readOutLoud(getResponseFromArrays(window.commands[awaitingResponseFromCommandId].steps[awaitingResponseFromcommandstep].responseArray, [trigger]))
}

function addCommand(command) {
  tempCommand = command
  readOutLoud(getResponseFromArrays(window.commands[awaitingResponseFromCommandId].steps[awaitingResponseFromcommandstep].responseArray, [command]))
}

function addCommandResponse(response) {
  tempResponse = response
  window.commands.push({
    inputs: [tempCommand],
    responseArray: [tempResponse]
  })
  writeData()
  readOutLoud(getResponseFromArrays(window.commands[awaitingResponseFromCommandId].steps[awaitingResponseFromcommandstep].responseArray, [response]))
}

function openEyes() {
  startVideoInput();
}

function closeEyes() {
  stopVideoInput();
}

function classifyCurrentVideo() {
  if (videoEnabled) {
    classifyVideo();
  } else {
    readOutLoud("Webcam is not enabled")
  }
}

/* -----------------------------
          Helpers
------------------------------ */

function setup() {
  noCanvas();
}

function classifyVideo() {
  classifier = ml5.imageClassifier('MobileNet', video, (a) => {
    predictions = []
    //Gather 10 predictions
    for (var i = 0; i < 10; i++) {
      classifier.predict(gotResult);
    }
  });
}

// When we get a result
function gotResult(err, results) {
  predictions.push(results)
  if (predictions.length === 10) {
    //todo: determine best/most consistant prediction
    var combined = {}
    for (var i = 0; i < predictions.length; i++) {
      for (var j = 0; j < predictions[i].length; j++) {
        if (!combined[predictions[i][j].className]) {
          combined[predictions[i][j].className] = { 'probability': parseFloat(nf(predictions[i][j].probability, 0, 2)), 'count': 1 }
        } else {
          combined[predictions[i][j].className].probability = ((combined[predictions[i][j].className].probability + (parseFloat(nf(predictions[i][j].probability, 0, 2)))) / 2)
          combined[predictions[i][j].className].count += 1
        }
      }
    }
    var combinedArr = []
    var keys = Object.keys(combined)
    for (var i = 0; i < keys.length; i++) {
      combinedArr.push({ className: keys[i], probability: combined[keys[i]].probability, count: combined[keys[i]].count })
    }
    combinedArr = combinedArr.sort((a, b) => {
      if (a.probability > b.probability) return -1
      if (a.probability < b.probability) return 1
      if (a.count > b.count) return -1

      return 1
    })
    var humanReadablePercent = Math.round(100 * parseFloat(combinedArr[0].probability))
    if (humanReadablePercent < 50) {
      readOutLoud("I am not sure, I doubt it but it might be a " + combinedArr[0].className)
    } else {
      readOutLoud("I am " + humanReadablePercent + "% sure that I am looking at a " + combinedArr[0].className)
    }
  }
}

function startVideoInput() {
  video = createCapture(VIDEO, (str) => {
    videoStream = str
    videoEnabled = true
  });
  video.parent('videoContainer');
}

function stopVideoInput() {
  if (videoEnabled) {
    video.stop();
    videoStream.getTracks()[0].stop();
    document.getElementById('videoContainer').innerHTML = '';
  }
  videoEnabled = false;
}

function writeData() {
  $.post('/write', JSON.stringify({ triggers: window.triggers, commands: window.commands }), () => { })
}

function define(text) {
  $.post('/dictionary', text, (data) => {
    readOutLoud(data)
  })
}

function youtubeSearch(text, restartRecognition = true) {
  $.post('/youtube', text, (data) => {
    $('#mediaContainer').html("<iframe allowfullscreen height='200' height='400' src='https://www.youtube.com/embed/" + data + "?autoplay=1&mute=1'/>")
    if (restartRecognition) {
      recognition.start()
    }
  })
}

function giphy(text, index = 0, restartRecognition = true) {
  $.post('/giphy', text, (data) => {
    $('#mediaContainer').html("<img style='max-height:200px;' src='" + data[index].images.original.url + "'/>")
    if (restartRecognition) {
      recognition.start()
    }
  })
}

function getResponseFromArrays(arr1, arr2) {
  var result = ''
  for (var i = 0; i < arr2.length; i++) {
    result += ' ' + arr1[i] + ' ' + arr2[i]
  }
  result += ' ' + arr1[arr1.length - 1]
  return result.trim()
}

function readData() {
  $.get('/read', (data) => {
    window.triggers = data.triggers
    window.commands = data.commands
  })
}

/* -----------------------------
             UI
------------------------------ */

function addtoConversation(message, response = false) {
  if (response) {
    conversation += "<li style='color:blue'>"
  } else {
    conversation += '<li>'
  }
  conversation += message + '</li>'
  conversationTextarea.html(conversation)
  conversationTextarea.find('li').last()[0].scrollIntoView()
}

$('#startBtn').on('click', () => {
  if ($('#startBtn').html() === 'Start') {
    recognition.start()
    $('#startBtn').html('Stop')
  } else {
    recognition.onend = () => {
      $('#startBtn').html('Start')
    }
    stopVideoInput()
    recognition.abort()
  }
})

$('#userInput').keypress(function (e) {
  if (e.charCode === 13) {
    var event = { resultIndex: 0, results: [[{ transcript: $('#userInput').val() }]] }
    recognition.onresult(event)
    return false
  }
})

/* -----------------------------
      Voice Recognition
------------------------------ */

recognition.continuous = true

recognition.onresult = (event) => {
  recognition.onend = () => {
    if (nospeecherror) {
      nospeecherror = false
      recognition.start()
      return
    }
    $('#userInput').val('')
    var current = event.resultIndex
    var transcript = event.results[current][0].transcript
    var mobileRepeatBug = (current > 1 && transcript === event.results[0][0].transcript)
    if (!mobileRepeatBug) {
      console.log(transcript.toLowerCase())
      if (awaitingResponse) {
        eval(window.commands[awaitingResponseFromCommandId].steps[awaitingResponseFromcommandstep].funcName)(transcript.toLowerCase())
        if (awaitingResponseFromcommandstep === window.commands[awaitingResponseFromCommandId].steps.length - 1) {
          awaitingResponseFromcommandstep = 0
          awaitingResponse = false
          awaitingResponseFromCommandId = null
        }
        awaitingResponseFromcommandstep += 1
        return
      }
      window.commandWithParam = ''
      if (useTriggers) {
        for (var i = 0; i < window.triggers.length; i++) {
          if (transcript.toLowerCase().indexOf(window.triggers[i]) === 0) {
            addtoConversation(transcript)
            window.commandWithParam = transcript.toLowerCase().substring(window.triggers[i].length).trim()
            if (transcript.toLowerCase().trim() === window.triggers[i]) {
              window.commandWithParam = "hello"
            }
          }
        }
      } else {
        addtoConversation(transcript)
        window.commandWithParam = transcript.toLowerCase().trim()
      }
      if (window.commandWithParam.length > 0) {
        $.post('/response', window.commandWithParam, (data) => {
          var words = window.commandWithParam.split(" ")
          var dataWords = data.split(" ")
          var greatestIndex = 0
          for (var j = 0; j < dataWords.length; j++) {
            if (words.indexOf(dataWords[j]) > greatestIndex)
              greatestIndex = dataWords.indexOf(words[j])
          }
          words.splice(0, greatestIndex + 1)
          var param = words.join(" ")
          var reload = true
          for (var j = 0; j < window.commands.length; j++) {
            for (var k = 0; k < window.commands[j].inputs.length; k++) {
              if (window.commands[j].inputs[k] === data) {
                if (window.commands[j].steps && window.commands[j].steps.length > 0) {
                  awaitingResponseFromCommandId = j
                  awaitingResponseFromcommandstep = 0
                  awaitingResponse = true
                }
                if (window.commands[j].funcName) {
                  eval(window.commands[j].funcName)(param)
                }
                if (window.commands[j].responseArray) {
                  readOutLoud(window.commands[j].responseArray[Math.floor(Math.random() * Math.floor(window.commands[j].responseArray.length))])
                }
                reload = false
                return
              }
            }
          }
          if (reload) {
            recognition.start()
          }
        })
      } else {
        recognition.start()
      }
    } else {
      recognition.start()
    }
  }
  recognition.abort()
}

recognition.onerror = function (event) {
  if (event.error === 'no-speech') {
    nospeecherror = true
  }
  if (event.error !== 'aborted') {
    console.log(event.error)
  }
}

/* -----------------------------
      Speech Synthesis
------------------------------ */
function readOutLoud(message) {
  addtoConversation(message, true)
  var speech = new SpeechSynthesisUtterance()
  speech.voice = getVoiceFromName('Google US English')
  speech.text = message
  speech.volume = 1
  speech.rate = 1
  speech.pitch = 1
  window.speechSynthesis.speak(speech)
  function _wait() {
    if (!window.speechSynthesis.speaking) {
      recognition.start()
      return
    }
    window.setTimeout(_wait, 200)
  }
  _wait()
}

var voices
window.speechSynthesis.onvoiceschanged = function () {
  voices = window.speechSynthesis.getVoices()
}

function getVoiceFromName(name) {
  var foundVoice = null
  voices.forEach(function (voice, index) {
    if (voice.name === name) {
      foundVoice = voice
    }
  })
  return foundVoice
}
