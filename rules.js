"use strict"


exports.scenarios = [
	"1",
    "SCENARIO Nº2 - ASSAULT ON LIEGE",
    "SCENARIO Nº3 - STRONG ATTACK ON NAMUR",
    "SCENARIO Nº4 - AROUND THE MARSHES OF SAINT-GOND",
    "SCENARIO Nº5 - THE SIEGE OF FORTRESS MAUBEUGE",
]

exports.roles = [
	"German",
	"Allies",
]

let game = null

function logbr() {
	if (game.log.length > 0 && game.log[game.log.length-1] !== "")
		game.log.push("")
}
// SETUP

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		GT: 0,
		state: null,
	}
    // TODO тут надо накрутить обработку сценариев. 
    
	game.state = 'new_game'

	console.log('Game_state: ' + game.state)
	//start_campaign()
	return game
}

