#!/bin/bash

geth --identity "node1" --fast --networkid 42 --datadir ./node --nodiscover --rpc --rpcport "8044" --port "30305" --unlock 0 --password "./node/password.sec" 
