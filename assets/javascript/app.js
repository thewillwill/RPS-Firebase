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

var rpsChoices = "<ul><li>Rock</li><li>Paper</li><li>Scissors</li></ul>";



// ------------------------------------
// Game Data - Changes
// ------------------------------------

var playersRef = database.ref("/players");
var gameDataRef = database.ref("/gameData");

// ------------------------------------
// Things to Initialise when Page loads
// ------------------------------------
$("#waiting").hide();

// At page load and subsequent value changes, get a snapshot of the players data.
playersRef.orderByKey().on("value", function(snapshot) {

        console.log('--->change to value of players data');
        //check if firebase has a num players
        console.log('SnapshotExists: ', snapshot.exists())
        if (snapshot.exists()) {
            numPlayers = snapshot.numChildren();
            console.log('numPlayers from database: ', numPlayers);
        }
        //firebase doesn't have a value for num players use default
        else {
            //display message that game in progress
            numPlayers = initialNumPlayers;
            console.log('XX No value in DB, setting numPlayers: ', numPlayers)
        }

        $("#num-players").text(numPlayers);

        if (numPlayers === 0) {
            //start or restart the game
            restartGame();
        } else if (numPlayers === 1 && !gameStarted) {

            for (var key in snapshot.val()) {
                console.log("snapshot key" + key);
                firstPlayerName = snapshot.val()[key].name;

            }
            // var firstPlayerName = (snapshot.child("1").val().name);
            // // console.log('firstPlayer', firstPlayerName);
            $("#player1").text(firstPlayerName);

            //if this is the first player set there player ID
            if (playerNumber === 1) {
                //set unique id (timestamp)
                for (var key in snapshot.val()) {
                    playerID = key;
                    console.log('playerID', playerID)

                }
            }

        //There is 2 players, so the game has started or can start
        } else if (numPlayers === 2) {

            gameStarted = database.ref("/gameData/gameStarted").val;
            console.log('gameStarted', gameStarted);
            //if the game has started
            if (gameStarted) {
                //if this user is player 1
                if (playerNumber === 1) {
                    //display the buttons to choose Rock, Paper or Scissors
                    $("#player1-choices").innerHTML(rpsChoices);
                }
            }

            for (var key in snapshot.val()) {
                console.log("snapshot key" + key);
                secondPlayerName = snapshot.val()[key].name;
            }
            // var secondPlayerName = snapshot.child("2").val().name;
            // console.log('secondPlayerName', secondPlayerName);
            $("#player2").text(secondPlayerName);


            //if this is the second player set there player ID
            if (playerNumber === 2) {
                //set unique id (timestamp)
                for (var key in snapshot.val()) {
                    playerID = key;
                    console.log('playerID', playerID)
                }
            }
            //check if user is NOT a player in the game 
            if (playerNumber === -1) {
                console.log('renderGameInProgress')
                renderGameInProgress();
                return; //exit out of this code block
            }
            //START the game
            renderGameStartedMessage();
            gameStarted = true;
            database.ref("/gameData/gameStarted").set(gameStarted);

        } else if (numPlayers === 1 && gameStarted) {
            //A player has left the game
            //inform remaining player
            gameStarted = false;
            database.ref("/gameData/gameStarted").set(gameStarted);
            //set the remaining users playerNumber back to -1;
            removePlayer();

            opponentRemoved();

        }


    },
    function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });


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

}


function opponentRemoved() {
    console.log('L194 - opponentRemoved()')
    $("#message1").text("game had to be restarted, player left");


    console.log('L205: removing remaining player??');
    database.ref("players/").remove(); // remove the remaining player from the players database
    $("#name-form").show();
    $("#player1").empty();
    $("#player2").empty();
}



function restartGame() {
    $("#message1").text("Enter your name to start, then wait for an opponent");
    $("#name-form").show();
    $("#player1").empty;
    $("#player2").empty;
}

// function increaseNumPlayers() {
//     //increase the local variable by one
//     numPlayers++;
//     //update the database variable
//     gameDataRef.set({
//         numPlayers: numPlayers
//     });
// }

// Rendering Functions
// ------------------------------------

function renderWaitingMessage() {
    $("#message1").text("waiting for player to join");
    $("#waiting").show();
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