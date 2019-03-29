# E.V.A. 
## (Eric's Virtual Assistant)

### Voice Recognition
* Talk to E.V.A. and she will listen and decipher what you are saying
### Voice Synthesis
* E.V.A. responds back with a synthesized voice
### Command and Trigger learning
* E.V.A. can learn new trigger phrases, commands and responses all without touching the code. 
* Just tell her you want to add a command or trigger
### Chatbot
* E.V.A. can utilize a dialogFlow agent setup to be a bit of a chatbot.  Some Easter eggs and jokes added in as well.
* E.V.A. listens for 'eva' commands first, and then if chatbot is on, refers to dialogFlow.
* When the chatbot is enabled, the 'eva' trigger is only needed to trigger eva commands.
### Giphy
* E.V.A. has a giphy integration and displays a personable giphy face
* E.V.A. can respond by showing gif's
* She can also change her appearance upon request.
### Youtube
* Watch any video on youtube just by asking
* E.V.A. can search and embed the youtube video right into her (inter)face.
* She can also close the video upon request.
### Conversation and Command Responses:
* E.V.A. has pre-programmed(but can still be dynamic) responses, as does the chatbot integration.
* The path from your input to the chatbots response is AI assisted with dialogFlow natural language processing technologies
* Responses can be single responses to a phrase, or a random selection of many available responses. 
* Procedural tasks can take in a series of responses and functions to complete one after another
### Commands:
* 'eva are you listening'
* 'eva can you hear me'
* 'hi eva add trigger'
* 'hello eva add simple command'
* 'eva toggle chatbot'
* 'hey eva show me a telescope'
* 'eva can you dance'
* 'hi eva change your face'
* 'eva show me a video of a monkey'
* 'eva exit youtube'


## Install
* git clone https://github.com/ericpelland/E.V.A./
* cd E.V.A./
* npm install
* set environment variable to dialogFlow credentials json file
* Update Youtube api key
* import EVA.zip to dialogFlow agent, and adjust the project-id as needed.
* node index.js
