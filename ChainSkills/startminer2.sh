#!/bin/bash

/home/antoine/go-ethereum/build/bin/geth --identity "miner2" --networkid 42 --datadir "~/ChainSkills/miner2" --nodiscover --mine --rpc --rpcport "8043" --rpcapi "db,eth,net,web3,miner" --port "30304" --unlock 0 --password ~/ChainSkills/miner2/password.sec --rpccorsdomain="*" --targetgaslimit '9000000000000'
