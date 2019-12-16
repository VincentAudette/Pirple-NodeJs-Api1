
    const http = require('http');
    const https = require('https');
    const url = require('url');
    const strDecoder = require('string_decoder').StringDecoder;
    const configEnvironment = require("./config");
    const fs = require('fs');
    const dataWriter = require('./lib/data');

    dataWriter.delete('test','testing','Rewriting', (err)=>{
        if(err){console.log(err);}
    });

    /**
     * Server creation
     */
    // Instantiating the http server
    const httpServer = http.createServer((req,res)=>unifiedServer(req,res));

    httpServer.listen(configEnvironment.httpPort, () => {
        console.log("The "+ configEnvironment.envName +" server is listening on port: "+configEnvironment.httpPort);
    });  

    // Instantiating the https server
    const httpsServer = https.createServer(
        {cert:fs.readFileSync('./https/cert.pem'),
         key:fs.readFileSync('./https/key.pem')}, (req,res)=>unifiedServer(req,res));

    httpsServer.listen(configEnvironment.httpsPort, () => {
        console.log("The "+ configEnvironment.envName +" server is listening on port: "+configEnvironment.httpsPort);
    });  

    const unifiedServer = (req, res) => {
    
        //Getting the requested url and parsing its content
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const trimmedPath = path.replace(/^\/+|\/+$/g,'');
        const method = req.method.toUpperCase();
        const headers = req.headers;
        const queryStringObject = parsedUrl.query;

        /**
         * Getting the payload (Handling a stream)
         */
        const utf8decoder = new strDecoder('utf-8');
        let stringPlaceHolder = ''; 
        // Receiving the data and decoding it (if any data is being sent in)
        req.on('data', (data) => {
            stringPlaceHolder += utf8decoder.write(data);
        });
        // Ending request: handler of the end event which always gets called
        req.on('end', function(){
            stringPlaceHolder += utf8decoder.end();
            // Selecting handler request should go to; if notFound Default to notFound
            const selectedHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
            
            const data = { // Construct the data object to send to the handler
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
                const payloadStr = JSON.stringify(payload);
                // Formalizing return type as JSON and returning the response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payloadStr); 
                //Log the path that the user is requesting
                console.log("\nRequest received with:\n" 
                + "Payload: " + stringPlaceHolder);
            }); // handler now selected
        }); //end event closed
    }; //server closed


    /**
     * Handlers
     */ 
    // Defining handlers as empty objects
    const handlers = {};
    // Hello handler
    handlers.ping = (data, callback) =>  callback(200); 

    // Default if handler is not found
    handlers.notFound = function(data, callback){
        //Not found callback
        callback(404) 
    }; //end not found handler


    /**
     * Router
     */ 
     //Defining request router
     const router = {
         'ping' : handlers.ping
     };
    
