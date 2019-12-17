//Configuration variables

const environments = {};

//envrionment attributes setup
environments.staging = {
    'httpPort': 2000,
    'httpsPort':2001,
    'envName': 'staging',
    'HASHING_SECRET' : 'love_love_me_do',
};

environments.production = {
    'httpPort': 5000,
    'httpsPort':5001,
    'envName': 'production',
    'HASHING_SECRET' : 'love_blablou_me_do',
};

//determine which env to select
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): '';
var exportEnv = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

module.exports = exportEnv;