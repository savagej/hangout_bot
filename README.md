# hangout_bot
This website is where you can drop your hangouts archives and create your own chatbots. All of the processing of the hangouts archive happens in your browser, on your computer, so none of your chat data is sent across the internet.
The website is at http://savagej.github.io/hangout_bot.

- You first need to download your hangout archive at: https://www.google.com/settings/takeout

- Once you get the Hangouts.json file, you can load it into the web app.

- You can then choose what conversations you want to base your chatbot on. Since people speak differently to different friends, your chatbot will change depending on what conversations you choose. Also, keep in mind that the more messages you use to train your bot, the better it will end up.

- Finally choose the person you'd like to base the chatbot on from the people that were in the conversations you've chosen. If you've chosen many conversations, try to choose a person that is common to all/most of those conversations.

- The app can take a couple of minutes to process the text if the conversations you've selected contain more than ~50,000 messages. Don't worry if your browser complains that a script is running a long time. You usually never run big calculations in your browser since the data usually gets sent to a server to be processed. Since all your sensitive chat data is staying on your computer, your browser has to run the calculations and it assumes some script is misbehaving.


The original chatbot testing in Perl is in the Perl_test folder.
