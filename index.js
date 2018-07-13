var $ = require('jquery');
var Web3 = require('web3');
var THREE = require('three');
var truffle_contract = require('truffle-contract');
var ROSLIB = require('roslib');

var contracts = {};
var myToken = null;
const nullAddress = "0x0000000000000000000000000000000000000000";
// Instance Web3 using localhost testrpc
var web3Provider;
// Number of deployed token on the network
var numberOfTasks = 0;

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
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var taskArtifact = data;
      contracts.taskToken = TruffleContract(taskArtifact);

      // Set the provider for our contract
      contracts.taskToken.setProvider(web3Provider);
      console.log("INITC: ABI has been read.");
      
      contracts.taskToken.deployed().then(function(instance) {
         myToken = instance;
      });

      // Use our contract to get the number of tasks already on the network
      return getNumberOfTokenMinted();
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
    // Monitor incomming transaction every second
    // Ugly solution
    checkTransaction();
    checkTransactionTaskDone();
});

ros.on('close', function() {
    console.log('CONNECTION: ROS connection closed.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'inline';
});

/*
 * Ugly workaround / quickpatch to check if we received a transaction
 * request or a task to mark as done.
 * The purpose of these is to make the service server respond faster
 * 
 * IDEA: use actionlib server instead to interact with the bc_handler node?
 */
var checkTransaction = function() {
    if (!isTransactionAvailable)
    {
        setTimeout(checkTransaction, 1000);
        return;
    }
    else
    {
        deployTransaction();
    }
};

var checkTransactionTaskDone = function() {
    if (!markTransactionDoneAvailable)
    {
        setTimeout(checkTransactionTaskDone, 1000);
        return;
    }
    else
    {
        markTaskDone();
    }
};


// Accounts and Tokens display synchronisation
// -------------------------------------------
// We will use this function to show the status of our accounts, their balances and amount of tokens
const synchAccounts = () => {
    console.log("SYNC_A: Starting");
    $('#default-account').html(`<b>First Account (computer): ${web3.eth.accounts[0]}</b>`);
    $('#accounts').html("");
    synchAccountsRecursively(0);
};

const synchAccountsRecursively = (i) => {
    if (i == web3.eth.accounts.length)
    {
        console.log("SYNC_A: Done");
        return
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
            return synchAccountsRecursively(i+1);
        }).catch(function(err) {
            console.log("SYNC_A: " + err.message)
        });
    }
};

// Same with the different tokens
const synchTokens = () => {
    console.log("SYNC_T: Starting");
    $('#number-tokens').html("");
    $('#number-tokens').append(`<p>Number of tasks deployed: ${numberOfTasks}</p>`);
    $('#tokens').html("");
    synchTokensRecursively(0);
};

const synchTokensRecursively = (i) => {
    if (i == numberOfTasks)
    {
        console.log("SYNC_T: Done");
        return synchAccounts();
    }
    else
    {
        var deployedToken;
        var infoToken;
        deployedToken = myToken.getTask.call(i).then(info => {
            infoToken = info;
            return myToken.ownerOf.call(i)
        }).then(owner => {
            $('#tokens').append(`<p>Id: ${i} | Token Name: ${infoToken[0]} | Token Owner: ${owner} | Task Done: ${infoToken[2]} | Token Info: ${infoToken[1]}</p>`);
            return synchTokensRecursively(i+1);
        }).catch(function(err) {
            console.log("SYNC_T: " + err);
        });
    }
};


// Get number of total tasks on the blockchain
// -------------------------------------------
const getNumberOfTokenMinted = () => {
    contracts.taskToken.deployed().then(function(instance) {
        return instance.totalSupply.call();
    }).then(function(e) {
        numberOfTasks = e.toNumber();
        console.log("NBTOKEN: Number of task tokens on the blockchain: " + numberOfTasks);
        return synchTokens();
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

// Every time we click on the create button, we will send a new task
$('#createPoint').click(() => {
    createNewTask($('#task-name').val(), $('#reward-value').val(),
                  $('#xCoord').val(), $('#yCoord').val(), $('#zCoord').val(),
                  $('#orientation').val, $('#stay-time').val()
    );
});
    
const createNewTask = function(name, reward, xCoord, yCoord, zCoord, zOrient, stayTime) {
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
        console.log("EVENT: Id of the new task: " + numberOfTasks-1);




        // Custom message
        var userTask = new ROSLIB.Message({
            id : numberOfTasks.toString(), // To be generated // Get
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



        // Update the total number of token locally
        //numberOfTasks += 1;
        return getNumberOfTokenMinted();
    }).catch(function(err) {
        // Error function on the minting of the token
        console.log("EVENT: " + err.message);
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
    if (!isTransactionAvailable)
    {
        console.log("nT: We accept to process the incomming transaction");
        response['status'] = true;
        idTask = request.idTask;
        idBuyer = request.idBuyer;
        idSeller = request.idSeller;
        isTransactionAvailable = true;
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

    var taskInstance;
    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.log(error);
        }
        contracts.taskToken.deployed().then(function(instance) {
            taskInstance = instance;
            // Transfer task
            console.log("DT: Transfer initiated");
            return taskInstance.transferFrom(idSeller, idBuyer, idTask, {from: web3.eth.accounts[0], gas: 30000000});
        }).then(function(instance) {
            console.log("DT: Ready for a new transaction");
            isTransactionAvailable = false;
            return synchTokens();
        }).catch(function(err) {
            console.log("DT: " + err.message);
        });
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

    var taskInstance;
    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.log(error);
        }
        contracts.taskToken.deployed().then(function(instance) {
            taskInstance = instance;
            // Transfer task
            return taskInstance.setTaskDone(idTaskDone, {from: web3.eth.accounts[0], gas: 30000000});//{from: idTaskOwner, gas: 30000000});
        }).then(function(instance) {
            console.log("mTD: Task " + idTaskDone + " has been set as done");
            markTransactionDoneAvailable = false;
            return synchTokens();
        }).catch(function(err) {
            console.error("mTD: " + err.message);
            // TODO find a better implementation not to lose the transaction
            markTransactionDoneAvailable = false;
        });
    });
};

markTaskDoneBC.advertise(function(request, response) {
    console.log('mTD: Received service request. Robot ' + request.idSeller
                + ' has finished task ' + request.idTask);
    if (!markTransactionDoneAvailable)
    {
        console.log("mTD: We accept to process the incomming transaction");
        response['status'] = true;
        idTaskDone = request.idTask;
        idTaskOwner = request.idSeller;
        markTransactionDoneAvailable = true;
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
initWeb3();
initContract();
