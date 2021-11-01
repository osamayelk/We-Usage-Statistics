#Tasker

So this simple Tasker profile works by running once every hour, it first sets the important variables needed for the request:
- msisdn: The phone number to be used
- password: The WE account password
- URL: The URL for the Node JS server to call to get the statistics

Tasker then parses the response and sets variables in the KWGT widget to show the latest data.

Then there's a conditional that checks whether the remaining is less than 10% or number of remaining days is less than 2 days and sends you a notification with that information once so you could update your internet package
