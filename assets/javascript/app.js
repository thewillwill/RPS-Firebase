// Initialize Firebase
var config = {
    apiKey: "AIzaSyAm8XpQZ5YCjaiotu3iA3B3VcU63L3JArI",
    authDomain: "rock-paper-scissors-376b2.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-376b2.firebaseio.com",
    projectId: "rock-paper-scissors-376b2",
    storageBucket: "rock-paper-scissors-376b2.appspot.com",
    messagingSenderId: "1022433434347"
};
firebase.initializeApp(config);
var database = firebase.database();

// ------------------------------------
// CONNECTIONS
// ------------------------------------

var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {

    if (snap.val()) {
        // Add user to the connections list.
        var connectionsList = connectionsRef.push(true);
        // Remove user from the connection list when they disconnect.
        //https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect
        connectionsList.onDisconnect().remove();
        // gameData.onDisconnect().set(1);
    }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {
    // Display the viewer count in the html.
    $("#watchers").text(snap.numChildren());

});

// ------------------------------------
// Initial Values
// ------------------------------------
var initialNumPlayers = 0;
var numPlayers;
var playerNumber = -1; //store the player number to check if they are in the game
var gameStarted = false;;
var playerID;
var initialTurn = 1;
var turn;

var firstPlayerChoice;
var secondPlayerChoice;

var wins = 0;
var losses = 0;
var ties = 0;


var playerOneButtons = "<button class='player1-choice' data-choice='rock'>Rock</button><button class='player1-choice' data-choice='paper'>Paper</button><button class='player1-choice' data-choice='scissors'>Scissors</button>";
var playerTwoButtons = "<button class='player2-choice' data-choice='rock'>Rock</button><button class='player2-choice' data-choice='paper'>Paper</button><button class='player2-choice' data-choice='scissors'>Scissors</button>";


// ------------------------------------
// Things to do when Page loads
// ------------------------------------
$("#waiting").hide();



// ------------------------------------
// Player Data - Changes
// ------------------------------------
var playersRef = database.ref("/players");

