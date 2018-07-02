// Task Token
pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721BasicToken.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract taskToken is ERC721Token, Ownable {

    // string public constant name = "taskToken";
    // string public constant symbol = "taskT";

    struct taskFull{
        string id;
        string name;

        int xCoord;
        int yCoord;
        int zCoord;

        int xQuat;
        int yQuat;
        int zQuat;
        int wQuat;

        int waitTime;
        bool done;
    }

    taskFull[] public tasksArray;

    constructor() public
        ERC721Token("task token", "taskT"){}
    
    // Get info on a token
    function getTask( uint256 _taskId ) public view returns(string id,
                                                         string nameT,
                                                         int xCoord,
                                                         int yCoord,
                                                         int zCoord,
                                                         int xQuat,
                                                         int yQuat,
                                                         int zQuat,
                                                         int wQuat,
                                                         int waitTime,
                                                         bool  done
                                                        )
    {
        taskFull memory _task = tasksArray[_taskId];

        id = _task.id;
        nameT = _task.name;
        xCoord = _task.xCoord;
        yCoord = _task.yCoord;
        zCoord = _task.zCoord;
        xQuat = _task.xQuat;
        yQuat = _task.yQuat;
        zQuat = _task.zQuat;
        wQuat = _task.wQuat;
        waitTime = _task.waitTime;
        done = _task.done;
    }

    function mint2() public payable {
        mint(msg.id, msg.name, msg.xCoord, msg.yCoord, msg.zCoord, msg.xQuat,
             msg.yQuat, msg.zQuat, msg.wQuat, msg.waitTime);
    }

    // Create a new token
    function mint(string _id,
                  string _name,
                  int _xCoord,
                  int _yCoord,
                  int _zCoord,
                  int _xQuat,
                  int _yQuat,
                  int _zQuat,
                  int _wQuat,
                  int _waitTime
                 ) public payable
    {
        taskFull memory _task = taskFull({ id:     _id,
                                           name:   _name,
                                           xCoord: _xCoord,
                                           yCoord: _yCoord,
                                           zCoord: _zCoord,
                                           xQuat:  _xQuat,
                                           yQuat:  _yQuat,
                                           zQuat:  _zQuat,
                                           wQuat:  _wQuat,
                                           waitTime: _waitTime,
                                           done: false
        });

        uint _taskId = tasksArray.push(_task) - 1;

        _mint(msg.sender, _taskId);
    }


    // Maybe I will use this later
    // struct taskToDo{
    //     int timeToWait;
    // }

    // struct Position{
    //     int x;
    //     int y;
    //     int z;
    // }

    // struct Orientation{
    //     int x;
    //     int y;
    //     int z;
    //     int w;
    // }

    // struct  Pose{
    //     Position position;
    //     Orientation orientation;
    // }

    // struct task{
    //     string id;
    //     string name;
    //     Pose goalPosition_p;
    //     taskToDo toDo;
    //     bool done;
    // }
}
