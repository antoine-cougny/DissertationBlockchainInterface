var Web3 = require('web3');
var THREE = require('three');
var truffle_contract = require('truffle-contract');

App = {
    web3Provider: null,
    contracts: {},
    numberOfTasks = 0,
    
    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined')
        {
            App.web3Provider = web3.currentProvider;
            console.log('CONNECTION: Connected with Metamask');
        }
        else
        {
            // If no injected web3 instance is detected, fall back to Ganache
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8042');
            console.log('CONNECTION: Direct rpc connection');
        }
        // Create the web3 instance
        web3 = new Web3(web3Provider);
    },
    
    initContract: function() {
        $.getJSON('build/contracts/taskToken.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var taskArtifact = data;
            App.contracts.taskToken = TruffleContract(taskArtifact);

            // Set the provider for our contract
            contracts.taskToken.setProvider(App.web3Provider);
            console.log("INITC: ABI has been read.");
        });
    },
    
    // Every time we click on the create button, we will send a new task
    createTask: function(name, reward, xCoord, yCoord, zCoord, zOrient, stayTime) {
        // Get the orientation
        var beta = 0; var gamma = 0; var alpha = zOrient;
        var x_radian = ((beta + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
        var y_radian = ((gamma + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
        var z_radian = ((alpha + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
        var eurlerpose = new THREE.Euler(x_radian, y_radian, z_radian);
        var quaternionpose = new THREE.Quaternion;
        quaternionpose.setFromEuler(eurlerpose);

        var infoStringify = JSON.stringify({
            reward : parseFloat(reward),
            goalPosition_p : {
                position : {
                    x : parseFloat(xCoord),
                    y : parseFloat(yCoord),
                    z : parseFloat(zCoord)
                },
                orientation : {
                    x : quaternionpose.x,
                    y : quaternionpose.y,
                    z : quaternionpose.z,
                    w : quaternionpose.w
                }
            },
            toDo : {
                waitTime : parseFloat(stayTime)
            }
        });


        /* Start of the block */
        var taskInstance;
        console.log("EVENT: Minting token");
        contracts.taskToken.deployed().then(function(instance) {
            taskInstance = instance;
            // Mint the token
            console.log("MINTING: name: " + name + " info: " + infoStringify);
            return taskInstance.mint(name, infoStringify, {from: web3.eth.accounts[0], gas: 30000000})
            /* End of the block */
        }).then(function(instance) {
            console.log(instance);
            console.log("EVENT: Id of the new task: " + App.numberOfTasks-1);




            // Custom message
            var userTask = new ROSLIB.Message({
                id : App.numberOfTasks.toString(), // To be generated // Get
                name : name,
                reward : parseFloat(reward),
                goalPosition_p : {
                    position : {
                        x : parseFloat(xCoord),
                        y : parseFloat(yCoord),
                        z : parseFloat(zCoord)
                    },
                    orientation : {
                        x : quaternionpose.x,
                        y : quaternionpose.y,
                        z : quaternionpose.z,
                        w : quaternionpose.w
                    }
                },
                toDo : {
                    waitTime : parseFloat(stayTime)
                }
            });
            console.log("EVENT: Created custom service message for task: " + userTask.name);     
            
            // Create a service request
            var request = new ROSLIB.ServiceRequest({
                task: userTask
            });

            // Call the service
            sendTaskToTrader_srvC.callService(request, function(result) {
                console.log('EVENT: Result for service call on '
                + sendTaskToTrader_srvC.name
                + ': '
                + result.auctionReady);
            });

            App.numberOfTasks += 1
        }).catch(function(err) {
            // Error function on the minting of the token
            console.log("EVENT: " + err.message);
        });
    },
};