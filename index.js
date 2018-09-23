/*
 * Simple RESTful JSON "Hello World" API
 * hw assignment 1
 * created by Vincent Audette
 * guided by pirple on The Node.js Master Class
 * Sunday, September 23, 2018
 * 
 */

 /////////////////////////////////////////////////////////////////////////////////

    /**
     * Dependencies
     */

    var http = require('http');
    var url = require('url');
    var strDecoder = require('string_decoder').StringDecoder;

/////////////////////////////////////////////////////////////////////////////////

    /**
     * Server creation
     */

    // Instantiating the http server
    var server = http.createServer(function(req, res){
    
        //Getting the requested url and parsing its content
        var parsedUrl = url.parse(req.url, true);

        // Getting the (untrimmed) path
        var path = parsedUrl.pathname;

        // [REGEX] Trimming off any extranuous slaches
        var trimmedPath = path.replace(/^\/+|\/+$/g,'');

        // Getting the http method -> to lowerCase to avoid unexpeccted errors
         var method = req.method.toUpperCase();

        // Getting headers as an object
        var headers = req.headers;

        // Getting the query string as an object
        var queryStringObject = parsedUrl.query;

        /////////////////////////////////////////////////////////////////////////

        /**
         * Getting the payload (Handling a stream)
         */

        // 1. Instantiating decoder which should expect to decode: utf-8
        var utf8decoder = new strDecoder('utf-8');

        // 2. Set up variable that will contain the payload as a string
        var stringPlaceHolder = ''; 

        // 3. Receiving the data and decoding it (if any data is being sent in)
        req.on('data', function(data){

            stringPlaceHolder += utf8decoder.write(data);

        }); // receiving data closed

        // 4. Ending request: handler of the end event which, always gets called
        req.on('end', function(){

            stringPlaceHolder += utf8decoder.end();

            // Selecting handler request should go to, if notFound Default to notFound
            var selectedHandler = 
                typeof(router[trimmedPath]) != 'undefined' 
                ? router[trimmedPath]
                : handlers.notFound;

            // Construct the data object to send to the handler
            var data = {
                'trimmedPath' : trimmedPath,
                'queryStringObject' : queryStringObject,
                'method' : method,
                'headers' : headers,
                'payload' : stringPlaceHolder
            };

            // Routing request to chosen handler specified in router
            selectedHandler(data, function(statusCode, payload){

                // Determining if statusCode called back by handler is used or 
                // defaulting to 200
                statusCode = 
                    typeof(statusCode) == 'number' ? //is statusCode a number?
                    statusCode // if so then set statusCode = statusCode
                    : 202;  // if its anything else set statusCode = 200

                // Determining if payload called back by handler is used or 
                // defaulting to empty object
                payload = 
                    typeof(payload) == 'object' ? //is payload an object?
                    payload // if so then set payload = payload
                    : {};  // if its anything else set payload = empty object

                // Converting the payload to a string
                var payloadStr = JSON.stringify(payload);

                // Formalizing return type as JSON and returning the response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payloadStr); 

                //Log the path that the user is requesting
                console.log("\nRequest received with:\n" 
                + "Payload 👉  " + stringPlaceHolder);


            }); // handler now selected
        }); //end event closed

        /**
         * Stream handling done
         */

        /////////////////////////////////////////////////////////////////////////

    }); //server closed

/////////////////////////////////////////////////////////////////////////////////

    /**
     * Server activation
     */ 

    // Starting the server on selected port
    server.listen(7988, function(){
        console.log("The server is listening on port: 7988");
    }); //end server listening 

/////////////////////////////////////////////////////////////////////////////////

    /**
     * Handlers
     */ 

    // Defining handlers as empty objects
    var handlers = {};

    // Hello handler
    handlers.hello = function(data, callback){

        // Callback an http status code & payload
        callback(406,{'Welcome Message':'Greetings user, you have now entered' +
        ' into a simple server created by Vincent Audette. The server is limited'+
        ' to greeting you for now but, more interesting options are on their way,'});

    }; //end hello handler

    // Default if handler is not found
    handlers.notFound = function(data, callback){

        //Not found callback
        callback(404)

    }; //end not found handler

/////////////////////////////////////////////////////////////////////////////////

    /**
     * Router
     */ 

     //Defining request router
     var router = {
         'hello' : handlers.hello
     };
    
