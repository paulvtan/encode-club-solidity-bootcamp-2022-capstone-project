// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {MatchFactory} from "./MatchFactory.sol";

contract Match {
    uint256 totalwagedAmount;
    uint8 player1Hand;
    uint8 player2Hand;
    address payable player1;
    address payable player2;
    address payable winner;

    constructor(uint8 startingHand) payable {
        require(msg.value > 0, "Waged amount must be greater than 0");
        player1 = payable(msg.sender);
        player1Hand = startingHand;
        totalwagedAmount = msg.value;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function play(uint8 hand) external payable {
        require(
            hand == uint8(MatchFactory.Hand.ROCK) ||
                hand == uint8(MatchFactory.Hand.PAPER) ||
                hand == uint8(MatchFactory.Hand.SCISSORS),
            "Invalid hand"
        );
        require(
            msg.value == totalwagedAmount,
            "Waged amount must be equal to player1 waged amount"
        );
        totalwagedAmount += msg.value;
        player2Hand = hand;
        if (player1Hand == player2Hand) {
            bool p1Sent = player1.send(totalwagedAmount / 2);
            bool p2Sent = player2.send(totalwagedAmount / 2);
            require(p1Sent, "Failed to send Ether");
            require(p2Sent, "Failed to send Ether");
        } else if (
            (player1Hand == uint8(MatchFactory.Hand.ROCK) &&
                player2Hand == uint8(MatchFactory.Hand.SCISSORS)) ||
            (player1Hand == uint8(MatchFactory.Hand.PAPER) &&
                player2Hand == uint8(MatchFactory.Hand.ROCK)) ||
            (player1Hand == uint8(MatchFactory.Hand.SCISSORS) &&
                player2Hand == uint8(MatchFactory.Hand.PAPER))
        ) {
            winner = player1;
        } else {
            winner = payable(msg.sender);
        }
        bool sent = winner.send(totalwagedAmount);
        require(sent, "Failed to send Ether");
    }
}
