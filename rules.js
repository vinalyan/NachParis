"use strict"


var states = {}
var game = null
var view = null

const GERMAN = 'German'
const ALLIED = 'Allied'
const TIMEOUT = 250
var timeout = 0



// === STATE CACHES ===

function update_aliases() {
	if (game.active === GERMAN) {
		console.log(GERMAN)
	} else {
		console.log(ALLIED)		
	}
}


function invalidate_caches() {
//	presence_invalid = true
//	supply_axis_invalid = true
//	supply_allied_invalid = true
}

function load_state(state) {
	if (game !== state) {
		game = state
		invalidate_caches()
		update_aliases()
	}
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

function logbr() {
	if (game.log.length > 0 && game.log[game.log.length-1] !== "")
		game.log.push("")
}

function set_active_player() {
//	clear_undo()
	if (game.active !== game.phasing) {
		game.active = game.phasing
//		update_aliases()
	}
}

// === PUBLIC FUNCTIONS ===

exports.scenarios = [
	"SCENARIO Nº1 - VICTORIOUS RECOVERY AT GUISE",
    "SCENARIO Nº2 - ASSAULT ON LIEGE",
    "SCENARIO Nº3 - STRONG ATTACK ON NAMUR",
    "SCENARIO Nº4 - AROUND THE MARSHES OF SAINT-GOND",
    "SCENARIO Nº5 - THE SIEGE OF FORTRESS MAUBEUGE",
]

exports.roles = [
	"German",
	"Allied",
]


exports.setup = function (seed, scenario, options) {
	load_state({
		seed: seed,
		GT: 0,
		state: null,
		log: [],
		undo: [],
		summary: null,
		scenario: scenario,
	})
    // TODO тут надо накрутить обработку сценариев. 
	setup(scenario)
	return game
}

exports.view = function(state, current) {
	timeout = Date.now() + TIMEOUT // don't think too long!
	load_state(state)

	let scenario = current_scenario()

	view = {
		start: scenario.start,
		end: scenario.end,
		units: game.units,
	} 

	return common_view(current)
}


//COMMON TEMOLATES

function common_view(current) {
	view.log = game.log
	return view
}

function log_br() {
	if (game.log.length > 0 && game.log[game.log.length-1] !== "")
		game.log.push("")
}

function log(msg) {
	game.log.push(msg)
}

function log_h1(msg) {
	log_br()
	log(".h1 " + msg)
	log_br()
}

function log_h2(msg) {
	log_br()
	log(".h2 " + msg)
	log_br()
}

function log_h3(msg) {
	log_br()
	log(".h3 " + msg)
	log_br()
}

function log_h4(msg) {
	log_br()
	log(".h4 " + msg)
}

//SETUP

const SCENARIOS = {
	"SCENARIO Nº1 - VICTORIOUS RECOVERY AT GUISE": {
		start: 13,
		end: 15,
	},
	"SCENARIO Nº2 - ASSAULT ON LIEGE": {
		start: 13,
		end: 15,
	},
}

function setup(scenario_name) {
	let scenario = SCENARIOS[scenario_name]

	log_h1(scenario_name)


//	SETUP[scenario_name]()

//	game.phasing = ALLIED
	set_active_player()
}



function current_scenario() {
	return SCENARIOS[game.scenario]
}