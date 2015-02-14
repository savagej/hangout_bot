"use strict";
var jsonReader;
var object = {
  markov_word : new Object(),
  start_of_reply : [],
  brainQuality : []
}

var maxLengthOfMessage = 20;

var run_markov = function (inputText) {
  inputText = inputText.toLowerCase();
//  console.log("inputText " + inputText);
  var input_array = inputText.split(/\s+/);
  var counter = input_array.length - 2;
  var exist_test = 0;
  var information = getBrains(input_array);
  var first_key_array = [];
  // Find the possible replies to this inputText in the form of start_of_reply array
  if (counter === -2) {
     console.log("warning, inputText should not be empty");
  //} else if (counter === -1) {
  //  last_word = input_array[0];
  //  if (typeof start_of_reply[last_word] !== 'undefined') 
  //    exist_test = 1;
  } else {
    for (var ii = 0; ii < information.length; ii++) {
      var ind = object.brainQuality[ii];
      if (object.start_of_reply[ind][information[ind]] !== undefined) {
        exist_test = 1;
        first_key_array = object.start_of_reply[ind][information[ind]];
        console.log("Brain number " + ind + " used, " + ii + "th best one");
        break;
      }
    }
  }
//  console.log("last word " + last_word);
  var first_key;
  // If something like this inputText has been seen before, choose response,
  // else choose the beginning of a random phrase
  if (exist_test === 1) {
    //var first_key_array = start_of_reply[last_word];
//    console.log("first key array " + first_key_array);
    first_key = first_key_array[Math.floor(Math.random() * first_key_array.length)];
  } else {
    console.log("Random response activated");
    var count = 0;
    for (var prop in object.start_of_reply[0])
      if (Math.random() < 1/++count)
        first_key_array = object.start_of_reply[0][prop];
    first_key = first_key_array[Math.floor(Math.random() * first_key_array.length)];
  }
//  console.log("first key " + first_key);

  // first_key gives us the first two words in the reply, use the markov
  // brain to build the rest of the sentence
  var result_arr = object.markov_word[first_key];
  var next_word = result_arr[Math.floor(Math.random() * result_arr.length)];
  first_key = first_key.charAt(0).toUpperCase() + first_key.slice(1); //capitalize 
  if (next_word === "endend")
    return first_key;
  var result = first_key + " " + next_word;
  var split_first_key = first_key.split(" ");
  var next_key = split_first_key[1] + " " + next_word;
  for (var ii = 3; ii <= maxLengthOfMessage; ii++) {
    if (typeof object.markov_word[next_key] === 'undefined') {
      return result;
    } else {
      var next_words = object.markov_word[next_key];
      var next_word = next_words[Math.floor(Math.random() * next_words.length)];
      if (next_word === "endend")
        return result;
      result = result + " " + next_word;
      var split_next_key = next_key.split(" ");
      next_key = split_next_key[1] + " " + next_word;
    }
  }
  return result;
};

var chatbox = function () {
    $(document).on('keypress', '.status-box', function(e) {
    //$('.status-box').keypress(function(e) {
      if (e.which === 13) {
        var post = $('.status-box').val();
        if (post.length > 0) {
          $('<li>').text(post).prependTo('.posts');
          var topi = $("ul > li:first-child");
          topi.addClass('post');
          $('.status-box').val('');
          
          var reply_to_post = function(pst) {
            var reply = run_markov(pst);
            $('<li>').delay(10000).text(reply).prependTo('.posts');
            topi = $("ul > li:first-child");
            topi.addClass('reply');
          }
          var timeoutID = window.setTimeout(reply_to_post(post),5000);
        }
        return false;
      }
    });
};

function errorJsonHandler(evt) {
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

function handleJsonSelect(evt) {
  jsonReader = new FileReader();
  jsonReader.onerror = errorJsonHandler;
  jsonReader.onabort = function(e) {
    alert('File read cancelled');
  };
  jsonReader.onload = function(e) {
    var json = this.result;
    object = JSON.parse(json);
    //console.log(object);
    $('.step1').remove();
    $(".step2").removeClass("hidden");
    $('h1').text('Chat to the bot!');
    //setTimeout(function() {$('h1').animate({visibility: "hidden"})},1000);
    //$('h1').animate({visibility: "hidden"});
    setTimeout(function() {$('h1').hide(600)},1000);
  }
  // Read in the image file as text lines.
  jsonReader.readAsText(evt.target.files[0]);
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

$(document).ready(chatbox);
document.getElementById('files').addEventListener('change', handleJsonSelect, false);
