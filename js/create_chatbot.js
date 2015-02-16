"use strict";
var reader;
var lines;
var textFile = null;

var convos;

//initialize
var object = {
  markov_word : new Object(),
  start_of_reply : [],
  brainQuality : []
}
var my_object;
for (var i = 0; i < 7; i++) { 
  object.start_of_reply[i] = new Object();
}


function bot(first_two_words,prev_message_num) {
  this.first_two_words = first_two_words;
  this.prev_message_num = prev_message_num;
}

function makeTextFile(text) {
  var textjson = JSON.stringify(text);
  var data = new Blob([textjson], {type: 'text/plain'});

  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  // returns a URL you can use as a href
  return textFile;
};

function abortRead() {
  reader.abort();
}

function errorHandler(evt) {
  switch(evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
      alert('File Not Found!');
      break;
    case evt.target.error.NOT_READABLE_ERR:
      alert('File is not readable');
      break;
    case evt.target.error.ABORT_ERR:
      break; // noop
    default:
      alert('An error occurred reading this file.');
  };
}

function updateProgress(evt) {
  // evt is an ProgressEvent.
  if (evt.lengthComputable) {
    var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
    // Increase the progress bar length.
    if (percentLoaded < 100) {
      $('.progress-bar').css('width', percentLoaded + '%').attr('aria-valuenow', percentLoaded);
    }
  }
}

function handleFileSelect(evt) {
  var file_to_read = evt.target.files[0];
  reader = new FileReader();
  reader.onerror = errorHandler;
  reader.onprogress = updateProgress;
  reader.onabort = function(e) {
    alert('File read cancelled');
  };
  reader.onloadstart = function(e) {
    $('.progress-bar').addClass('loading');
  };
  reader.onload = function(e) {
    if (file_to_read.name === 'Chat.mbox') {
      lines = this.result.split('\n');
      getEmailAddresses(lines);
    } else if (file_to_read.name === 'Hangouts.json') {
      var file_object = JSON.parse(this.result);
      getConversations(file_object);
    }
  }
  reader.onloadend = function(e) {
    $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100);
    $('.progress-bar').append("DONE!");
    setTimeout("$('.progress-bar').removeClass('loading');", 400);
    setTimeout("$('.step1').remove(); $('h1').text('Choose which conversation you want to use to train your bot.');", 600);
  }

  // Read in the file as text lines.
  if (file_to_read.name === 'Chat.mbox') {
    reader.readAsText(file_to_read);
  } else if (file_to_read.name === 'Hangouts.json') {
    reader.readAsText(file_to_read);
  } else {
    alert("File must be Chat.mbox or Hangouts.json not " + file_to_read.name);
  }
}

function getEmailAddresses(lines) {
  var from_emails = new Object();
  var to_emails = new Object();
  for(var line = 0; line < lines.length; line++){
    if (lines[line].match(/From:/)) {
      var from_line = lines[line].split(/\s+/);
      var from_test = from_line.shift();
      if (from_test !== "From:") 
        continue;
      var email = from_line.pop();
      var person = from_line.join(" ");
      if (typeof(from_emails[email]) === "undefined")
        from_emails[email] = person;
    } else if (/To:/) {
      var to_line = lines[line].split(/\s+/);
      var to_test = to_line.shift();
      if (to_test !== "To:") 
        continue;
      var email = to_line.pop();
      var person = to_line.join(" ");
      if (typeof(to_emails[email]) === "undefined")
        to_emails[email] = person;
    } 
  } 
  $(".from_emails").append('<p> All "From" emails. Choose which ones for your chatbot</p>');
  $(".to_emails").append('<p style="text-align:left"> Names</p>');
  Object.keys(from_emails).sort().forEach(function(key) {
    var eml = key.replace("<","");
    eml = eml.replace(">","");
    $(".from_emails").append('<input type="checkbox" name="femail" value="' + key + '"> ' + eml + ' <br>');
    $(".to_emails").append('<li style="text-align:left"> name ' + from_emails[key] + ' </li>');
  });
  $(".choose_emails").append('<input id="froms" type="button" value="Choose emails">');
  document.getElementById('froms').addEventListener('click', handleFromSelect, false);

}

