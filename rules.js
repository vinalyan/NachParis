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


// SETUP

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		GT: 0,
		state: null,
	}
    // TODO тут надо накрутить обработку сценариев. 
    

	// start_campaign()
    
	return game
}
