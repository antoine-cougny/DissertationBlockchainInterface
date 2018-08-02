var $ = require('jquery');
var Web3 = require('web3');
var THREE = require('three');
var truffle_contract = require('truffle-contract');
var ROSLIB = require('roslib');
//var triggerTask = require('./deployTask.js');

var contracts = {};
var myToken = null;
const nullAddress = "0x0000000000000000000000000000000000000000";
// Instance Web3 using localhost testrpc
var web3Provider;
// Number of deployed token on the network
var numberOfTasks = 0;
// Measure ellapsed time
var t0, t1, t2, t3, t4;
var t1b_arr = {};
var i = 0; // counter

// Initialization of the DApp
// --------------------------
var initWeb3 = function()
{
    if (typeof web3 !== 'undefined')
    {
        web3Provider = web3.currentProvider;
        console.log('CONNECTION: Connected with Metamask');
    }
    else
    {
        // If no injected web3 instance is detected, fall back to Ganache
        web3Provider = new Web3.providers.HttpProvider('http://localhost:8042');
        console.log('CONNECTION: Direct rpc connection');
    }
    // Create the web3 instance
    web3 = new Web3(web3Provider);
}

var initContract = function(){
  $.getJSON('build/contracts/taskToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it
      // with truffle-contract
      var taskArtifact = data;
      contracts.taskToken = TruffleContract(taskArtifact);

      // Set the provider for our contract
      contracts.taskToken.setProvider(web3Provider);
      console.log("INITC: ABI has been read.");
      
      contracts.taskToken.deployed().then(function(instance) {
         myToken = instance;
      });

      // Use our contract to get the number of tasks already on the network
      return new Promise((resolve, reject) => {
          return getNumberOfTokenMinted(resolve, reject);
      }).then( (msg) => {
          console.log("\n\n\tINIT: READY\n\n\n");
      });
  });
};

// Connecting to ROS
// -----------------
var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

// If there is an error on the backend, an 'error' emit will be emitted.
ros.on('error', function(error) {
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('error').style.display = 'inline';
    console.log('CONNECTION: Error connecting to ROS websocket server: ', error);
});

