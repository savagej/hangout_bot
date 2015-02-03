'use strict';
var reader;
var lines;
console.log('loaded');

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
  //console.log(from_emails);
  $(".from_emails").append('<p> All "From" emails. Choose which ones for your chatbot');
  Object.keys(from_emails).forEach(function(key) {
    //console.log(from_emails[key]);
    var eml = key.replace("<","&lt;");
    eml = eml.replace(">","&gt;");
    $(".from_emails").append('<input type="checkbox" name="femail" value="' + key + '"> ' + eml + '&nbsp;&nbsp;&nbsp;&nbsp;- name ' + from_emails[key] + ' <br>');
  });

  $(".to_emails").append('<p> All "To" emails. Choose which ones for your chatbot');
  Object.keys(to_emails).forEach(function(key) {
    //console.log(to_emails[key]);
    var eml = key.replace("<","&lt;");
    eml = eml.replace(">","&gt;");
    $(".to_emails").append('<input type="checkbox" name="temail" value="' + key + '"> ' + eml + '&nbsp;&nbsp;&nbsp;&nbsp;- name ' + to_emails[key] + ' <br>');
  });
  $(".choose_emails").append('<input id="tos" type="button" value="Choose emails">');
  document.getElementById('tos').addEventListener('click', handleToSelect, false);

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
  var conf = confirm('You have chosen to make a chatbot of ' + chosen_from + ' speaking to ' + chosen_to);
  if (conf) {
    $('.chatbot').css('opacity', '100');
    parseEmails(chosen_from,chosen_to);
  } else {
  }
}
  var markov_word = new Object();
  var start_of_reply = new Object();

function parseEmails (f,t) {
  var one_mail = [];
  var bot_words = [];
  var person_words = [];
  var last_person_words;
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
            for (kk in f) {
              if (email_address === f[kk]) 
                from_switch = 1;
            }
          } else if (line2.match(/To:/)) {
            var to_line = line2.split(/\s+/);
            var to_test = to_line.shift();
            if (to_test !== "To:")
              continue;
            var email_address = to_line.pop();
            for (kk in f) {
              if (email_address === f[kk]) 
                to_switch = 1;
            }
          } else if (line2.match(/Content-Type: text/)) { 
            // The header has been parsed, so we can simply read the mail body, which is three lines after this one
            // as long as relevant switches have been turned on of course.
            if ( (from_switch === 0) && (to_switch === 0) )
              break;
            if (multipart_switch === 0) {
              var mail_words = one_mail[jj+3].split(/\s+/); // get mail body, three lines after content-type line
              //mail_words = clean_words(mail_words);
              if (to_switch === 1) {
                // use this message to train the speaking part of the brain
//                for (var kk = 0; kk < mail_words.length; kk++) {
//                  bot_words.push(mail_words[kk]);
//                }
                mail_words.push('ENDEND'); //mark end of message
                if (last_person_words === undefined) 
                  break;
                // first train brain how to reply to the previous message
                if (start_of_reply[last_person_words] === undefined)
                  start_of_reply[last_person_words] = [];
                var first_two_words = mail_words[0] + " " + mail_words[1];
                start_of_reply[last_person_words].push(first_two_words);
                // 
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
                if (mail_words.length > 1) {
                  last_person_words = mail_words[mail_words.length-2] + " " + mail_words[mail_words.length-1];
                } else {
                  last_person_words = mail_words[mail_words.length-1];
                }
//                for (var kk = 0; kk < mail_words.length; kk++) {
//                  person_words.push(mail_words[kk]);
//                }
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
  console.log(markov_word);
}


document.getElementById('files').addEventListener('change', handleFileSelect, false);
