# DApp of the "Open-Market for Robots Secured By Blockchain" MSc Project
Heriot-Watt University - Summer 2018

-----

## Pre-requisites
Install
- nodejs and npm [Instruction for Ubuntu here 16.04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04)
- git 
- go [Instruction for Ubuntu here](https://tecadmin.net/install-go-on-ubuntu/)
- geth [Instruction for Ubuntu here](https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu)
- truffle
```sh
$ npm install -g truffle
```

I advise you read/do [this tutorial](http://chainskills.com/2017/02/24/create-a-private-ethereum-blockchain-with-iot-devices-16/) before anything.

## How to Setup
Clone repo
```sh
git clone [url of the repo]
```
Install npm dependencies:
```sh
npm install
```
Compile the contract:
```sh
truffle compile
```

## Start the Geth miners:
```sh
cd ChainSkills
```
In a first tab:
```sh
./startminer1.sh
```
In a second tab:
```sh
./startminer2.sh
```
> **Note:**
> The CUSTOM version of these scripts uses a modified Geth node with no adjustment complexity.
> To use it, modify geth source code to remove the complexity adjustment algorithm: [instructions here](https://hackernoon.com/how-to-reduce-block-difficulty-in-ethereum-private-testnet-2ad505609e82) and update the path of the binary file.


## How to Use
Deploy the contract:
```sh
truffle migrate --network chainskill --reset
```
The reset option is used to force the redeployment of the contract on the blockchain. It is useful to reset the amount of tokens of if the code of the smart-contract has been modified.

Start lite-server:
```sh
npm run dev
```

If you edit the index.js file, don't forget to recompile:

```sh
npx watchify index.js -o bundle.js -v
```

## Add A Wallet for a Robot
[This Tutorial](http://chainskills.com/2017/03/10/part-3-setup-the-private-chain-miners/)

Keep the address of the wallet and edit the launchfile of the robots.
