    /**
     * Request handlers
     * @author Vincent Audette
     * @version 12.19.01
     */

    const _data = require('./data');
    const utils = require('./utils');

    // Defining handlers as empty objects
    const handlers = {};


    handlers.users = (data, callback) => {
        const acceptableMethods=['get','put','post','delete'];
        acceptableMethods.includes(data.method) ? handlers._users[data.method](data,callback) : callback(405);
    }

    dataVerification = (payload,field, bool, expectedType) => {

        switch(expectedType){
            case 'string':
                return typeof(payload[field]) == expectedType && payload[field].trim().length > 0 && bool ? payload[field].trim() : false;
            case 'boolean':
                return typeof(payload[field]) == expectedType && payload['tosAgreement'];
            default:
                return null;
        }

    }

    getFirstName = (payload) => (dataVerification(payload,'firstName',true,'string'))
    getLastName = (payload) => (dataVerification(payload,'lastName',true,'string'))
    getHashedPassword = (payload) => (utils.hash(dataVerification(payload,'password',true,'string')))
    getPhone = (payload) => (dataVerification(payload,'phone',payload['phone'].length == 10,'string'))
    getTosAgreement = (payload) => (dataVerification(payload,'tosAgreement',true, 'boolean'))


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
                }else{
                    callback(400,{'Error': 'Missing phone number'})
                }
                
            }else{
                callback(403,{'Error':'Denied access'});
            }
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
                            }else{
                                callback(400, {'Error': 'No user associated to this number'})
                            }})
                        }else{
                        callback(400, {'Error': 'Missing phone'})
                    }
                }
                
            }else{
                callback(403,{'Error':'Denied access'});
            }
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
                        }else{
                            callback(404, {'Error':"User does not exist"})
                        }});
                }else{
                    callback(400,{'Error': 'Missing phone number'})
                }
            }else{
                callback(403,{'Error':'Denied access'});
            }
        })

        
    }


    handlers.tokens = (data, callback) => {
        const acceptableMethods=['get','put','post','delete'];
        acceptableMethods.includes(data.method) ? handlers._tokens[data.method](data,callback) : callback(405);
    }

    //Container for private functions token
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
                            }else{
                                callback(500,{'Error':'Could not create token'})
                            }
                        })
                    }else{
                        callback(400, {'Error':'Password does not match'})
                    }
                }else{
                    callback(400, {'Error':'Cannot find the user'})
                }
            })
        } else{
            callback(400, {'Error':'Unidentified credentials'});
        }

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
                            }else{
                                callback(500,{'Error':'Could not persist the modified token'})
                            }
                        })
                    }else{
                        callback(400,{'Error':'The toke is expired, a new one must be created'})
                    }
                }else{
                    callback(400,{'Error':'Token DNE'})
                }
            })
        }else{
            callback(400, {'Error':'Invalid parameters (tokenId and extend needed)'})
        }
        
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



    handlers.ping = (data, callback) =>  callback(200); 

    // Default if handler is not found
    handlers.notFound = (data, callback) => {
        callback(404) 
    };

    module.exports = handlers;