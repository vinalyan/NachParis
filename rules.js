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

// SETUP

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		log: [],
		undo: [],

		state: null,
		active: null,
		GT: 0,

	}
    // TODO тут надо накрутить обработку сценариев. 
    
    if (scenario === "1")
		setup_game()
	else
		throw new Error("Unknown scenario:", scenario)

	// start_campaign()
    
	return game
}

function setup_game() {
    throw new Error("Завелось:", scenario)
}