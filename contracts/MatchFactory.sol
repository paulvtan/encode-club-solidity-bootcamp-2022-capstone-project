// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import {Match} from "./Match.sol";

contract MatchFactory is Ownable {
    event MatchCreated(address matchAddress, address player1);
    mapping(address => address[]) players;
    address[] public activeMatches;

    constructor() {}

    receive() external payable {}

    function launchMatch(uint8 startingHand) external payable {
        require(activeMatches.length < 10, "Max matches reached");
        address matchAddress = address(
            new Match{value: msg.value}(msg.sender, startingHand)
        );
        emit MatchCreated(matchAddress, msg.sender);
        players[msg.sender].push(matchAddress);
        activeMatches.push(matchAddress);
    }

    function closeActiveMatch(address matchAddress) external {
        for (uint256 i = 0; i < activeMatches.length; i++) {
            if (activeMatches[i] == matchAddress) {
                activeMatches[i] = activeMatches[activeMatches.length - 1];
                activeMatches.pop();
                break;
            }
        }
    }

    function addPlayer(address player, address matchAddress) external {
        players[player].push(matchAddress);
    }

    function getActiveMatches() external view returns (address[] memory) {
        return activeMatches;
    }

    function getMatchHistory() external view returns (address[] memory) {
        return players[msg.sender];
    }

    function getMatchCount() external view returns (uint256) {
        return players[msg.sender].length;
    }

    function getLatestMatch() external view returns (address) {
        return players[msg.sender][players[msg.sender].length - 1];
    }
}
