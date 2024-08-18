require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3 } = require("web3");
const provider = new HDWalletProvider(
  process.env.PHRASE_WALLET_KEY,
  "https://sepolia.infura.io/v3/" + process.env.INFURA_API_KEY
);

const web3 = new Web3(provider);
const getData = async () => {
  const accounts = await web3.eth.getAccounts();
  const balance = await web3.eth.getBalance(accounts[0]);
  console.log("Account address:", accounts[0]);
  console.log("Account balance:", web3.utils.fromWei(balance, "ether"), "ETH");
  provider.engine.stop();
};
getData();
