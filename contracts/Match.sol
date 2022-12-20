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

    enum Hand {
        ROCK,
        PAPER,
        SCISSORS
    }

    constructor(uint8 startingHand) payable {
        require(msg.value > 0, "Wager must be greater than 0");
        require(
            startingHand == uint8(Hand.ROCK) ||
                startingHand == uint8(Hand.PAPER) ||
                startingHand == uint8(Hand.SCISSORS),
            "Invalid starting hand"
        );
        player1 = payable(msg.sender);
        player1Hand = startingHand;
        totalwagedAmount = msg.value;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function play(uint8 hand) external payable {
        require(msg.sender != player1, "Player 1 cannot play");
        require(
            hand == uint8(Hand.ROCK) ||
                hand == uint8(Hand.PAPER) ||
                hand == uint8(Hand.SCISSORS),
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
            (player1Hand == uint8(Hand.ROCK) &&
                player2Hand == uint8(Hand.SCISSORS)) ||
            (player1Hand == uint8(Hand.PAPER) &&
                player2Hand == uint8(Hand.ROCK)) ||
            (player1Hand == uint8(Hand.SCISSORS) &&
                player2Hand == uint8(Hand.PAPER))
        ) {
            winner = player1;
        } else {
            winner = payable(msg.sender);
        }
        bool sent = winner.send(totalwagedAmount);
        require(sent, "Failed to send Ether");
    }
}
