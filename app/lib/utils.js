/**
 * Utilities to perform oper
 * @author Vincent Audette
 * @version 12.19.01
 */


 const crypto = require('crypto');
 const config = require('./config');

 const utils = {};

 utils.parseJsonToObject = (json) => {
    try{
        return JSON.parse(json);
   }catch(e){
        return {};
   }
 }

// hashing the password with SHA256
utils.hash = (pw) => (
    typeof(pw) == 'string' && pw.length > 0 
    ? crypto.createHmac('sha256',config.HASHING_SECRET).update(pw).digest('hex')
    : false
);

utils.getKeysByValue = (object, value) => {
    const keysArray = Object.keys(object).map(key => {if(object[key] === value){return key;}});
    return keysArray.filter(key =>{ if(key != undefined){return key;}});
  }


  utils.createRandomString = (nbCharacters) => {

    //Verify the type
    if( typeof(nbCharacters) == 'number' && nbCharacters>0){

        const charChoice = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        
        for(let i =0 ; i < nbCharacters; i++){
            token += charChoice.charAt(Math.floor(Math.random()*charChoice.length))
        }
        return token;

    }
    
  }


module.exports = utils;