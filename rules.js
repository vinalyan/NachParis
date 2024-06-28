"use strict"

exports.scenarios = [
	"SCENARIO Nº1 - VICTORIOUS RECOVERY AT GUISE",
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
    /*
    if (scenario === "SCENARIO Nº1 - VICTORIOUS RECOVERY AT GUISE")
		setup_game()
	else if (scenario === "Kingmaker")
		setup_kingmaker()
	else if (scenario === "Richard III")
		setup_richard_iii()
	else
		throw new Error("Unknown scenario:", scenario)

	logbr()
	log(".h1 " + scenario)
	logbr()

	start_campaign()
    */
	return game
}