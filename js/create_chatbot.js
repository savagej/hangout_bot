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
    getEmails(lines);
  }
  reader.onloadend = function(e) {
    $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100);
    $('.progress-bar').append("DONE!");
    setTimeout("$('.progress-bar').removeClass('loading');", 2000);
  }

  // Read in the image file as a binary string.
  reader.readAsText(evt.target.files[0]);
}
function getEmails(lines) {
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
  console.log(from_emails);
  $(".from_emails").append('<p> All "From" emails. Choose which ones for your chatbot');
  Object.keys(from_emails).forEach(function(key) {
    console.log(from_emails[key]);
    var eml = key.replace("<","&lt;");
    eml = eml.replace(">","&gt;");
    $(".from_emails").append('<input type="checkbox" name="femail" value="' + key + '"> ' + eml + '&nbsp;&nbsp;&nbsp;&nbsp;- name ' + from_emails[key] + ' <br>');
  });

  $(".to_emails").append('<p> All "To" emails. Choose which ones for your chatbot');
  Object.keys(to_emails).forEach(function(key) {
    console.log(to_emails[key]);
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
    makeChatbot(chosen_from,chosen_to);
  } else {
  }
}

function makeChatbot (f,t) {
  console.log('fuck off' + f);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
