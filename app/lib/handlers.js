    /**
     * Request handlers
     * @author Vincent Audette
     * @version 12.19.01
     */

    const _data = require('./data');
    const utils = require('./utils');
    const config = require('./config');

    // Defining handlers as empty objects
    const handlers = {};


    // SECTION Handler utils

    // Manage the verification dynamically
    dataVerification = (payload, field, bool, expectedType) => {
        if(typeof(payload[field]) == expectedType){

            switch(expectedType){
                case 'string':
                    return payload[field].trim().length > 0 && bool ? payload[field].trim() : false;
                case 'boolean':
                    return bool;
                case 'object':
                    return payload[field] instanceof Array && payload[field].length > 0 && bool ? payload[field] : false;
                case 'number':
                    return payload[field] % 1 === 0 && bool ? payload[field]:false;
                default:
                    return null;
            }
        }
    }


    handlers.ping = (data, callback) =>  callback(200); 

    // Default if handler is not found
    handlers.notFound = (data, callback) => {
        callback(404) 
    };

    getFirstName = (payload) => (dataVerification(payload,'firstName',true,'string'));
    getLastName = (payload) => (dataVerification(payload,'lastName',true,'string'));
    getHashedPassword = (payload) => (utils.hash(dataVerification(payload,'password',true,'string')));
    getPhone = (payload) => (dataVerification(payload,'phone',payload['phone'].length == 10,'string'));
    getTosAgreement = (payload) => (dataVerification(payload,'tosAgreement',payload['tosAgreement'], 'boolean'));
    
    // !SECTION 

    // SECTION Users handlers

    handlers.users = (data, callback) => {
        const acceptableMethods=['get','put','post','delete'];
        acceptableMethods.includes(data.method) ? handlers._users[data.method](data,callback) : callback(405);
    }


    handlers._users = {};

    handlers._users.post = (data, callback) => {

        userData = {}

        userData.firstName = getFirstName(data.payload);
        userData.lastName = getLastName(data.payload);
        userData.phone = getPhone(data.payload);
        userData.password = getHashedPassword(data.payload);
        userData.tosAgreement = getTosAgreement(data.payload);

        if(!Object.values(userData).includes(false)){
            _data.read('users', userData.phone, (err, data)=>{
                if(err){
                    _data.create('users',userData.phone,userData,(err)=>{
                        callback(!err ? 200 : (500,{'Error': "Could not create the new user"}));
                })
                }else{
                    callback(400,{'Error':'This phone number is attributed to an existing user'})
                }
            })
        }else{
            const wrongFields = utils.getKeysByValue(userData,false);
            callback(400,{'Error': 'Missing required fields '+ wrongFields});
        }
    }

    
    handlers._users.get = (data, callback) => {

        const phone = data.queryStringObject.phone.trim();

        let token = data.headers.token;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                if(phone.length == 10 && typeof(phone) == 'string'){
                    _data.read('users', phone, (err, data) => {
                        if(!err && data){
                            delete data.password;
                            callback(200, data);
                        }else{
                            callback(404, {'Error':"User does not exist"})
                        }});
                }else{ callback(400,{'Error': 'Missing phone number'}) } 
            }else{ callback(403,{'Error':'Denied access'}); }
        })
    }

    handlers._users.put = (data, callback) => {

        const phone = data.payload.phone.trim();

        const firstName = dataVerification(data.payload,'firstName',true,'string');
        const lastName = dataVerification(data.payload,'lastName',true,'string');
        const password = utils.hash(dataVerification(data.payload,'password',true,'string'));

        let token = data.headers.token;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){

                if(phone.length == 10 && typeof(phone) == 'string'){

                    if( firstName || lastName || password){
                        _data.read('users', phone, (err, userData) => {
                            if(! err && userData){
                                
                                if(firstName){
                                    userData.firstName = firstName;
                                }

                                if(lastName){
                                    userData.lastName = lastName;
                                }

                                if(password){
                                    userData.password = utils.hash(password);
                                }
                                
                                _data.update('users',phone,userData, (err)=>{
                                    callback(!err ? 200 : (500,{'Error':'Problem updating user info'}))
                                })
                            }else{ callback(400, {'Error': 'No user associated to this number'})}
                        })
                        }else{ callback(400, {'Error': 'Missing phone'}) }
                } 
            }else{ callback(403,{'Error':'Denied access'});}
        })

        
    }

    // TODO: delete stuff on cascade (Clean up)
    handlers._users.delete = (data, callback) => {

        const phone = data.queryStringObject.phone.trim();
        let token = data.headers.token;

        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                
                if(phone.length == 10 && typeof(phone) == 'string'){
                    _data.read('users', phone, (err, data) => {
                        if(!err && data){
                            _data.delete('users', phone, (err)=>{
                                callback(!err ? 200 : (500, {'Error':'Problem removing the user'}) );
                            })
                        }else{ callback(404, {'Error':"User does not exist"})}
                    });
                }else{ callback(400,{'Error': 'Missing phone number'})}
            }else{ callback(403,{'Error':'Denied access'});}
        })
    }
    // !SECTION 

    // SECTION  Tokens handlers
    handlers.tokens = (data, callback) => {
        const acceptableMethods=['get','put','post','delete'];
        acceptableMethods.includes(data.method) ? handlers._tokens[data.method](data,callback) : callback(405);
    }
    
    handlers._tokens = {};

      /**
     * @requires phone, password
     */
    handlers._tokens.post = (data, callback) => {
        const phone = data.payload.phone;
        const password = getHashedPassword(data.payload);

        if( phone && password){
            _data.read('users', phone, (err, userData) => {
                if(!err && userData){
                    if ( password == userData.password){
                        // We arrived @ the location where the token can be generated
                        let tokenId = utils.createRandomString(20);
                        let expires = Date.now() + 1000 * 60 * 60;
                        var tokenObj = {
                            phone: phone,
                            tokenId: tokenId,
                            expires: expires
                        };
                        _data.create('tokens', tokenId, tokenObj, (err)=>{
                            if(!err){
                                callback(200,tokenObj);
                            }else{ callback(500,{'Error':'Could not create token'}) }
                        })
                    }else{ callback(400, {'Error':'Password does not match'}) }
                }else{ callback(400, {'Error':'Cannot find the user'}) }
            })
        }else{ callback(400, {'Error':'Unidentified credentials'}); }

    }

    handlers._tokens.get = (data, callback) => {
        const tokenId = data.queryStringObject.tokenId.trim();

        if(tokenId.length == 20 && typeof(tokenId) == 'string'){
            _data.read('tokens', tokenId, (err, tokenData) => {
                if(!err && tokenData){
                    callback(200, tokenData);
                }else{
                    callback(404, {'Error':"Token does not exist"})
                }});
        }else{
            callback(400,{'Error': 'Missing token'})
        }
        
        
    }

  
    handlers._tokens.put = (data, callback) => {
        const tokenId = data.payload.tokenId.trim();
        const extend = data.payload.extend;

        if(tokenId.length == 20 && extend){
            _data.read('tokens',tokenId,(err, tokenData)=>{
                if(!err && tokenData){

                    if(tokenData.expires > Date.now()){
                        tokenData.expires = Date.now() + 1000*60*60;
                        _data.update('tokens',tokenId,tokenData,(err) =>{
                            if(!err){
                                callback(200);
                            }else{ callback(500,{'Error':'Could not persist the modified token'}) }
                        })
                    }else{ callback(400,{'Error':'The toke is expired, a new one must be created'})}
                }else{ callback(400,{'Error':'Token DNE'}) }
            })
        }else{callback(400, {'Error':'Invalid parameters (tokenId and extend needed)'})}
        
    }

    handlers._tokens.delete = (data, callback) => {

        const tokenId = data.queryStringObject.tokenId.trim();

        if(tokenId.length == 20 && typeof(tokenId) == 'string'){
            _data.read('tokens', tokenId, (err, tokenData) => {
                if(!err && tokenData){
                    _data.delete('tokens', tokenId, (err)=>{
                        callback(!err ? 200 : (500, {'Error':'Problem removing the token'}) );
                    })
                }else{
                    callback(404, {'Error':"Token does not exist"})
                }});
        }else{
            callback(400,{'Error': 'Missing token id'})
        }
    }



    /**
     * This is the function that will allow the authentication to occur throughout the site:
     */
    handlers._tokens.verifyToken = (tokenId, phone, callback) =>{

        _data.read('tokens',tokenId,(err, tokenData) => {
            if(!err && tokenData){
                if(tokenData.phone == phone && tokenData.expires > Date.now()){
                    callback(true);
                }
            }else{
                callback(false);
            }
        });
    };

    // !SECTION 

    // SECTION Checks handlers

    getProtocol = (payload) => (dataVerification(payload,'protocol',['http','https'].indexOf(payload.protocol) > -1,'string'));
    getUrl = (payload) => (dataVerification(payload,'url',true,'string'));
    getMethod = (payload) => (dataVerification(payload,'method',['get','put','post','delete'].indexOf(payload.method) > -1,'string'));
    getSuccessCodes = (payload) => (dataVerification(payload,'successCodes',true, 'object'));
    getTimeoutSeconds = (payload) => (dataVerification(payload,'timeoutSeconds',payload['timeoutSeconds'] >= 1 && payload['timeoutSeconds']<=5, 'number'));
    // TODO del if nvr used
    // getUserChecks = (payload) => {
    //     checks = dataVerification(payload,'checks',true, 'object');
    //     return checks == false ? [] : checks;
    // };

    handlers.checks = (data, callback) => {
        const acceptableMethods=['get','put','post','delete'];
        acceptableMethods.includes(data.method) ? handlers._checks[data.method](data,callback) : callback(405);
    }

    handlers._checks = {};

    /**
     * Checks - post
     * @requires protocal, url, method, sucessCodes, timeoutSeconds 
     * @optional none
     */
    handlers._checks.post = (data, callback) => {

        checksData = {
            protocol: getProtocol(data.payload),
            url: getUrl(data.payload),
            method: getMethod(data.payload),
            successCodes: getSuccessCodes(data.payload),
            timeoutSeconds: getTimeoutSeconds(data.payload)
        }

        if(!Object.values(checksData).includes(false)){
            token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                if(token){
                    _data.read('tokens', token, (err, tokenData) => {
                        if(!err && tokenData){
                            console.log(tokenData.expires + "   now:", Date.now())
                            _data.read('users', tokenData.phone, (err, userData) => {
                                if(!err && userData){
                                    userChecks =  typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                    if(userChecks.length < config.maxChecks){

                                        const checkId = utils.createRandomString(20);

                                        const checkObj = {};
                                        Object.assign(checkObj,checksData);
                                        checkObj.userPhone = tokenData.phone;
                                        checkObj.id = checkId;

                                        _data.create('checks',checkId,checkObj, (err)=>{
                                            if(!err){

                                                userData.checks = userChecks;
                                                userData.checks.push(checkId);

                                                _data.update('users',tokenData.phone, userData,(err) => {
                                                    if(!err){ 
                                                        callback(200, checkObj)
                                                    }else{ 
                                                        callback(500,{'Error':'Problem updating user'}) 
                                                    }
                                                })
                                            }else{ callback(500,{'Error':'Problem creating check'});}
                                        })
                                    }else{callback(400,{'Error':'Maximum number of checks ('+config.maxChecks+')'}) }
                                    
                                }else{callback(500,{'Error':'No user associated to token'}) }
                            });
                        }else{ callback(400,{'Error':'Invalid token'}) }
                    });
                }else{callback(400,{'Error':'Unauthenticated guest'})}
        }else{ callback(400, {'Error': 'Missing or invalid inputs'})}

    }

    handlers._checks.get = (data, callback) => {

        const checkId = dataVerification(data.queryStringObject,'id',data.queryStringObject.id.length == 20,'string')

        if(checkId){

            _data.read("checks",checkId,(err,checkData) => {
                if(!err && checkData){




                }else{callback(404,{'Error':'No checks associated to this id'})}
            })


            const phone = data.queryStringObject.phone.trim();

            let token = data.headers.token;
            handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
                if(tokenIsValid){
                    if(phone.length == 10 && typeof(phone) == 'string'){
                        _data.read('users', phone, (err, data) => {
                            if(!err && data){
                                delete data.password;
                                callback(200, data);
                            }else{
                                callback(404, {'Error':"User does not exist"})
                            }});
                    }else{ callback(400,{'Error': 'Missing phone number'}) } 
                }else{ callback(403,{'Error':'Denied access'}); }
            })
        }

            
    }

    handlers._checks.put = (data, callback) => {
        
    }

    

    handlers._checks.delete = (data, callback) => {
        
    }



    //!SECTION


    module.exports = handlers;