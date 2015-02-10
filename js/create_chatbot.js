"use strict";
var reader;
var lines;
console.log('loaded');

//initialize
var markov_word = new Object();
var start_of_reply = [];
for (var i = 0; i < 7; i++) { 
  start_of_reply[i] = new Object();
}

var botMails = [];
var personMails = [];

function bot(first_two_words,prev_message_num) {
  this.first_two_words = first_two_words;
  this.prev_message_num = prev_message_num;
}
var brainQuality;

//function person(brain1,brain2,brain3,brain4,brain5,brain6,brain7) {
//  this.brain1 = brain1;
//  this.brain2 = brain2;
//  this.brain3 = brain3;
//  this.brain4 = brain4;
//  this.brain5 = brain5;
//  this.brain6 = brain6;
//  this.brain7 = brain7;
//}

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
  // Reset progress indicator on new file selection.
  //progress.style.width = '0%';
  //progress.textContent = '0%';

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
    lines = this.result.split('\n');
    getEmailAddresses(lines);
  }
  reader.onloadend = function(e) {
    $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100);
    $('.progress-bar').append("DONE!");
    setTimeout("$('.progress-bar').removeClass('loading');", 2000);
  }

  // Read in the image file as a binary string.
  reader.readAsText(evt.target.files[0]);
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
  document.getElementById('froms').addEventListener('click', handleToSelect, false);

}

function handleToSelect(evt) {
  var chosen_from = [];
  var chosen_to = [];
  $.each($("input[name='temail']:checked"), function(){            
    chosen_to.push($(this).val());
  });
  $.each($("input[name='femail']:checked"), function(){            
    chosen_from.push($(this).val());
  });
  var conf = confirm('You have chosen to make a chatbot of you speaking to ' + chosen_from);
  if (conf) {
    parseEmails(chosen_from);
    lines = [];
    var qual = testQuality(personMails);
    var endquality = [average(qual[0]),average(qual[1]),average(qual[2]),average(qual[3]),average(qual[4]),average(qual[5]),average(qual[6])];
    var endq_ind = [];
    for (var ii = 0; ii < endquality.length;ii++) {
      endq_ind.push(ii);
    }
    brainQuality = endq_ind.sort(function(a,b){return endquality[a]-endquality[b]});
    console.log("brainQuality " + brainQuality);
    bakeChatbot(botMails,personMails);
    $(".chatbot").append('<div class="form-group"><textarea class="form-control status-box" rows="2" placeholder="Press enter to send your message."></textarea></div>');
  } else {
  }
}
function parseEmails (f) {
  var one_mail = [];
  var bot_words = [];
  var person_words = [];
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
                // first train brain how to reply to the previous message
                //if (start_of_reply[last_person_words] === undefined)
                //  start_of_reply[last_person_words] = [];
                var first_two_words = mail_words[0] + " " + mail_words[1];
                //start_of_reply[last_person_words].push(first_two_words);
                botMails[botMails.length] = new bot(first_two_words,personMails.length-1);
                 
                for (var kk = 0; kk < mail_words.length - 2; kk++) {
                  var two_words = mail_words[kk] + " " + mail_words[kk+1];
                  if (markov_word[two_words] === undefined) 
                    markov_word[two_words] = [];
                  markov_word[two_words].push(mail_words[kk+2]);
                }
              } else if (from_switch === 1) {
                // use this message to train the listening part of the brain
                // The beginning of the next "to" messages will be linked to the key generated from this message
                // so that the brain knows how to respond to messages like this in the future.
                //
                personMails[personMails.length] = getBrains(mail_words);
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
//  console.log(markov_word);
}

function testQuality (pm) {
  var quarter = pm.length/4;
  var q = [ [], [], [], [], [], [], [] ];

  for (var ii = 0; ii < 4; ii++) {
    for (var brn = 0; brn < 7; brn++) {
      q[brn][ii] = 0;
    }
    var slice = pm.slice(ii*quarter,(ii+1)*quarter);
    for (var jj = 0; jj < pm.length; jj++) {
      if ( (jj >=ii*quarter) && (jj <= (ii+1)*quarter) )
        continue;
      var found = [ 0, 0, 0, 0, 0, 0, 0 ];
      for (var kk = 0; kk < slice.length; kk++ ) {
        if (pm[jj][0] === slice[kk][0])
          found[0] = 1;
        if (pm[jj][1] === slice[kk][1])
          found[1] = 1;
        if (pm[jj][2] === slice[kk][2])
          found[2] = 1;
        if (pm[jj][3] === slice[kk][3])
          found[3] = 1;
        if (pm[jj][4] === slice[kk][4])
          found[4] = 1;
        if (pm[jj][5] === slice[kk][5])
          found[5] = 1;
        if (pm[jj][6] === slice[kk][6])
          found[6] = 1;
      }
      q[0][ii] += found[0];
      q[1][ii] += found[1];
      q[2][ii] += found[2];
      q[3][ii] += found[3];
      q[4][ii] += found[4];
      q[5][ii] += found[5];
      q[6][ii] += found[6];
    }
    q[0][ii] /= slice.length;
    q[1][ii] /= slice.length;
    q[2][ii] /= slice.length;
    q[3][ii] /= slice.length;
    q[4][ii] /= slice.length;
    q[5][ii] /= slice.length;
    q[6][ii] /= slice.length;
  }
  return q;
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
      if (start_of_reply[j][last_person_words] === undefined)
        start_of_reply[j][last_person_words] = [];
      start_of_reply[j][last_person_words].push(bm[ii].first_two_words);
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


document.getElementById('files').addEventListener('change', handleFileSelect, false);
