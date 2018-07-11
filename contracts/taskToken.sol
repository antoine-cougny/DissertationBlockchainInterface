// Task Token
pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721BasicToken.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract taskToken is ERC721Token, Ownable {

    // string public constant name = "taskToken";
    // string public constant symbol = "taskT";

    struct taskFull{
        string name;

        string info;
        bool done;
    }

    taskFull[] public tasksArray;

    // Constructor of the token
    // constructor(string _name, string _symbol) public
    //     ERC721Token(_name, _symbol){}
    constructor() public
        ERC721Token("taskToken", "T_T"){}
    
    // Get info on a token
    function getTask( uint256 _taskId ) public view returns(string nameT,
                                                            string info, 
                                                            bool  done
                                                           )
    {
        taskFull memory _task = tasksArray[_taskId];

        nameT = _task.name;
        info = _task.info;
        done = _task.done;
    }
    
    function setTaskDone( uint _taskId ) public payable
    {
        require( msg.sender == ownerOf(_taskId) || msg.sender == owner);
        taskFull storage _task = tasksArray[_taskId];
        _task.done = true;
    }

    // Create a new token
    function mint(string _name,
                  string _info
                 ) public payable returns (uint _taskId)
    {
        taskFull memory _task = taskFull({ name: _name,
                                           info: _info,
                                           done: false
                                         });

        _taskId = tasksArray.push(_task) - 1;

        _mint(msg.sender, _taskId);
    }
}
