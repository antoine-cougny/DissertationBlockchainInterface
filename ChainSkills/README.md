# Setup
## Read this tutorial
[This one](http://chainskills.com/2017/02/24/create-a-private-ethereum-blockchain-with-iot-devices-16/)

## Pair the miners

Follow this [link](http://chainskills.com/2017/03/17/pair-the-miners-46/)

# Start the miners

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

# [Optional] Remove the Complexity Adjustment algorithm
[Instructions here](https://hackernoon.com/how-to-reduce-block-difficulty-in-ethereum-private-testnet-2ad505609e82)
