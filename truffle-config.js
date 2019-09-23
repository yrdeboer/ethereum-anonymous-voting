/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const BIP39 = require('bip39');
var HDKey = require('ethereumjs-wallet/hdkey');
const HDWalletProvider = require('truffle-hdwallet-provider');
const readline = require('readline-sync');
const fs = require('fs');


function mnemonicToAddress0 (mnemonic) {

    if (!BIP39.validateMnemonic(mnemonic)) {
	throw("Invalid mnemonic: " + mnemonic);
    }

    const seed = BIP39.mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);

    var wallet0 = hdKey.derivePath("m/44'/60'/0'/0/0").getWallet();
    var addr = wallet0.getAddress();
    return "0x" + addr.toString("hex");
}


const mnemonic = readline.question("mnemonic: ");

const fromAddr = mnemonicToAddress0(mnemonic);

const infuraEndpointRinkeby = fs.readFileSync("infuraEndpointRinkeby.txt").toString().trim();
const infuraEndpointMainNet = fs.readFileSync("infuraEndpointMainNet.txt").toString().trim();


module.exports = {
    /**
     * Networks define how you connect to your ethereum client and let you set the
     * defaults web3 uses to send transactions. If you don't specify one truffle
     * will spin up a development blockchain for you on port 9545 when you
     * run `develop` or `test`. You can ask a truffle command to use a specific
     * network from the command line, e.g
     *
     * $ truffle test --network <network-name>
     */

    networks: {
	// Useful for testing. The `development` name is special - truffle uses it by default
	// if it's defined here and no other network is specified at the command line.
	// You should run a client (like ganache-cli, geth or parity) in a separate terminal
	// tab if you use this network and you must also set the `host`, `port` and `network_id`
	// options below to some value.
	//
	development: {
	    host: "127.0.0.1",     // Localhost (default: none)
	    port: 8545,            // Standard Ethereum port (default: none)
	    network_id: "*",       // Any network (default: none)
	    from: "0x64c05A365c053e3628e22a1BDF705A4D6A480edA"
	},

	// Another network with more advanced options...
	// advanced: {
	// port: 8777,             // Custom port
	// network_id: 1342,       // Custom network
	// gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
	// gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
	// from: <address>,        // Account to send txs from (default: accounts[0])
	// websockets: true        // Enable EventEmitter interface for web3 (default: false)
	// },

	// Useful for deploying to a public network.
	// NB: It's important to wrap the provider as a function.
	rinkeby: {
	    provider: () => new HDWalletProvider(
		mnemonic,
		infuraEndpointRinkeby),
	    network_id: 4,       // Rinkeby
	    gas: 6000000,       //
	    gasPrice: 50000000000,
	    confirmations: 2,    // # of confs to wait between deployments. (default: 0)
	    timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
	    skipDryRun: true,    // Skip dry run before migrations? (default: false for public nets )
	    from: fromAddr
	},

	mainnet: {
	    provider: () => new HDWalletProvider(
		mnemonic,
		infuraEndpointMainNet),
	    network_id: 1,       // Main 
	    gas: 2000000,       //
	    gasPrice: 20000000000,
	    confirmations: 2,    // # of confs to wait between deployments. (default: 0)
	    timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
	    skipDryRun: true,    // Skip dry run before migrations? (default: false for public nets )
	    from: fromAddr
	},

    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
	// timeout: 100000
    },

    // Configure your compilers
    compilers: {
	solc: {
	    version: "0.5.11",
	    // version: "0.4.26"
	    // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
	    // settings: {          // See the solidity docs for advice about optimization and evmVersion
	    //  optimizer: {
	    //    enabled: false,
	    //    runs: 200
	    //  },
	    //  evmVersion: "byzantium"
	    // }
	}
    }
}