// At page load and subsequent value changes, get a snapshot of the players data.
playersRef.orderByKey().on("value", function(snapshot) {

        //check if firebase has a num players
        //console.log('SnapshotExists: ', snapshot.exists())
        if (snapshot.exists()) {
            numPlayers = snapshot.numChildren();
            console.log('numPlayers from database: ', numPlayers);
        }
        //firebase doesn't have a value for num players use default
        else {
            //display message that game in progress
            numPlayers = initialNumPlayers;
            console.log('XX No value in DB, set numPlayers to: ', numPlayers)
        }

        //FOR TESTING
        $("#num-players").text(numPlayers);

        //check if there is any players
        if (numPlayers === 0) {
            //start or restart the game
            restartGame(false);

            //If there is 1 player    
        } else if (numPlayers === 1) {

            //check if the game has NOT started
            if (!gameStarted) {
                for (var key in snapshot.val()) {
                    //console.log("snapshot key" + key);
                    firstPlayerName = snapshot.val()[key].name;
                }
                // var firstPlayerName = (snapshot.child("1").val().name);
                // // console.log('firstPlayer', firstPlayerName);
                $("#player1").text(firstPlayerName);

                // if this is the first player set there player ID
                if (playerNumber === 1) {
                    //set unique id (timestamp)
                    for (var key in snapshot.val()) {
                        playerID = key;
                        console.log('playerID', playerID)

                        //store player one ID in gameData
                        database.ref("/gameData/playerOneID").set(key);

                    }
                }
            }

            //there is only one player and the game has started
            else {
                //A player has left, restart the gamer            
                gameStarted = false;
                database.ref("/gameData/gameStarted").set(gameStarted);

                //set the remaining users playerNumber back to -1;
                removePlayer();

                //restart the game with a message to the remaining player
                restartGame(true);

            }
            //There is 2 players, so the game has started or can start
        } else if (numPlayers === 2) {

            if (!gameStarted) {

                for (var key in snapshot.val()) {
                    console.log("snapshot key" + key);
                    secondPlayerName = snapshot.val()[key].name;
                    secondPlayerChoice = snapshot.val()[key].choice;
                }
                // var secondPlayerName = snapshot.child("2").val().name;
                // console.log('secondPlayerName', secondPlayerName);
                $("#player2").text(secondPlayerName);


                // if this is the second player set there player ID
                if (playerNumber === 2) {
                    //set unique id (timestamp)
                    for (var key in snapshot.val()) {
                        playerID = key;
                        console.log('playerID', playerID)
                        //store player one ID in gameData
                        database.ref("/gameData/playerTwoID").set(key);
                    }
                }
                //check if user is NOT a player in the game 
                if (playerNumber === -1) {
                    console.log('renderGameStartedMessageInProgress')
                    renderGameInProgress();
                    return; //exit out of this code block
                }
                //START the game
                renderGameStartedMessage();
                gameStarted = true;

                console.log('L144: setting game started in DB')
                database.ref("/gameData/gameStarted").set(gameStarted);
            }

            //game started
            else {
                if (playerNumber != -1) {

                    if (turn === 1) {
                        var i = 0;

                        //apologies for the shit code below, I couldn't figure out how to get the first value easily
                        for (var key in snapshot.val()) {
                            //console.log("snapshot key" + key);
                            i++;
                            if (i === 1) {
                                firstPlayerChoice = snapshot.val()[key].choice;
                                console.log('firstPlayerChoice', firstPlayerChoice, i)
                            }

                        }
                    }

                    else if (turn === 2) {
                        var i = 0;

                        //apologies for the shit code below, I couldn't figure out how to get the second value easily
                        for (var key in snapshot.val()) {
                            //console.log("snapshot key" + key);
                            i++;
                            if (i === 2) {
                                secondPlayerChoice = snapshot.val()[key].choice;
                                console.log('secondPlayerChoice', secondPlayerChoice, i)
                            }

                        }
                    }
                    else if (turn === 3) {
                        debugger;
                        wins = snapshot.val()[key].wins;
                        losses = snapshot.val()[key].losses;
                        ties = snapshot.val()[key].ties;

                    }

                }
            }
        }
    },
    function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

// ------------------------------------
// Game Data Listeners
// ------------------------------------

// Listener for - gameData Object 
// ------------------------------------
var gameDataRef = database.ref("/gameData");

gameDataRef.on("value", function(snapshot) {
        console.log('--->change to value of gameData object');

        for (var key in snapshot.val()) {
            //console.log("snapshot key" + key);
            gameStarted = snapshot.val().gameStarted;
            //console.log('gameStarted from DB', gameStarted)
        }

        //check if the game is started
        if (gameStarted && playerNumber != -1) {

            //check if the user is player 1 and it is their turn
            if (playerNumber === 1) {
                if (turn === 1) {
                    console.log("render player1 buttons");
                    $("#player1-choices").html(playerOneButtons);
                } else if (turn === 2) {
                    renderWaitingOpponentMove();
                }
            } else if (playerNumber === 2) {
                if (turn === 1) {
                    renderWaitingOpponentMove();
                } else if (turn === 2) {
                    renderYourTurn();
                    console.log("render player2 buttons");
                    $("#player2-choices").html(playerTwoButtons);
                }
            }
        }
        //both players have chosen
        if (turn === 3) {
            calculateResult();
            startNewRound();
        }


    },
    function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });


// Listener for - Turn Object 
// ------------------------------------

var turnRef = database.ref("/gameData/turn");
turnRef.on("value", function(snapshot) {

        console.log('--->change to value of turn object');
        turn = snapshot.val();
        console.log('turn: ', turn)

    },
    function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });



// ------------------------------------
// on Click Functions
// ------------------------------------


// This function handles events where a player submits there name
$("#player-start").on("click", function(event) {

    event.preventDefault()

    var playerName = $("#player-name").val().trim();
    console.log('playerName', playerName);
    $("#name-form").hide();

    var currentNumPlayers = numPlayers;
    console.log('currentNumPlayers', currentNumPlayers)

    if (numPlayers === 0) {
        //can join game;
        addPlayer(playerName);
        renderWaitingMessage();

    } else if (numPlayers === 1) {
        //we now have 2 players so set game to started
        database.ref("/gameData/gameStarted").set(gameStarted);
        //add the second player to the database
        addPlayer(playerName);

        //we have 2 players
    } else {

        //game already in progress
    }
});

//listener for player 1 Rock Paper or Scissors button click
// ------------------------------------
$(document).on("click", ".player1-choice", function(event) {
    //get the value of the button clicked
    var playerOneChoice = $(this).attr("data-choice")
    console.log("Player 1 ID: " + playerID + " >--" + playerOneChoice + "--<");

    //save the choice to the database
    database.ref("/players/" + playerID + "/choice").set(playerOneChoice);
    turn = turn + 1;
    console.log('NEW turn value: ', turn)
    database.ref("/gameData/turn").set(turn);
    //don't display the buttons any longer
    $("#player1-choices").hide();
});

