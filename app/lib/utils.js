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


module.exports = utils;