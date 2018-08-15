#!/bin/bash

geth --identity "miner1" --networkid 42 --datadir "./miner1" --nodiscover --mine --rpc --rpcport "8042" --rpcapi "db,eth,net,web3,miner" --port "30303" --unlock 0 --password ./miner1/password.sec --ipcpath "~/.ethereum/geth.ipc" --rpccorsdomain="*" --targetgaslimit '9000000000000'
