module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*',
        },
    },

    mocha: {
        // see more here: https://www.npmjs.com/package/eth-gas-reporter
        // reporter: 'eth-gas-reporter',
    },

    solc: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },

    compilers: {
        solc: {
            version: '0.5.2',
        },
    },
};
