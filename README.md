# We Usage Statistics
A Node JS command line tool/Server that fetches your WE internet usage statistics from the WE website using their backend APIs

## Fetching the encrypted password
The WE backend API accepts the password in an encrypted form, I tried reverse engineering the encryption algorithm from the browser's javascript but I got a bit bored :)

So for now to find your encrypted password just login through the WE website and check payload of the network request https://api-my.te.eg/api/user/login?channelId=WEB_APP 

You will find the object body: { password: ENCRYPTED_PASSWORD }

## Usage
The code could be run directly using Node 14 or if you don't want to worry about the environment just build and run the Dockerfile using the following commands:
````
docker build -t westatistics .
````
Then running for command line:
````
docker run --rm westatistics $PHONE_NUMBER $ENCRYPTED_PASSWORD
````
Or running as a server:
````
docker run --rm -p ${PORT}:3000 westatistics 
````

### Command Line
To run the code on the command line just run 
`node index.js $PHONE_NUMBER $ENCRYPTED_PASSWORD`

### API
You can call the following API if you don't pass any command line arguments
`/api/statistics?msisdn=${phoneNumber}&password=${encryptedPassword}`

### Response
For the command line or the API, I made a unified response
```javascript
{
total: 250,
used: 20,
remaining: 230,
percentage: 8,
daysLeft: 20,
expiryDate: "1999-01-01",
subscriptionDate: "1998-12-01"
}
```

## Dependencies

The package depends on the following:

- Express for the server
- Axios for the Http requests to the WE Backend 
- Node-cache to cache the tokens for the user

## Tasker task

I mainly wrote this code to use with Tasker to get a daily notification with my internet usage statistics, so I added the file **taskerTask.xml** with the steps for the tasker task. just replace the ${msisdn} and ${encrypted_password} variables with your values and import it in your Tasker application

## Next Steps

- [ ] Reverse engineer the encryption algorithm to be able to send the passwords as plain text
