// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {MatchFactory} from "./MatchFactory.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Match is Ownable {
    address payable public matchFactoryAddressOwner;
    uint256 public totalWagerAmount;
    uint8 player1Hand;
    uint8 player2Hand;
    address payable public player1;
    address payable public player2;
    address payable public winner;

    enum Hand {
        ROCK,
        PAPER,
        SCISSORS
    }

    constructor(address _player1, uint8 startingHand) payable {
        require(msg.value > 0, "Wager must be greater than 0");
        require(
            startingHand == uint8(Hand.ROCK) ||
                startingHand == uint8(Hand.PAPER) ||
                startingHand == uint8(Hand.SCISSORS),
            "Invalid starting hand"
        );
        matchFactoryAddressOwner = payable(msg.sender);
        player1 = payable(_player1);
        player1Hand = startingHand;
        totalWagerAmount = msg.value;
    }

    receive() external payable {}

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function joinMatch(uint8 hand) external payable {
        require(msg.sender != player1, "Match: Player 1 already joined");
        require(winner == address(0), "Match full: Game already finished");
        require(
            hand == uint8(Hand.ROCK) ||
                hand == uint8(Hand.PAPER) ||
                hand == uint8(Hand.SCISSORS),
            "Match: Invalid hand"
        );
        string
            memory ErrorMessage = "Match: Waged amount must be equal to player1 waged amount of ";
        require(
            msg.value == totalWagerAmount,
            string.concat(
                ErrorMessage,
                Strings.toString(totalWagerAmount / 1 ether)
            )
        );
        MatchFactory matchFactoryContract = MatchFactory(
            matchFactoryAddressOwner
        );
        matchFactoryContract.addPlayer(msg.sender, address(this));
        player2 = payable(msg.sender);
        player2Hand = hand;
        totalWagerAmount += msg.value;
        if (player1Hand == player2Hand) {
            bool p1Sent = player1.send(totalWagerAmount / 2);
            bool p2Sent = player2.send(totalWagerAmount / 2);
            require(p1Sent, "Match: Failed to send funds to player 1");
            require(p2Sent, "Match: Failed to send funds to player 2");
            winner = payable(address(0));
        } else if (
            (player1Hand == uint8(Hand.ROCK) &&
                player2Hand == uint8(Hand.SCISSORS)) ||
            (player1Hand == uint8(Hand.PAPER) &&
                player2Hand == uint8(Hand.ROCK)) ||
            (player1Hand == uint8(Hand.SCISSORS) &&
                player2Hand == uint8(Hand.PAPER))
        ) {
            winner = player1;
            bool p1Sent = player1.send(totalWagerAmount);
            require(p1Sent, "Match: Failed to send funds to player 1");
        } else {
            winner = payable(player2);
            bool p2Sent = player2.send(totalWagerAmount);
            require(p2Sent, "Match: Failed to send funds to player 2");
        }
        MatchFactory(matchFactoryAddressOwner).closeActiveMatch(address(this));
    }
}
