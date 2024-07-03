"use strict"


var states = {}
var game = null
var view = null



exports.scenarios = [
	"1",
    "SCENARIO Nº2 - ASSAULT ON LIEGE",
    "SCENARIO Nº3 - STRONG ATTACK ON NAMUR",
    "SCENARIO Nº4 - AROUND THE MARSHES OF SAINT-GOND",
    "SCENARIO Nº5 - THE SIEGE OF FORTRESS MAUBEUGE",
]

exports.roles = [
	"German",
	"Allied",
]

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
		log: [],
		undo: [],
	}
    // TODO тут надо накрутить обработку сценариев. 
    
	game.state = 'new_game'

	//start_campaign()
	logbr()
	log("новая игра")
	console.log('exports.setup прошли: ')
	return game
}



///UNIT STATE 

const UNIT_HEX_SHIFT = 0
const UNIT_HEX_MASK = 255 << UNIT_HEX_SHIFT

function unit_hex(u) {
	return (game.units[u] & UNIT_HEX_MASK) >> UNIT_HEX_SHIFT
}

function set_unit_hex(u, x) {
	invalidate_caches()
	game.units[u] = (game.units[u] & ~UNIT_HEX_MASK) | (x << UNIT_HEX_SHIFT)
}







function logbr() {
	if (game.log.length > 0 && game.log[game.log.length-1] !== "")
		game.log.push("")
}

function log(s) {
	game.log.push(s)
}

