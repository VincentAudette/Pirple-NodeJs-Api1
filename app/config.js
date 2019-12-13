//Configuration variables

const environments = {};

//envrionment attributes setup
environments.staging = {
    'httpPort': 2000,
    'httpsPort':2001,
    'envName': 'staging',
};

environments.production = {
    'httpPort': 5000,
    'httpsPort':5001,
    'envName': 'production',
};

//determine which env to select
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): '';
var exportEnv = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

module.exports = exportEnv;