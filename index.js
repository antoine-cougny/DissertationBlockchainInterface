//import $ from 'jquery';
var $ = require('jquery');
//import Web3 from 'web3';
var Web3 = require('web3');
var THREE = require('three');
var truffle_contract = require('truffle-contract');

var contracts = {};
var myToken = null;
const nullAddress = "0x0000000000000000000000000000000000000000";
// Instance Web3 using localhost testrpc
var web3Provider;

var initWeb3 = function()
{
    if (typeof web3 !== 'undefined')
    {
        web3Provider = web3.currentProvider;
        console.log('Connected with Metamask');
    }
    else
    {
        // If no injected web3 instance is detected, fall back to Ganache
        web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        console.log('Direct connection to Ganache');
    }
    // Create the web3 instance
    web3 = new Web3(web3Provider);
}

// Connecting to ROS 
var ROSLIB = require('roslib');

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});


// If there is an error on the backend, an 'error' emit will be emitted.
ros.on('error', function(error) {
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('error').style.display = 'inline';
    console.log('Error connecting to websocket server: ', error);
});

// Find out exactly when we made a connection.
ros.on('connection', function() {
    console.log('Connected to websocket server.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('connected').style.display = 'inline';
    // Monitor incomming transaction every second
    // Ugly solution
    checkTransaction();
});

ros.on('close', function() {
    console.log('Connection closed.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'inline';
});


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

var initContract = function(){
    $.getJSON('build/contracts/taskToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var taskArtifact = data;
      contracts.taskToken = TruffleContract(taskArtifact);

      // Set the provider for our contract
      contracts.taskToken.setProvider(web3Provider);
      
      // Use our contract to retrieve and mark the adopted pets
      //return App.markAdopted();
    });
};

// CP-CV
// We will use this function to show the status of our accounts, their balances and amount of tokens
const synchAccounts = () => {
  $('#default-account').html(`<b>Default Account: ${web3.eth.defaultAccount}</b>`);
  $('#accounts').html("");
  web3.eth.accounts.forEach(account => {
    let balance = web3.eth.getBalance(account);
    if (myToken) {
      myToken.balanceOf(account).then(tokens => {
        $('#accounts').append(`<p><a href="#" class="sell">sell</a> <a href="#" class="buy">buy</a> <span class="address">${account}</span> | <span class="balance">ETH ${balance}</span> | <span class="balance">Tokens ${tokens}</span></p>`);
      }).catch(showError);
    } else {
      $('#accounts').append(`<p><!--<a href="#" class="deploy">Deploy MyToken</a>--> <span class="address">${account}</span> | <span class="balance">ETH ${balance}</span></p>`);
    }
  });
};

// Calling a service
// -----------------
var sendTaskToTrader_srvC = new ROSLIB.Service({
    ros : ros,
    name : 'taskToTrade',
    serviceType : 'trader/taskToTrade'
});

// Every time we click on the create button, we will send a new task
$('#createPoint').click(() => {

    // Get the orientation
    var beta = 0; var gamma = 0; var alpha = $('#orientation').val;
    var x_radian = ((beta + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var y_radian = ((gamma + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var z_radian = ((alpha + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var eurlerpose = new THREE.Euler(x_radian, y_radian, z_radian);
    var quaternionpose = new THREE.Quaternion;
    quaternionpose.setFromEuler(eurlerpose);



    // TODO CREATE TASK ON BLOCKCHAIN HERE to get id

    // Custom message
    var userTask = new ROSLIB.Message({
        id : $('#task-name').val(), // To be generated
        name : $('#task-name').val(),
        reward : parseFloat($('#reward-value').val()),
        goalPosition_p : {
            position : {
                x : parseFloat($('#xCoord').val()),
                y : parseFloat($('#yCoord').val()),
                z : parseFloat($('#zCoord').val())
            },
            orientation : {
                x : quaternionpose.x,
                y : quaternionpose.y,
                z : quaternionpose.z,
                w : quaternionpose.w
            }
        },
        toDo : {
            waitTime : parseFloat($('#stay-time').val())
        }
    });
    console.log("Created custom service message for task: " + userTask.name);




    // Create a service request
    var request = new ROSLIB.ServiceRequest({
        task: userTask
    });

    // Call the service
    sendTaskToTrader_srvC.callService(request, function(result) {
        console.log('Result for service call on '
          + sendTaskToTrader_srvC.name
          + ': '
          + result.auctionReady);
    });
});

// Advertising a Service
// ---------------------
// traderNode will contact this server to record a transaction on the blockchain
var idTask = "",
    idBuyer = "",
    idSeller = ""
    isTransactionAvailable = false;
     
// The Service object does double duty for both calling and advertising services
var deployTransactionBC = new ROSLIB.Service({
    ros : ros,
    name : '/deployTransactionBC',
    serviceType : 'blockchain_handler/transactionBC'
});

// Use the advertise() method to indicate that we want to provide this service
deployTransactionBC.advertise(function(request, response) {
    console.log('Received service request on ' + deployTransactionBC.name 
                + ': \n' + request.idTask + " : " + request.idSeller 
                + " => " + request.idBuyer);
    if (!isTransactionAvailable)
    {
        console.log("We accept to process the incomming transaction");
        response['status'] = true;
        idTask = request.idTask;
        idBuyer = request.idBuyer;
        idSeller = request.idSeller;
        isTransactionAvailable = true;
    }
    else
    {
        console.warn("The node is already busy, " 
                    + "we declined the incomming transaction");
        response['status'] = false;
    }
    return true;
});

// Used to contact the eth node to make the transfer
/*var deployTransaction = function() {
    isTransactionAvailable = false;
    console.log("called");

    var taskInstance;

    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.log(error);
        }
        contracts.taskToken.deployed().then(function(instance) {
            taskInstance = instance;
            // First account is computer, we create a new task then
            if (idSeller = account[0])
            {
                taskInstance.mint(idTask, nameTask, info, {from: idSeller})
            }
            else // Transfer task
            {
            }
    
    return;
};*/


// Init functions
// --------------
initWeb3();
initContract();
//console.log(contracts);
synchAccounts();