function handleFromSelect(evt) {
  var chosen_from = [];
  $.each($("input[name='femail']:checked"), function(){            
    chosen_from.push($(this).val());
  });
  var conf = confirm('You have chosen to make a chatbot of you speaking to ' + chosen_from);
  if (conf) {
    setTimeout("$('.step2').remove(); $('h1').text('Your Chatbot is being synthesized!!!');", 200);
    setTimeout(function () {readNcreateChatbot(chosen_from);},300);
    setTimeout("$('h1').text('');", 4000);
  } else {
  }
}
function readNcreateChatbot (chosen_email_addresses) {
  var mail_info = parseEmails(chosen_email_addresses);
  lines = [];
  var qual = testQuality(mail_info.persons);
  var endquality = [average(qual[0]),average(qual[1]),average(qual[2]),average(qual[3]),average(qual[4]),average(qual[5]),average(qual[6])];
  var endq_ind = [];
  for (var ii = 0; ii < endquality.length;ii++) {
    endq_ind.push(ii);
  }
  object.brainQuality = endq_ind.sort(function(a,b){return endquality[a]-endquality[b]});
  console.log("brainQuality " + object.brainQuality);
  bakeChatbot(mail_info.bots,mail_info.persons);
  $(".download").append('<input id="createlink" type="button" value="Download chatbot brains">');

 document.getElementById('createlink').addEventListener('click', function (evt) {
    var json_url = makeTextFile(object);
    if (json_url !== undefined) {
      $(".download").append('<a download="object.json" id="downloadlink" href="' + json_url + '">object.json</a>'); 
    }
  }, false);
  $(".chatbot").append('<div class="form-group"><textarea class="form-control status-box" rows="2" placeholder="Press enter to send your message."></textarea></div>'); 
}

function parseEmails (f) {
  var one_mail = [];
  var bot_words = [];
  var person_words = [];
  var mail_objects = {
    bots: [],
    persons: []
  };
  for (var ii = 0; ii < lines.length; ii ++) {
    var ln = lines[ii];
    if (ln.match(/\@xxx/)) {
      if (one_mail.length === 0) {
        one_mail.push(ln);
        continue;
      } else {
        // This section is where an individual email is parsed and added to markov brain
        var from_switch = 0;
        var to_switch = 0;
        var multipart_switch = 0;
        for (var jj = 0; jj < one_mail.length; jj++) {
          var line2 = one_mail[jj];
          if (line2.match(/Content-Type: multipart/)) { // check if this is a multipart message
            multipart_switch = 1;
          } else if (line2.match(/X-Gmail-Labels/)) {  // make sure this is a chat message
            var chat_label_test = line2.split(/\s+/);
            if (chat_label_test[1] !== 'Chat')
              break;
          } else if (line2.match(/From:/)) {
            var from_line = line2.split(/\s+/);
            var from_test = from_line.shift();
            if (from_test !== "From:")
              continue;
            var email_address = from_line.pop();
            for (var kk in f) {
              if (email_address === f[kk]) 
                from_switch = 1;
            }
          } else if (line2.match(/To:/)) {
            var to_line = line2.split(/\s+/);
            var to_test = to_line.shift();
            if (to_test !== "To:")
              continue;
            var email_address = to_line.pop();
            for (var kk in f) {
              if (email_address === f[kk]) 
                to_switch = 1;
            }
          } else if (line2.match(/Content-Type: text/)) { 
            // The header has been parsed, so we can simply read the mail body, which is three lines after this one
            // as long as relevant switches have been turned on of course.
            if ( (from_switch === 0) && (to_switch === 0) )
              break;
            if (multipart_switch === 0) {
              var mail_body = one_mail[jj+3];
              var mail_words = mail_body.split(/\s+/); // get mail body, three lines after content-type line
              mail_words = cleanWords(mail_words);
              if (to_switch === 1) {
                // use this message to train the speaking part of the brain
//                for (var kk = 0; kk < mail_words.length; kk++) {
//                  bot_words.push(mail_words[kk]);
//                }
                if (mail_words.length < 2) 
                  break;
                mail_words.push('endend'); //mark end of message
                // Hold on two first two words, as they'll be used to start messages for the chatbot
                // link these first two words to previous message from the person using the bot object
                var first_two_words = mail_words[0] + " " + mail_words[1];
                mail_objects.bots[mail_objects.bots.length] = new bot(first_two_words,mail_objects.persons.length-1);

                // Train the markov chain so the bot can speak. 
                for (var kk = 0; kk < mail_words.length - 2; kk++) {
                  var two_words = mail_words[kk] + " " + mail_words[kk+1];
                  if (object.markov_word[two_words] === undefined) 
                    object.markov_word[two_words] = [];
                  object.markov_word[two_words].push(mail_words[kk+2]);
                }
              } else if (from_switch === 1) {
                // use this message to train the listening part of the brain
                // The beginning of the next "to" messages will be linked to the key generated from this message
                // so that the brain knows how to respond to messages like this in the future.
                //
                mail_objects.persons[mail_objects.persons.length] = getBrains(mail_words);
              }
            }
            break;
          }
        }
        one_mail = [];
        one_mail.push(ln);
      }
    } else {
      one_mail.push(ln);
    }
  }
//  console.log(object.markov_word);
  return mail_objects;
}

