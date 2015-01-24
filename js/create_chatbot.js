var main = function () {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      //alert('Great success! All the File APIs are supported.');
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
    $('.status-box').keypress(function(e) {
    });
};

$(document).ready(main);
