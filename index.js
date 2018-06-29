//import $ from 'jquery';
var $ = require('jquery');
//import Web3 from 'web3';
var Web3 = require('web3');

// Instance Web3 using localhost testrpc
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));

// Connecting to ROS 
var ROSLIB = require('roslib');

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

ros.on('connection', function() {
console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
console.log('Connection to websocket server closed.');
});
