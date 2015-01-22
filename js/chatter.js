var markov;
$.getJSON("json/markov.data.json", function(jsons) {
  //console.log(jsons); // this will show the info it in firebug console
  markov = jsons;
});
var first_words;
$.getJSON("json/last_words.data.json", function(jsons) {
  //console.log(jsons); // this will show the info it in firebug console
  first_words = jsons;
});

var run_markov = function (inputText) {
  inputText = inputText.toLowerCase();
  console.log("inputText " + inputText);
  var input_array = inputText.split(/\s+/);
  var counter = input_array.length - 2;
  console.log("counter " + counter);
  var exist_test = 0;
  var last_word;
  if (counter === -2) {
    //do nothing if empty
  } else if (counter === -1) {
    last_word = input_array[0];
    if (typeof first_words[last_word] !== 'undefined') 
      exist_test = 1;
  } else {
    while ( (exist_test === 0) && (counter >= 0) ) {
      last_word =  input_array[counter] + " " + input_array[counter+1];
      console.log("first_words[last_word] " + first_words[last_word]);
      if (typeof first_words[last_word] !== 'undefined') 
        exist_test = 1;
      counter --;
    }
  }
  console.log("last word " + last_word);
  var first_key;
  if (exist_test === 1) {
    var first_key_array = first_words[last_word];
  console.log("first key array " + first_key_array);
    first_key = first_key_array[Math.floor(Math.random() * first_key_array.length)];
  } else {
    console.log("random");
    var count = 0;
    for (var prop in markov)
      if (Math.random() < 1/++count)
        first_key = prop;
  }
  console.log("first key " + first_key);

  var result_arr = markov[first_key];
  var next_word = result_arr[Math.floor(Math.random() * result_arr.length)];
  console.log(result_arr);
  first_key = first_key.charAt(0).toUpperCase() + first_key.slice(1);
  var result = first_key + " " + next_word;
  var split_first_key = first_key.split(" ");
  var next_key = split_first_key[1] + " " + next_word;
  for (var ii = 3; ii <= 20; ii++) {
    if (typeof markov[next_key] === 'undefined') {
      return result;
    } else {
      var next_words = markov[next_key];
      var next_word = next_words[Math.floor(Math.random() * next_words.length)];
      if (next_word === "endendend")
        return result;
      result = result + " " + next_word;
      var split_next_key = next_key.split(" ");
      next_key = split_next_key[1] + " " + next_word;
    }
  }
  return result;
 };

var main = function () {
    //$('.btn').click(function () {
    //    var post = $('.status-box').val();
    //    $('<li>').text(post).prependTo('.posts');
    //    var topi = $("ul > li:first-child");
    //    topi.addClass('post');
//
    //    var reply = run_markov(post);
    //    $('<li>').text(reply).prependTo('.posts');
    //    topi = $("ul > li:first-child");
    //    topi.addClass('reply');

    //    $('.status-box').val('');
    //    //$('.counter').text('140');
    //    //$('.btn').addClass('disabled');
    //});
    $('.status-box').keypress(function(e) {
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

          //$('.counter').text('140');
          //$('.btn').addClass('disabled');
        }
        return false;
      }
    });
    //$('.status-box').keyup(function() {
    //    var postLength = $(this).val().length;
    //    var charachtersLeft = 140 - postLength;
    //    $('.counter').text(charachtersLeft);
    //    if (charachtersLeft < 0) {
    //        $('.btn').addClass('disabled');
    //    } else if (charachtersLeft === 140) {
    //        $('.btn').addClass('disabled');
    //    } else {
    //        $('.btn').removeClass('disabled');
    //    }
    //});
    //$('.btn').addClass('disabled');
};

$(document).ready(main);
