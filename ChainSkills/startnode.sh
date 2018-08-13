#!/bin/bash

/home/antoine/go-ethereum/build/bin/geth --identity "node1" --fast --networkid 42 --datadir /home/antoine/ChainSkills/node --nodiscover --rpc --rpcport "8044" --port "30305" --unlock 0 --password "/home/antoine/ChainSkills/node/password.sec" 
