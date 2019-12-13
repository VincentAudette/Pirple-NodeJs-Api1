
    const http = require('http');
    const url = require('url');
    const strDecoder = require('string_decoder').StringDecoder;
    const configEnvironment = require("./config");

    /**
     * Server creation
     */
    // Instantiating the http server
    const httpServer = http.createServer((req,res)=>unifiedServer(req,res))
    const httpsServer = https.createServer((req,res)=>unifiedServer(req,res))


    const unifiedServer = (req, res) => {
    
        //Getting the requested url and parsing its content
        var parsedUrl = url.parse(req.url, true);
        var path = parsedUrl.pathname;
        var trimmedPath = path.replace(/^\/+|\/+$/g,'');
        var method = req.method.toUpperCase();
        var headers = req.headers;
        var queryStringObject = parsedUrl.query;


        /**
         * Getting the payload (Handling a stream)
         */
        var utf8decoder = new strDecoder('utf-8');
        var stringPlaceHolder = ''; 
        // Receiving the data and decoding it (if any data is being sent in)
        req.on('data', (data) => {
            stringPlaceHolder += utf8decoder.write(data);
        });
        // Ending request: handler of the end event which always gets called
        req.on('end', function(){
            stringPlaceHolder += utf8decoder.end();
            // Selecting handler request should go to; if notFound Default to notFound
            var selectedHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
            
            var data = { // Construct the data object to send to the handler
                'trimmedPath' : trimmedPath,
                'queryStringObject' : queryStringObject,
                'method' : method,
                'headers' : headers,
                'payload' : stringPlaceHolder
            };
            // Routing request to chosen handler specified in router
            selectedHandler(data, function(statusCode, payload){
                // Determining if statusCode called back by handler is used or defaulting to 200
                statusCode = typeof(statusCode) == 'number' ?  statusCode : 202;
                // Determining if payload called back by handler is used or defaulting to empty object
                payload = typeof(payload) == 'object' ? payload : {};
                // Converting the payload to a string
                var payloadStr = JSON.stringify(payload);
                // Formalizing return type as JSON and returning the response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payloadStr); 
                //Log the path that the user is requesting
                console.log("\nRequest received with:\n" 
                + "Payload: " + stringPlaceHolder);
            }); // handler now selected
        }); //end event closed

        /**
         * Stream handling done
         */
    }; //server closed


    /**
     * Server activation
     */ 
    server.listen(configEnvironment.port, () => {
        console.log("The "+ configEnvironment.envName +" server is listening on port: "+configEnvironment.port);
    }); //end server listening 


    /**
     * Handlers
     */ 
    // Defining handlers as empty objects
    var handlers = {};
    // Hello handler
    handlers.hello = (data, callback) => {
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


    /**
     * Router
     */ 
     //Defining request router
     var router = {
         'hello' : handlers.hello
     };
    
