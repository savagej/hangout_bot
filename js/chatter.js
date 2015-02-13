"use strict";
//var markov_word;
//$.getJSON("json/markov.data.json", function(jsons) {
//  //console.log(jsons); // this will show the info it in firebug console
//  markov_word = jsons;
//});
//var start_of_reply;
//$.getJSON("json/last_words.data.json", function(jsons) {
//  //console.log(jsons); // this will show the info it in firebug console
//  start_of_reply = jsons;
//});
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

$(document).ready(chatbox);