function testQuality (pm) {
  var shuffled = shuffle(pm);
  var quarter = parseInt(shuffled.length/4);
  var q = [];

    for (var brn = 0; brn < 7; brn++)
      q[brn]= 0;
    var kk = quarter;
    while (kk--) {
      var thisMail = shuffled[kk];
      for (var brn = 0; brn < 7; brn++) {
        var found = 0;
        var jj = shuffled.length;
        while(jj-- > quarter) {
          if (thisMail[brn] === shuffled[jj][brn]) {
            found = 1;
            break;
          }
        }
        q[brn] += found;
      }
    }
    for (var brn = 0; brn < 7; brn++)
      q[brn] /= quarter;
  console.log(q);
  return q;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function bakeChatbot (bm,pm) {
  for (var ii = 1; ii < bm.length; ii++) {
    var pm_number = bm[ii].prev_message_num;
    if (pm_number === undefined) {
      console.log(ii);
      continue;
    }
    for (var j = 0; j < 7; j ++) {
      var last_person_words = pm[pm_number][j];
      if (object.start_of_reply[j][last_person_words] === undefined)
        object.start_of_reply[j][last_person_words] = [];
      object.start_of_reply[j][last_person_words].push(bm[ii].first_two_words);
    }
  }
}

function cleanWords (mw) {
  // change html tags to real charachters and change to lower case
  var cleaned = [];
  for (var ii = 0; ii < mw.length; ii++) {
    var word = mw[ii];
    word = word.replace(/\&\#39\;/g,"\'");
    word = word.replace(/\&quot\;/g,"\"");
    word = word.replace(/\&lt\;/g,"<");
    word = word.replace(/\&gt\;/g,">");
    word = word.replace(/([?!.,'"])(?=\1)/g,""); // Make sure there's only one punctuation mark
    word = word.replace(/<a.+<\/a>/,"#link");
    word = word.replace(/href.+<\/a>/,"#link");
    word = word.toLowerCase();
    word = word.replace(/=..=..=..=../g,"#emoji");
    word = word.replace(/=c2=a0/g,"");
    cleaned.push(word);
  }
  return cleaned;
}
function rinseWords (mw) {
  // remove all punctutation
  var cleaned = [];
  for (var ii = 0; ii < mw.length; ii++) {
    var word = mw[ii];
    word = word.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // Remove all punctuation 
    cleaned.push(word);
  }
  return cleaned;
}
function scrubWords (mw) {
  // remove all stopwords
  var cleaned = [];
  for (var ii = 0; ii < mw.length; ii++) {
    var word = mw[ii];
    var is_stopword = 0;
    for (var jj = 0; jj < stopwords.length; jj++) {
      if (stopwords[jj] === word) 
        is_stopword = 1;
    }
    if (is_stopword === 0)
      cleaned.push(word);
  }
  return cleaned;
}

function average (arr) {
  if (arr.length === 0) 
    return 0;
  var sum = 0;
  for (var ii = 0; ii < arr.length; ii++) {
    //sum += parseInt( arr[ii], 10 );
    sum += arr[ii];
  }
  var av = sum / arr.length;
  return av;
}

function getBrains(wrds) {
  var last_person_words;
  var firstlast_person_words;
  var firmidlas_person_words;
  var last_nopunct_words;
  var firstlast_nopunct_words;
  var last_nostop_words;
  var firstlast_nostop_words;
  // basic brains
  if (wrds.length > 1) {
    last_person_words = wrds[wrds.length-2] + " " + wrds[wrds.length-1];
    firstlast_person_words = wrds[0] + " " + wrds[wrds.length-1];
  } else {
    last_person_words = wrds[wrds.length-1];
    firstlast_person_words = wrds[wrds.length-1];
  }
  // three word brain
  if (wrds.length > 2) {
    var middle = Math.floor(wrds.length/2);
    firmidlas_person_words = wrds[0] + " " + wrds[middle] + " " + wrds[wrds.length-1];
  } else {
    firmidlas_person_words = firstlast_person_words;
  }
  // no punctuation brain
  var nopunct_words = scrubWords(wrds);
  if (nopunct_words.length > 1) {
    last_nopunct_words = nopunct_words[nopunct_words.length-2] + " " + nopunct_words[nopunct_words.length-1];
    firstlast_nopunct_words = nopunct_words[0] + " " + nopunct_words[nopunct_words.length-1];
  } else {
    last_nopunct_words = nopunct_words[nopunct_words.length-1];
    firstlast_nopunct_words = nopunct_words[nopunct_words.length-1];
  }
  // no stopwords brain
  var nostop_words = rinseWords(wrds);
  if (nostop_words.length > 1) {
    last_nostop_words = nostop_words[nostop_words.length-2] + " " + nostop_words[nostop_words.length-1];
    firstlast_nostop_words = nostop_words[0] + " " + nostop_words[nostop_words.length-1];
  } else {
    last_nostop_words = nostop_words[nostop_words.length-1];
    firstlast_nostop_words = nostop_words[nostop_words.length-1];
  } 
  return [last_person_words,firstlast_person_words,firmidlas_person_words,last_nopunct_words,firstlast_nopunct_words,last_nostop_words,firstlast_nostop_words];
}

function getConversations(jsn) {
  var names = [];
  var gaias = [];
  var num_messages = [];
  var peeps = new Object;
  var conversations = jsn.conversation_state;
  for (var xx = 0; xx < conversations.length;xx++) {
    //console.log(conversations[xx]);
    var chat_people = conversations[xx].conversation_state.conversation.participant_data;
//    console.log("Converstation " + xx);
    for (var pp = 0; pp < chat_people.length;pp++ ) {
      var gaia = chat_people[pp].id.gaia_id;
      if (chat_people[pp].fallback_name !== undefined) {
//        console.log(chat_people[pp].fallback_name);
        peeps[gaia] = chat_people[pp].fallback_name;
      } 
    }
  }
  for (var xx = 0; xx < conversations.length;xx++) {
    var chat_data = conversations[xx].conversation_state.event;
    var chat_people = conversations[xx].conversation_state.conversation.participant_data;
    names[xx] = [];
    gaias[xx] = [];
    num_messages[xx] = chat_data.length;
    for (var pp = 0; pp < chat_people.length;pp++ ) {
      var gaia = chat_people[pp].id.gaia_id;
      gaias[xx].push(gaia);
      if (peeps[gaia] !== undefined) {
        names[xx].push(peeps[gaia]);
      } else {
        names[xx].push("UNDEFINED");
      }
    }
  }

  var ind = [];
  for (var ii = 0; ii < names.length;ii++) {
    ind.push(ii);
  }
  var sort_ind = ind.sort(function(a,b){return num_messages[b]-num_messages[a]});

  $(".from_emails").append('<p> Conversations with more messages will work better.</p>');
  //$(".to_emails").append('<p style="text-align:left"> Names</p>');
  for (var ii = 0; ii < names.length;ii++) {
    var xx = sort_ind[ii];
    var addresses = names[xx].join(" ");
    $(".from_emails").append('<input type="checkbox" name="femail" value="' + xx + '"> ' + addresses + ' - total messages: ' + num_messages[xx] + '<br>');
    //$(".to_emails").append('<li style="text-align:left"> name ' + from_emails[key] + ' </li>');
  }
  $(".choose_emails").append('<input id="froms" type="button" value="Choose conversations">');
  document.getElementById('froms').addEventListener('click', function () {handleConvoSelect(gaias,peeps,jsn)}, false);

  //return convo;
}

function handleConvoSelect(gs,pps,jsn) {
  var chosen_convo = [];
  $.each($("input[name='femail']:checked"), function(){
    var convo_id = $(this).val();
    convo_id = Number(convo_id);
    chosen_convo.push(convo_id);
  });
  var chosen_gaias = new Object;
  //$(".to_emails").append('<p> Who is being turned into a bot?</p>');
  for (var xx = 0; xx < chosen_convo.length;xx++) {
    var gaias_inthis = gs[chosen_convo[xx]];
    for (var yy = 0; yy < gaias_inthis.length;yy++) {
      if (chosen_gaias[gaias_inthis[yy]] !== 1) {
        chosen_gaias[gaias_inthis[yy]] = 1;
        $(".to_emails").append('<input type="radio" name="temail" value="' + gaias_inthis[yy] + '"> ' + pps[gaias_inthis[yy]] + '<br>');
      }
    }
    //$(".to_emails").append('<li style="text-align:left"> name ' + from_emails[key] + ' </li>');
  }
  $(".to_emails").append('<input id="who" type="button" value="Choose a person">');
  setTimeout("$('.step2').remove(); $('h1').text('Now choose who the bot will speak like.');", 200);
  var final_gaias = Object.keys(chosen_gaias);
  document.getElementById('who').addEventListener('click', function () {handlePersonSelect(final_gaias,pps,chosen_convo,jsn)}, false);
}

function handlePersonSelect(fnl_gs,pps,chosen_convo,jsn) {
  var chosen_you = ($("input[name='temail']:checked")).val();
  if (chosen_you === undefined)
    return 0;
  var splice_index;
  for (var xx = 0; xx < fnl_gs.length;xx++) {
    if (chosen_you === fnl_gs[xx]) 
      splice_index = xx;
  }
  fnl_gs.splice(splice_index,1);
  var chosen_names = [];
  for (var ii = 0; ii < fnl_gs.length;ii++) {
    chosen_names.push(pps[fnl_gs[ii]]);
  }
  var chosen = chosen_names.join(" and ");
  var conf = confirm('You have chosen to make a chatbot of ' + pps[chosen_you] + ' speaking to ' + chosen);
  if (conf) {
    setTimeout("$('.step3').remove(); $('h1').text('Your Chatbot is being synthesized!!!');", 200);
    setTimeout(function () {json2createChatbot(chosen_you,chosen_convo,jsn);},300);
    setTimeout("$('h1').text('Test how the chatbot works, and download the brains to use later in the Chat window.');", 4000);
  } else {
  }
}
function json2createChatbot (chosen_you,chosen_convo,jsn) {
  var mail_info = parseJson(chosen_you,chosen_convo,jsn);
  lines = [];
  var qual = testQuality(mail_info.persons);
  var q_ind = [];
  for (var ii = 0; ii < qual.length;ii++) {
    q_ind.push(ii);
  }
  object.brainQuality = q_ind.sort(function(a,b){return qual[a]-qual[b]});
  console.log("brainQuality " + object.brainQuality);
  bakeChatbot(mail_info.bots,mail_info.persons);
  $(".download").append('<input id="createlink" type="button" value="Download chatbot brains">');

 document.getElementById('createlink').addEventListener('click', function (evt) {
    var json_url = makeTextFile(object);
    if (json_url !== undefined) {
      $(".download").append('<a download="chatbot_brains.json" id="downloadlink" href="' + json_url + '">Link to dowload chatbot_brains.json</a>'); 
    }
  }, false);
  $(".chatbot").append('<div class="form-group"><textarea class="form-control status-box" rows="2" placeholder="Press enter to send your message."></textarea></div>'); 
}

function parseJson (chosen_you,chosen_convo,jsn) {
  var one_mail = [];
  var bot_words = [];
  var person_words = [];
  var mail_objects = {
    bots: [],
    persons: []
  };

  var conversations = jsn.conversation_state;
  //for (var xx = 0; xx < conversations.length;xx++) {
  //  if (xx !== chosen_convo[0]) 
  //    continue;
  //debugger;
  for (var ii = 0; ii < chosen_convo.length;ii++) {
    var xx = chosen_convo[ii];
    var chat_data = conversations[xx].conversation_state.event;

    for (var yy = 0; yy < chat_data.length; yy++) {
      //console.log(chat_data[yy].chat_message);
      //var timeStamp = Number(chat_data[yy].timestamp);
      //timeStamp /= 1000; // convert to milliseconds
      //var time = new Date(timeStamp);
      var sender = chat_data[yy].sender_id.gaia_id;
      var mess;
      if (chat_data[yy].chat_message !== undefined)
        mess = chat_data[yy].chat_message.message_content.segment;
      if (mess !== undefined) {
        for (var zz = 0; zz < mess.length; zz++) {
     //     console.log(mess[zz].text);
          var txt = mess[zz].text;
          if (txt !== undefined) {
          var mail_words = mess[zz].text.split(/\s+/);
          mail_words = cleanWords(mail_words);
          if (sender === chosen_you) {
            // use this message to train the speaking part of the brain
//                for (var kk = 0; kk < mail_words.length; kk++) {
//                  bot_words.push(mail_words[kk]);
//                }
            if (mail_words.length < 2) 
              break;
            mail_words.push('endend'); //mark end of message
            // Hold on two first two words, as they'll be used to start messages for the chatbot
            // link these first two words to previous message from the person using the bot object
            var first_two_words = mail_words[0] + " " + mail_words[1];
            mail_objects.bots[mail_objects.bots.length] = new bot(first_two_words,mail_objects.persons.length-1);

            // Train the markov chain so the bot can speak. 
            for (var kk = 0; kk < mail_words.length - 2; kk++) {
              var two_words = mail_words[kk] + " " + mail_words[kk+1];
              if (object.markov_word[two_words] === undefined) 
                object.markov_word[two_words] = [];
              object.markov_word[two_words].push(mail_words[kk+2]);
            }
          } else {
            // use this message to train the listening part of the brain
            // The beginning of the next "to" messages will be linked to the key generated from this message
            // so that the brain knows how to respond to messages like this in the future.
            //
            mail_objects.persons[mail_objects.persons.length] = getBrains(mail_words);
          }
          }
        }
      }
    }
  }
//  console.log(object.markov_word);
  return mail_objects;
}



document.getElementById('files').addEventListener('change', handleFileSelect, false);
