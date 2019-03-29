var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();
var conversationTextarea = $('#conversation-textarea');
var conversation = '';
var awaitingResponse = false;
var awaitingResponseFromCommandId;
var awaitingResponseFromCommandStep = 0;
var tempCommand
var tempResponse
var triggers = []
var commands = []
var faceId = 3;
chatBotEnabled = false
nospeecherror = false
readData()
giphy("face", faceId, false)

/*-----------------------------
     Command Functions
------------------------------*/

function tempGiphy(search) {
  giphy(search, 0, false)
  setTimeout(() => {
    giphy("face", faceId, false)
  }, 15000)
}

function youtube(search) {
  youtube(search)
}

function closeYoutube() {
  giphy("face", faceId)
}

function changeFace() {
  if (faceId < 20) {
    faceId++;
  } else {
    faceId = 0;
  }
  giphy("face", faceId)
}

function toggleChatBot() {
  chatBotEnabled = !chatBotEnabled
}

function addTrigger(trigger) {
  triggers.push(trigger)
  writeData()
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [trigger]))
}

function addCommand(command) {
  tempCommand = command
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [command]))
}

function addCommandResponse(response) {
  tempResponse = response
  commands.push({
    command: tempCommand,
    response: tempResponse
  })
  writeData()
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [response]))
}

/*-----------------------------
          Helpers
------------------------------*/

function writeData() {
  $.post('/write', JSON.stringify({ triggers: triggers, commands: commands }), () => { })
}

function chatbot(text) {
  $.post('/chatbot', text, (data) => {
    readOutLoud(data)
  })
}

function youtube(text, restartRecognition = true) {
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
  var result = ""
  for (var i = 0; i < arr2.length; i++) {
    result += " " + arr1[i] + " " + arr2[i]
  }
  result += " " + arr1[arr1.length - 1]
  return result.trim()
}

function readData() {
  $.get('/read', (data) => {
    triggers = data.triggers
    commands = data.commands
  })
}

/*-----------------------------
             UI
------------------------------*/

function addtoConversation(message, response = false) {
  if (response) {
    conversation += "<li style='color:blue'>"
  } else {
    conversation += "<li>"
  }
  conversation += message + "</li>";
  conversationTextarea.html(conversation);
  conversationTextarea.find('li').last()[0].scrollIntoView()
}

$('#startBtn').on('click', () => {
  if ($('#startBtn').html() == 'Start') {
    recognition.start()
    $('#startBtn').html('Stop')
  } else {
    recognition.onend = () => {
      $('#startBtn').html('Start')
    }
    recognition.abort()
  }
})

$('#userInput').keypress(function (e) {
  if (e.charCode == 13) {
    var event = { resultIndex: 0, results: [[{ transcript: $('#userInput').val() }]] }
    recognition.onresult(event)
    return false;
  }
});

/*-----------------------------
      Voice Recognition 
------------------------------*/

recognition.continuous = true;

recognition.onresult = (event) => {
  recognition.onend = () => {
    if (nospeecherror) {
      nospeecherror = false;
      recognition.start()
      return;
    }
    $('#userInput').val('')
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    if (!mobileRepeatBug) {
      console.log(transcript.toLowerCase())
      if (awaitingResponse) {
        addtoConversation(transcript)
        eval(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].funcName)(transcript.toLowerCase());
        if (awaitingResponseFromCommandStep == commands[awaitingResponseFromCommandId].steps.length - 1) {
          awaitingResponseFromCommandStep = 0
          awaitingResponse = false
          awaitingResponseFromCommandId = null
        }
        awaitingResponseFromCommandStep += 1
        return
      }
      for (var i = 0; i < triggers.length; i++) {
        if (transcript.toLowerCase().indexOf(triggers[i]) == 0) {
          addtoConversation(transcript);
          var commandFound = false
          for (var j = 0; j < commands.length; j++) {
            for (var k = 0; k < commands[j].inputs.length; k++) {
              let cmd = commands[j].inputs[k]
              let param;
              if (cmd.indexOf('*') == (cmd.length - 1)) {
                cmd = cmd.substring(0, cmd.length - 2)
              }
              if (transcript.toLowerCase().indexOf(triggers[i] + " " + cmd) == 0) {
                param = transcript.toLowerCase().substring((triggers[i] + " " + cmd).length).trim()
                console.log('-------------')
                console.log(cmd)
                console.log(param)
                console.log('-------------')
                commandFound = true
                if (commands[j].steps && commands[j].steps.length > 0) {
                  awaitingResponseFromCommandId = j
                  awaitingResponseFromCommandStep = 0
                  awaitingResponse = true
                }
                if (commands[j].funcName) {
                  eval(commands[j].funcName)(param)
                }
                readOutLoud(commands[j].responseArray[Math.floor(Math.random() * Math.floor(commands[j].responseArray.length))])
                return
              }
            }
          }
          if (!commandFound) {
            if (transcript.toLowerCase() == triggers[i]) {

            } else if (chatBotEnabled) {
              chatbot(transcript.toLowerCase().substring(triggers[i].length).trim())
            } else {
              readOutLoud("I am sorry, I do not recognize that command.")
            }
            return
          }
        }
      }
      if (chatBotEnabled) {
        addtoConversation(transcript);
        chatbot(transcript)
        return
      }
    }
    recognition.start()
  }
  recognition.abort()
};

recognition.onerror = function (event) {
  if (event.error == 'no-speech') {
    nospeecherror = true
  }
  if (event.error !== 'aborted') {
    console.log(event.error)
  }
}

/*-----------------------------
      Speech Synthesis 
------------------------------*/
function readOutLoud(message) {
  addtoConversation(message, true)
  var speech = new SpeechSynthesisUtterance();
  speech.voice = getVoiceFromName("Google US English")
  speech.text = message;
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
  function _wait() {
    if (!window.speechSynthesis.speaking) {
      recognition.start()
      return;
    }
    window.setTimeout(_wait, 200);
  }
  _wait();
}

var voices;
speechSynthesis.onvoiceschanged = function () {
  voices = speechSynthesis.getVoices();
};

function getVoiceFromName(name) {
  var foundVoice = null;
  voices.forEach(function (voice, index) {
    if (voice.name === name) {
      foundVoice = voice;
    }
  });
  return foundVoice;
}