/**
 * Request handlers
 * @author Vincent Audette
 * @version 12.19.01
 */

const _data = require('./data');
const utils = require('./utils');

// Defining handlers as empty objects
const handlers = {};
// Hello handler
handlers.ping = (data, callback) =>  callback(200); 


handlers.users = (data, callback) => {
    const acceptableMethods=['get','put','post','delete'];
    acceptableMethods.includes(data.method) ? handlers._users[data.method](data,callback) : callback(405);
}

dataVerification = (payload,field, bool, expectedType) => {

    switch(expectedType){
        case 'string':
            return dataVrified = typeof(payload[field]) == expectedType && payload[field].trim().length > 0 && bool ? payload[field].trim() : false;
        case 'boolean':
            return typeof(payload[field]) == expectedType && payload['tosAgreement'];
        default:
            return null;
    }

}


handlers._users = {};

handlers._users.post = (data, callback) => {

    userData = {}

    userData.firstName = dataVerification(data.payload,'firstName',true,'string');
    userData.lastName = dataVerification(data.payload,'lastName',true,'string');
    userData.phone = dataVerification(data.payload,'phone',data.payload['phone'].length==10,'string');
    userData.password = utils.hash(dataVerification(data.payload,'password',true,'string'));
    userData.tosAgreement = dataVerification(data.payload,'tosAgreement',true, 'boolean');

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

/**
 * //TODO: Only let authenticated user to acces theri obkectys
 */
handlers._users.get = (data, callback) => {

    const phone = data.queryStringObject.phone.trim();

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
     
}

//TODO only let authenticated users modify their own profile
handlers._users.put = (data, callback) => {

    const phone = data.payload.phone.trim();

    const firstName = dataVerification(data.payload,'firstName',true,'string');
    const lastName = dataVerification(data.payload,'lastName',true,'string');
    const password = utils.hash(dataVerification(data.payload,'password',true,'string'));

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
}

// TODO only let authenticated users delete their own profile
// TODO: delete stuff on cascade (Clean up)
handlers._users.delete = (data, callback) => {

    const phone = data.queryStringObject.phone.trim();

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
    

}

// Default if handler is not found
handlers.notFound = (data, callback) => {
    callback(404) 
};

module.exports = handlers;