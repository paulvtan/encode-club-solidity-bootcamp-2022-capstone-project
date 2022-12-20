// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import {Match} from "./Match.sol";

contract MatchFactory is Ownable {
    event MatchCreated(address matchAddress, address player1);
    mapping(address => address[]) public players;

    constructor() {}

    function launchMatch(uint8 startingHand) external payable {
        address matchAddress = address(
            new Match{value: msg.value}(msg.sender, startingHand)
        );
        emit MatchCreated(matchAddress, msg.sender);
        players[msg.sender].push(matchAddress);
    }

    function getMatches() external view returns (address[] memory) {
        return players[msg.sender];
    }

    function getMatchCount() external view returns (uint256) {
        return players[msg.sender].length;
    }

    function getLatestMatch() external view returns (address) {
        return players[msg.sender][players[msg.sender].length - 1];
    }
}
