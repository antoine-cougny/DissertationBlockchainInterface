/*
 * This file will trigger a sequence of auctions to test the deplyment of the robots
 */
var deployTest = {};

deployTest.Task = function (name, reward, xCoord, yCoord, zCoord, zOrient, stayTime)
{
    this.name = name;
    this.reward = reward;
    this.xCoord = xCoord;
    this.yCoord = yCoord;
    this.zCoord = zCoord;
    this.zOrient = zOrient;
    this.staytime = stayTime;
}

deployTest.Task.prototype.startTask = function()
{
    auctionNewTask(this.name, this.reward, this.xCoord, this.yCoord, this.zCoord, this.zOrient, this.startTime);
}

deployTest.arrayTask = {};
deployTest.index = 0, deployTest.nbTest = 0;

deployTest.initArray = function() {
    deployTest.arrayTask[0] = new deployTest.Task("auto_test_0", 150,  0,  0, 0, 0, 15);
    deployTest.arrayTask[1] = new deployTest.Task("auto_test_1", 150, -1, -1, 0, 0,  9);
    deployTest.arrayTask[2] = new deployTest.Task("auto_test_2", 150,  3,0.5, 0, 0,  5);
    deployTest.arrayTask[3] = new deployTest.Task("auto_test_3", 150,  1,  0, 0, 0, 11);
    deployTest.arrayTask[4] = new deployTest.Task("auto_test_4", 150,  2,0.5, 0, 0, 30);
    deployTest.arrayTask[5] = new deployTest.Task("auto_test_5", 150, -1,  0, 0, 0,  8);
    deployTest.arrayTask[6] = new deployTest.Task("auto_test_6", 150,  0,  1, 0, 0,  4);
    deployTest.arrayTask[7] = new deployTest.Task("auto_test_7", 150,  5,  0, 0, 0,  7);
    deployTest.arrayTask[8] = new deployTest.Task("auto_test_8", 150,  2,  3, 0, 0,  8);
    deployTest.arrayTask[9] = new deployTest.Task("auto_test_9", 150, -5,  1, 0, 0, 15);
    
    deployTest.nbTest = 10;
};


deployTest.triggerTest = function (index) {
    if (index == deployTest.nbTest)
    {
        console.log("TESTS: Done!");
        return true;
    }
    else
    {
        setTimeout(function() {
            console.log("Launching task " + index);
            deployTest.arrayTask[index].startTask().then( () => {
                deployTest.triggerTest(index + 1);
            });
        }, 5000);
    }
};

module.exports = deployTest;