# Hangout Bot
This website is where you can drop your hangouts archives and create your own chatbots. All of the processing of the hangouts archive happens in your browser, on your computer, so none of your chat data is sent across the internet.
The website is at http://savagej.github.io/hangout_bot.

- You first need to download your hangout archive at: https://www.google.com/settings/takeout

- Once you get the Hangouts.json file, you can load it into the web app.

- You can then choose what conversations you want to base your chatbot on. Since people speak differently to different friends, your chatbot will change depending on what conversations you choose. Also, keep in mind that the more messages you use to train your bot, the better it will end up.

- Finally choose the person you'd like to base the chatbot on from the people that were in the conversations you've chosen. If you've chosen many conversations, try to choose a person that is common to all/most of those conversations.

- The app can take a couple of minutes to process the text if the conversations you've selected contain more than ~50,000 messages. Don't worry if your browser complains that a script is running a long time. You usually never run big calculations in your browser since the data usually gets sent to a server to be processed. Since all your sensitive chat data is staying on your computer, your browser has to run the calculations and it assumes some script is misbehaving.

- Once you've created a chatbot, you can save what I've very generously called the "brains" of the chatbot. You can then load these brains into the "Chat" page on the site at any time in the future.

## How does the bot work?
There are two main parts to this bot's brain, speaking and listening. The speaking part is very easy to understand, it is what is known as a [bigram](http://en.wikipedia.org/wiki/N-gram) or a [markov chain](http://en.wikipedia.org/wiki/Markov_chain#Markov_text_generators). Basically, given two words, for example "how are", we can get what the most probable words are that come after them, for example "you" or "they". We can choose one of these words and now we have a new pair of words, for example "are you", with which we can choose the word after that, and so on and so forth. From this very simple set of rules, we can create remarkably coherent sounding sentences, for example "how are you doing today".
In this bot, the probability of words following each pair of words is determined by reading the messages written by the person that the bot is based on, so it should sound something like that person.

The listening part was slightly more difficult to design. From a human's message given to the chatbot, the bot somehow has to decide what will be the first two words of its markov chain response.  
The simplest way to train the bot is to take the last two words of every message in the archive that is sent to the person that the bot is based on, and link them to the first two words of the response of that message. For example, from this conversation exchange:

Abbott: Strange as it may seem, they give ball players nowadays very peculiar names.  
Costello: Funny names?  
Abbott: Nicknames, nicknames. Now, on the St. Louis team we have Who's on first, What's on second, I Don't Know is on third--  
Costello: That's what I want to find out. I want you to tell me the names of the fellows on the St. Louis team.  
Abbott: I'm telling you. Who's on first, What's on second, I Don't Know is on third--  
Costello: You know the fellows' names?  
Abbott: Yes.  
Costello: Well, then who's playing first?  
Abbott: Yes.  
Costello: I mean the fellow's name on first base.  
Abbott: Who.  
Costello: The fellow playin' first base.  
Abbott: Who.  
Costello: The guy on first base.  
Abbott: Who is on first.  

If Costello is being turned into a chatbot, we would get the following linked pairs of words:
"peculiar names." -> ["Funny names?"]
"on third--" -> ["That's what","You know"]
"Yes." -> ["Well, then","I mean"]
"Who." -> ["The fellow","The guy"]

Now if any message to the chatbot ends in any of those 4 sets of words, we know how to start our reply!!

---
The original chatbot testing in Perl is in the Perl_test folder.
