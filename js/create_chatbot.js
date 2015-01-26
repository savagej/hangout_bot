  var reader;

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
      // Ensure that the progress bar displays 100% at the end.

      var lines = this.result.split('\n');
      for(var line = 0; line < lines.length; line++){
        if (lines[line].match(/@xxx/)) {
          console.log(lines[line]);
        }
      }


      $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100);
      $('.progress-bar').append("DONE!");
      setTimeout("$('.progress-bar').removeClass('loading');", 2000);
    }

    // Read in the image file as a binary string.
    reader.readAsText(evt.target.files[0]);
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