//listener for player 2 Rock Paper or Scissors button click
// ------------------------------------
$(document).on("click", ".player2-choice", function(event) {
    //get the value of the button clicked
    var playerTwoChoice = $(this).attr("data-choice")
    console.log("Player 2 >--" + playerTwoChoice + "<--");

    //save the choice to the database
    database.ref("/players/" + playerID + "/choice").set(playerTwoChoice);
    turn = turn + 1;
    database.ref("/gameData/turn").set(turn);
    //don't display the buttons any longer
    $("#player2-choices").hide();
});




// ------------------------------------
// Helper Functions
// ------------------------------------


function addPlayer(playerName) {

    console.log('addPlayer()');
    playerNumber = numPlayers + 1;
    console.log('Set the playerNumber???:', playerNumber)
    // Code for the push
    var playersList = database.ref("players/").push({
        name: playerName,
        timeStamp: firebase.database.ServerValue.TIMESTAMP,
    });
    console.log('playersList', playersList);
    playersList.onDisconnect().remove();

}

function removePlayer(playerName) {
    //set player number in database
    playerNumber = -1;
    database.ref("players").set(null); // remove the player from the players object

}


function opponentRemoved() {
    console.log('L194 - opponentRemoved()')
    $("#message1").text("game had to be restarted, player left");

    console.log('L205: removing remaining player??');
    database.ref("players").set(null); // remove the remaining player from the players object
    $("#name-form").show();
    //hide the player names    
    $("#player1").empty();
    $("#player2").empty();
}



function restartGame(opponentLeft) {
    //hide messages and empty html elements from user screen

    if (opponentLeft) {
        $("#message1").text("game had to be restarted, player left");
    } else {
        $("#message1").text("Enter your name to start, then wait for an opponent");
    }

    $("#name-form").show();
    $("#player1").empty;
    $("#player2").empty;
    $("#name-form").show();
    $("#player1-choices").empty();
    $("#player2-choices").empty();

    //clear the active player ID's from the gameData object
    database.ref("/gameData/playerOneID").set(null);
    database.ref("/gameData/playerTwoID").set(null);

    //set game started to false in DB
    gameStarted = false;
    database.ref("/gameData/gameStarted").set(gameStarted);

    //set the turn back to the initial value (1)
    turn = initialTurn;
    database.ref("/gameData/turn").set(turn);

}

function startNewRound() {
    //set the turn back to the initial value (1)
    turn = initialTurn;
    database.ref("/gameData/turn").set(turn);

};


function calculateResult() {

    var firstPlayerWin=0;
    var secondPlayerWin=0;


    if (firstPlayerChoice === secondPlayerChoice) {
        ties++;
        console.log('L447', 'ties:', ties)
    } else if (firstPlayerChoice === 'rock') {
        if (secondPlayerChoice === 'scissors') {
            firstPlayerWin++;
            console.log('L451', 'firstPlayerWin:', firstPlayerWin)
        } else {
            secondPlayerWin++;
            console.log('L454', 'secondPlayerWin:', secondPlayerWin)
        }
    } else if (firstPlayerChoice === 'paper') {
        if (secondPlayerChoice === 'rock') {
            firstPlayerWin++;
            console.log('L459', 'firstPlayerWin:', firstPlayerWin)
        } else {
            secondPlayerWin++;
            console.log('L462', 'secondPlayerWin:', secondPlayerWin)
        }
    } else if (firstPlayerChoice === 'scissors') {
        if (secondPlayerChoice === 'paper') {
            firstPlayerWin++;
            console.log('L467', 'firstPlayerWin:', firstPlayerWin)
        } else {
            secondPlayerWin++;
            console.log('L470', 'secondPlayerWin:', secondPlayerWin)
        }
    }
    
    if (playerNumber === 1 ) {

        wins = wins + firstPlayerWin;
        losses = losses + secondPlayerWin;

        database.ref("/players/" + playerID + "/wins").set(wins);
        database.ref("/players/" + playerID + "/losses").set(losses);
        database.ref("/players/" + playerID + "/ties").set(ties);

        $("#wins").text(firstPlayerWin);
        $("#losses").text(secondPlayerWin);
        $("#ties").text(ties);

        hideWaitingMessage();

    }
    else if (playerNumber === 2 ) {

        wins = wins + secondPlayerWin;
        losses = losses + firstPlayerWin;

        database.ref("/players/" + playerID + "/wins").set(wins);
        database.ref("/players/" + playerID + "/losses").set(losses);
        database.ref("/players/" + playerID + "/ties").set(ties);

        $("#wins").text(secondPlayerWin);
        $("#losses").text(firstPlayerWin);
        $("#ties").text(ties);

        hideWaitingMessage();
    }


}


