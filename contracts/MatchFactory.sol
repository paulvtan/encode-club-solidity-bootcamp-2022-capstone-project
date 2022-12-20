// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import {Match} from "./Match.sol";

contract MatchFactory is Ownable {
    event MatchCreated(address matchAddress, address player1);
    enum Hand {
        ROCK,
        PAPER,
        SCISSORS
    }

    constructor() {}

    function launchMatch(uint8 startingHand) external payable {
        require(
            startingHand == uint8(Hand.ROCK) ||
                startingHand == uint8(Hand.PAPER) ||
                startingHand == uint8(Hand.SCISSORS),
            "Invalid starting hand"
        );
        require(msg.value > 0, "Waged amount must be greater than 0");
        address matchAddress = address(new Match(startingHand));
        emit MatchCreated(matchAddress, msg.sender);
    }
}
