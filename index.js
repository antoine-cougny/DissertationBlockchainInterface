//import $ from 'jquery';
var $ = require('jquery');
//import Web3 from 'web3';
var Web3 = require('web3');
var THREE = require('three');

// Instance Web3 using localhost testrpc
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));

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

    // Custom message
    var userTask = new ROSLIB.Message({
        id : "blabla", // To be generated
        name : $('#task-name').val(),
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


var deployTransaction = function() {
    isTransactionAvailable = false;
    console.log("called");
    return;
};