// Rendering Functions
// ------------------------------------


function renderWaitingMessage() {
    $("#message1").text("waiting for player to join");
    $("#waiting").show();
}

function renderWaitingOpponentMove() {
    $("#message1").text("waiting for opponent to go");
    $("#waiting").show();
}


function renderYourTurn() {
    $("#message1").text("Your Turn.");
    $("#waiting").hide();
}

function renderGameStartedMessage() {
    $("#message1").text("Game Started");
    $("#waiting").hide();
}

function hideWaitingMessage() {
    $("#message1").empty();
    $("#waiting").hide();
}

function renderGameInProgress() {
    $("#message1").text("Game in Progress. You can wait until someone leaves if you like..");
    $("#waiting").show();
    $("#name-form").hide();
    $("#player1").empty;
    $("#player2").empty;
}






//CHAT DATABASE STRUCTURE
// https://firebase.google.com/docs/database/web/structure-data
// {
//   // Chats contains only meta info about each conversation
//   // stored under the chats's unique ID
//   "chats": {
//     "one": {
//       "title": "Historical Tech Pioneers",
//       "lastMessage": "ghopper: Relay malfunction found. Cause: moth.",
//       "timestamp": 1459361875666
//     },
//     "two": { ... },
//     "three": { ... }
//   },

//   // Conversation members are easily accessible
//   // and stored by chat conversation ID
//   "members": {
//     // we'll talk about indices like this below
//     "one": {
//       "ghopper": true,
//       "alovelace": true,
//       "eclarke": true
//     },
//     "two": { ... },
//     "three": { ... }
//   },

//   // Messages are separate from data we may want to iterate quickly
//   // but still easily paginated and queried, and organized by chat
//   // conversation ID
//   "messages": {
//     "one": {
//       "m1": {
//         "name": "eclarke",
//         "message": "The relay seems to be malfunctioning.",
//         "timestamp": 1459361875337
//       },
//       "m2": { ... },
//       "m3": { ... }
//     },
//     "two": { ... },
//     "three": { ... }
//   }
// }



// OLD RPS game below
// var message = document.getElementById("message");
// var winsText = document.getElementById("wins");
// var lossesText = document.getElementById("losses");
// var tiesText = document.getElementById("ties");
// var userIcon = document.getElementById("user-icon");
// var compIcon = document.getElementById("comp-icon");
// var rps = ['r', 'p', 's'];
// var userChoice;
// var compChoice;
// var wins = 0;
// var losses = 0;
// var ties = 0;
// document.onkeyup = function(event)  {

//   userChoice = event.key;
//   compChoice = rps[Math.floor(Math.random() * 3)]; 
//   console.log("user " + userChoice + " comp " + compChoice);
//   if(userChoice == 'r' || userChoice == 'p' || userChoice == 's') {
//     message.textContent = "You pressed " + userChoice;
//     userIcon.innerHTML = "<img src='assets/images/" + userChoice + ".png' height='200px' width='200px'>";
//     compIcon.innerHTML = "<img src='assets/images/" + compChoice + ".png' height='200px' width='200px'>";
//     if(userChoice == compChoice) {
//       ties++;
//     }
//     else if(userChoice == 'r') {
//       if(compChoice == 's') {
//         wins++;
//       }
//       else {
//         losses++;
//       }
//     }
//     else if(userChoice == 'p') {
//       if(compChoice == 'r') {
//         wins++;
//       }
//       else {
//         losses++;
//       }
//     }
//     else if(userChoice == 's') {
//       if(compChoice == 'p') {
//         wins++;
//       }
//       else {
//         losses++;
//       }
//     }
//   }
//   else {
//     message.textContent = "Invalid key";
//   }
//       winsText.textContent = wins;
//       lossesText.textContent = losses;
//       tiesText.textContent = ties;
//       console.log("wins " + wins);
//       console.log("losses " + losses);
//       console.log("ties " + ties);
// }