//
// run this in the directory of the extracted agent export.
// remove all languages except en
// remove default response files
//

var results = {};

console.log("Starting")
var fs = require('fs');
var path = require('path');
var baseDir = "./"
fs.writeFileSync('./output/output.json', "");
results = [];
try {
    var files = fs.readdirSync(baseDir);
    files.forEach((file, index) => {
        if (file.indexOf(".DS_Store") < 0 && file.indexOf("output") < 0 && file.indexOf("index.js") < 0 && file.indexOf("usersays") < 0) {
            obj = {
                inputs: [],
                responseArray: []
            }
            var fromPath = path.join(baseDir, file);
            var name = file.substring(0, file.length - 5)
            console.log(name)
            //RESPONSES
            try {
                var stat = fs.statSync(fromPath);
                if (stat.isFile()) {
                    var contents = fs.readFileSync(file, 'utf8');
                    if (contents) {
                        contents = JSON.parse(contents)

                        for (var i = 0; i < contents.responses.length; i++) {
                            for (var j = 0; j < contents.responses[i].messages.length; j++) {
                                if (contents.responses[i].messages[j].speech) {
                                    for (var k = 0; k < contents.responses[i].messages[j].speech.length; k++) {
                                        if (obj.responseArray.indexOf(contents.responses[i].messages[j].speech[k]) == -1) {
                                            obj.responseArray.push(contents.responses[i].messages[j].speech[k])
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Could not stat the file.", err);
            }

            //INPUTS

            try {
                var usersaysStat = fs.statSync(name + '_usersays_en.json');
                if (usersaysStat.isFile()) {
                    var usersaysContents = fs.readFileSync(name + '_usersays_en.json', 'utf8');
                    if (usersaysContents) {
                        usersaysContents = JSON.parse(usersaysContents)

                        for (var i = 0; i < usersaysContents.length; i++) {
                            var text = "";
                            for (var j = 0; j < usersaysContents[i].data.length; j++) {
                                text += usersaysContents[i].data[j].text
                            }
                            obj.inputs.push(text)
                        }
                    }
                }
            } catch (err) {
                console.error("Could not stat the file.", err);
            }

            if (obj.responseArray.length > 0 && obj.inputs.length > 0) {
                results.push(obj)
            }
        }

    });
    fs.appendFileSync('./output/output.json', JSON.stringify(results));
} catch (err) {
    console.error("Could not list the directory.", err);
}