// Find out exactly when we made a connection.
ros.on('connection', function() {
    console.log('CONNECTION: Connected to ROS websocket server.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('connected').style.display = 'inline';
});

ros.on('close', function() {
    console.log('CONNECTION: ROS connection closed.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'inline';
});

// Events on buttons clicks
// ------------------------
// Every time we click on the create button, we will send a new task
$('#createPoint').click(() => {
    auctionNewTask($('#task-name').val(), $('#reward-value').val(),
                  $('#xCoord').val(), $('#yCoord').val(), $('#zCoord').val(),
                  $('#orientation').val, $('#stay-time').val()
    ).then(() => {
        console.log("\nTOKEN MINTED, auction started\n\n\n");
    });
});

// Start the deployment of a set of tasks for testing purposes
// TODO: add a selector to select the interval between to tasks being deployed
$('#triggerTest').click(() => {
    console.log("T_TESTS: Start tests");
    triggerTest(0);
});

// Accounts and Tokens display synchronisation
// -------------------------------------------
// We will use this function to show the status of our accounts, 
// their balances and amount of tokens
const synchAccounts = (resolve, reject) => {
    console.log("SYNC_A: Starting");
    $('#default-account').html(`<b>First Account (computer): ${web3.eth.accounts[0]}</b>`);
    $('#accounts').html("");

    return synchAccountsRecursively(0, resolve, reject);
};

const synchAccountsRecursively = (i, resolve, reject) => {
    if (i == web3.eth.accounts.length)
    {
        console.log("SYNC_A: Done");
        t1b_arr[i] = getTS_msec();
        i += 1;
        resolve("fulfilled!");
    }
    else
    {
        var account = web3.eth.accounts[i];
        var balance = web3.fromWei(web3.eth.getBalance(account), "ether");
        myToken.balanceOf.call(account).then(tokens => {
            $('#accounts').append(`<p><!--<a href="#" class="sell">sell</a> <a href="#" class="buy">buy</a>--> `+
                                  `<span class="address">${account}</span> | `+
                                  `<span class="balance">ETH ${balance}</span> | `+
                                  `<span class="balance">Tokens ${tokens}</span></p>`);
            return synchAccountsRecursively(i+1, resolve, reject);
        }).catch(function(err) {
            console.log("SYNC_A: " + err.message)
        });
    }
};

// Same with the different tokens
const synchTokens = (resolve, reject) => {
    console.log("SYNC_T: Starting");
    $('#number-tokens').html("");
    $('#number-tokens').append(`<p>Number of tasks deployed: ${numberOfTasks}</p>`);
    $('#tokens').html("");
    return synchTokensRecursively(0, resolve, reject);
};

const synchTokensRecursively = (i, resolve, reject) => {
    if (i == numberOfTasks)
    {
        console.log("SYNC_Tr: Done");
        return synchAccounts(resolve, reject);
    }
    else
    {
        var deployedToken;
        var infoToken;
        deployedToken = myToken.getTask.call(i).then(info => {
            infoToken = info;
            return myToken.ownerOf.call(i);
        }).then(owner => {
            $('#tokens').append(`<p>Id: ${i} | Token Name: ${infoToken[0]} | Token Owner: ${owner} | Task Done: ${infoToken[2]} | Token Info: ${infoToken[1]}</p>`);
            return synchTokensRecursively(i+1, resolve, reject);
        }).catch(function(err) {
            console.log("SYNC_Tr: " + err);
        });
    }
};

// Get number of total tasks on the blockchain
// -------------------------------------------
const getNumberOfTokenMinted = (resolve, reject) => {
    contracts.taskToken.deployed().then(function(instance) {
        return instance.totalSupply.call();
    }).then(function(e) {
        numberOfTasks = e.toNumber();
        console.log("NBTOKEN: Number of task tokens on the blockchain: " + numberOfTasks);
        return synchTokens(resolve, reject);
    }).catch(function(err) {
        console.log("NBTOKEN: " + err.message);
    });
};

// Mint a token on the blockchain
// ------------------------------
const mintTaskToken = (name, info) => {
    var taskInstance;
    console.log("MINT: name: " + name + " info: " + info);
    contracts.taskToken.deployed().then(function(instance) {
        taskInstance = instance;
        // Mint the token
        return taskInstance.mint(name, info, {from: web3.eth.accounts[0], gas:30000000})
    }).then(function() {
        numberOfTasks += 1;
        //console.log(instance);
        console.log("MINT: nb tasks " + numberOfTasks);
        //synchTokens();
        //return getNumberOfTokenMinted();
    }).catch(function(err) {
        console.error(err.message);
    });
};

// Service client to send a task to the local trader node
// ------------------------------------------------------
var sendTaskToTrader_srvC = new ROSLIB.Service({
    ros : ros,
    name : 'taskToTrade',
    serviceType : 'trader/taskToTrade'
});

const auctionNewTask = function(name, reward, xCoord, yCoord, zCoord, zOrient, stayTime) {
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

    //mintTaskToken($('#task-name').val(), infoStringify);
    /* Start of the block of code, could not use fct here. Because of promises? */
    var taskInstance;
    console.log("EVENT: Minting token");

    i = 0;
    t0 = getTS_msec();

    return new Promise((resolve, reject) => {
        contracts.taskToken.deployed().then(function(instance) {
            taskInstance = instance;
            // Mint the token
            console.log("MINTING: name: " + name + " info: " + infoStringify);
            return taskInstance.mint(name, infoStringify, {from: web3.eth.accounts[0], gas: 30000000})
            /* End of the block */
        }).then(function(instance) {
            console.log(instance);
            console.log("EVENT: Id of the new task: " + (parseInt(numberOfTasks)-1).toString());




            // Custom message
            var userTask = new ROSLIB.Message({
                id : numberOfTasks.toString(),
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
            t1 = getTS_msec();
            sendTaskToTrader_srvC.callService(request, function(result) {
                if (result)
                {
                    console.log('EVENT: Result for service call on '
                    + sendTaskToTrader_srvC.name
                    + ': '
                    + result.auctionReady);
                    if (result.auctionReady === true)
                    {
                    }
                }
                else
                {
                    console.error("Could not contact ros trader nodes");
                }
            });



            // Update the total number of token locally
            //numberOfTasks += 1;
            return getNumberOfTokenMinted(resolve, reject);

        }).catch(function(err) {
            // Error function on the minting of the token
            console.log("EVENT: " + err.message);
        });
    });
};

// Advertising a Service for task transfer
// ---------------------------------------
// traderNode will contact this server to record a transaction on the blockchain
var idTask = "",
    idBuyer = "",
    idSeller = "";
var isTransactionAvailable = false;

// The Service object does double duty for both calling and advertising services
var deployTransactionBC = new ROSLIB.Service({
    ros : ros,
    name : '/deployTransactionBC',
    serviceType : 'blockchain_handler/transactionBC'
});

// Use the advertise() method to indicate that we want to provide this service
deployTransactionBC.advertise(function(request, response) {
    console.log('nT: Received service request on ' + deployTransactionBC.name 
                + ': \n' + request.idTask + " : " + request.idSeller 
                + " => " + request.idBuyer);
    if (!isTransactionAvailable && !markTransactionDoneAvailable)
    {
        console.log("nT: We accept to process the incomming transaction");
        response['status'] = true;
        idTask = request.idTask;
        idBuyer = request.idBuyer;
        idSeller = request.idSeller;
        isTransactionAvailable = true;
        deployTransaction();
    }
    else
    {
        console.warn("nT: The node is already busy, " 
                    + "we declined the incomming transaction");
        response['status'] = false;
    }
    return true;
});

// Used to contact the eth node to make the transfer
var deployTransaction = function() {
    // TODO: use parameter in function instead of global var
    console.log("DT: Transfer transaction");

    t2 = getTS_msec();
    var taskInstance;
    contracts.taskToken.deployed().then(function(instance) {
        taskInstance = instance;
        // Transfer task
        console.log("DT: Transfer initiated");
        return taskInstance.transferFrom(idSeller, idBuyer, idTask, {from: web3.eth.accounts[0], gas: 30000000});
    }).then(function(instance) {
        console.log("DT: Ready for a new transaction");
        isTransactionAvailable = false;
        return new Promise((resolve, reject) => {
            return synchTokens(resolve, reject);
        });
    }).catch(function(err) {
        console.log("DT: " + err.message);
    }).then(() => {
        console.log("\n\n\tDeploy Task Done\n\n")
    });
};

// Advertise Service to mark task as done
// --------------------------------------
var idTaskDone = 0;
var idTaskOwner = "";
var markTransactionDoneAvailable = false;

var markTaskDoneBC = new ROSLIB.Service({
    ros : ros,
    name : '/markTaskDoneBC',
    serviceType : 'blockchain_handler/transactionBC'
});

var markTaskDone = function() {
    // TODO: use parameter in function instead of global var
    console.log("mTD: setting Done flag transaction");

    t3 = getTS_msec();
    var taskInstance;
    contracts.taskToken.deployed().then(function(instance) {
        taskInstance = instance;
        // Transfer task
        console.log("mTD: initiated");
        return taskInstance.setTaskDone(idTaskDone, {from: web3.eth.accounts[0], gas: 30000000});//{from: idTaskOwner, gas: 30000000});
    }).then(function(instance) {
        console.log("mTD: Task " + idTaskDone + " has been set as done");
        markTransactionDoneAvailable = false;

        t4 = getTS_msec();
        console.warn("minting:", t1-t0,
                     "auction (+5s overhead) (ms):", t2-t1,
                     "refresh ", t2-t1b_arr[0],
                     "perform task t1 (+10s of task):", t3-t1,
                     "perform task t2 (+10s of task):", t3-t2,
                     "markTaskDone:", t4-t3,
                     "total task:", t4-t1
                    );

        return new Promise((resolve, reject) => {
            return synchTokens(resolve, reject);
        });
    }).catch(function(err) {
        console.error("mTD: " + err.message);
        // TODO find a better implementation not to lose the transaction
        markTransactionDoneAvailable = false;
    }).then(() => {
        console.log("\n\n\tMarkTask Done\n\n")
    });
};

markTaskDoneBC.advertise(function(request, response) {
    console.log('mTD: Received service request. Robot ' + request.idSeller
                + ' has finished task ' + request.idTask);
    if (!markTransactionDoneAvailable && !isTransactionAvailable)
    {
        console.log("mTD: We accept to process the incomming transaction");
        response['status'] = true;
        idTaskDone = request.idTask;
        idTaskOwner = request.idSeller;
        markTransactionDoneAvailable = true;
        markTaskDone();
    }
    else
    {
        console.warn("mTD: The node is already busy, " 
                    + "we declined the incomming transaction");
        response['status'] = false;
    }
    return true;
});

// Init functions
// --------------
(function() {
    $(window).on('load', function () {
        initWeb3();
        initContract();
        initArray();
    });
})();

// Get timestqmp in sec or msec
const getTS_sec = function() { return Math.round((new Date()).getTime() / 1000); }
const getTS_msec = function() { return Math.round((new Date()).getTime()); }

// ************************************************************************* //
/*
 * This file will trigger a sequence of auctions to test the deployment of
 * the robots
 */

Task = function (name, reward, xCoord, yCoord, zCoord, zOrient, stayTime)
{
    this.name = name;
    this.reward = parseFloat(reward);
    this.xCoord = parseFloat(xCoord);
    this.yCoord = parseFloat(yCoord);
    this.zCoord = parseFloat(zCoord);
    this.zOrient = parseFloat(zOrient);
    this.stayTime = parseFloat(stayTime);
}

Task.prototype.startTask = function()
{
    auctionNewTask(this.name, this.reward, this.xCoord, this.yCoord, this.zCoord, this.zOrient, this.stayTime);
}

arrayTask = {};
index = 0, nbTest = 0;

initArray = function() {
    arrayTask[0] = new Task("auto_test_0", 150,  0,  0, 0, 0, 15);
    arrayTask[1] = new Task("auto_test_1", 150, -1, -1, 0, 0,  9);
    arrayTask[2] = new Task("auto_test_2", 150,  3,0.5, 0, 0,  5);
    arrayTask[3] = new Task("auto_test_3", 150,  1,  0, 0, 0, 11);
    arrayTask[4] = new Task("auto_test_4", 150,  2,0.5, 0, 0, 30);
    arrayTask[5] = new Task("auto_test_5", 150, -1,  0, 0, 0,  8);
    arrayTask[6] = new Task("auto_test_6", 150,  0,  1, 0, 0,  4);
    arrayTask[7] = new Task("auto_test_7", 150,  5,  0, 0, 0,  7);
    arrayTask[8] = new Task("auto_test_8", 150,  2,  3, 0, 0,  8);
    arrayTask[9] = new Task("auto_test_9", 150, -5,  1, 0, 0, 15);
    
    nbTest = 10;
};


triggerTest = function (index) {
    if (index == nbTest)
    {
        console.log("TESTS: Done!");
        return true;
    }
    else
    {
        //arrayTask[index].startTask().then( () => {
        var task = arrayTask[index];
        //console.log("TESTS: Task to be sent:");
        //console.log(task);
        //startTask(task).then( () => {
        
        // A new auction is triggered every 5 sec
        setTimeout(function() {
            console.log("TESTS: Launching task " + index);
            auctionNewTask(task.name, task.reward,
                           task.xCoord, task.yCoord, task.zCoord,
                           task.zOrient, task.stayTime
            ).then( (t) => {
                console.log("TESTS: " + index + " " + t);
                return triggerTest(index + 1);
            }).catch( (err) => {
                console.log(err.message);
            });
        }, 20*1000);
    }
};
// ************************************************************************* //