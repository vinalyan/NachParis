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
	clear_undo()
	if (game.active !== game.phasing) {
		game.active = game.phasing
//		update_aliases()
	}
}

function set_passive_player() {
	clear_undo()
	let nonphasing = (game.phasing === GERMAN ? ALLIED : GERMAN)
	if (game.active !== nonphasing) {
		game.active = nonphasing
		update_aliases()
	}
}

function set_enemy_player() {
	if (is_active_player())
		set_passive_player()
	else
		set_active_player()
}

function is_active_player() {
	return game.active === game.phasing
}

function is_passive_player() {
	return game.active !== game.phasing
}

function is_german_player() {
	return game.active === GERMAN
}

function is_allied_player() {
	return game.active === ALLIED
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
		GT: scenario.start,
		state: null,
		log: [],
		undo: [],
		summary: null,
		scenario: scenario,
	})
    // TODO тут надо накрутить обработку сценариев. 
	setup()
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

function gen_action(action, argument) {
	if (argument !== undefined) {
		if (!(action in view.actions)) {
			view.actions[action] = [ argument ]
		} else {
			set_add(view.actions[action], argument)
		}
	} else {
		view.actions[action] = 1
	}
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

function setup() {
	game.phasing = GERMAN
	set_active_player()
	log_h1(game.active)
	goto_admin_phase()
}

function current_scenario() {
	return SCENARIOS[game.scenario]
}

// === PLAYER TURN ===

/*
Каждый ход начинают немцы. 
Если ход заканчивают немцы, то свой ход начинают союзники. 
Если ход заканчивают союзники, то GT меняется на +1.

Каждый ход 4 фазы
Каждая делится на шаги. 
Активный игрок является атакующим
Пассивный обороняющимся.

*/

//===ADMIN PHASE

function goto_admin_phase(){
	log_h2(`Тут будет админская фаза `)
	log_h3(`Тут рассчеты ЖД линий`)

	game.selected = []
	game.summary = {}
	goto_admin_stape_1()
	goto_admin_stape_2()
	goto_admin_stape_3()
	goto_barrage_phase()
}
	//==Admin step 1
function goto_admin_stape_1()
	{
		log_h3(`Шаг 1. Бросок на дождик  `)
		game.state = 'admin_stape_1'
	}

	//==Admin step 2
function goto_admin_stape_2()
	{
		log_h3(`Шаг 2. Проверка линий коммуникаци  `)
		game.state = 'admin_stape_2'
	}

	//==Admin step 3
function goto_admin_stape_3()
	{
		log_h3(`Шаг 4. Чиним поломки  `)
		game.state = 'admin_stape_2'
	}

//===BARRAGE PHASE
function goto_barrage_phase()
{
	log_h2(`${game.active} \nАртналет `)
	ABU_ABF()
	Assault_ABF()
}

function ABU_ABF()
{
	log_h3(`Стреляет Арта  `)
	game.state = 'ABU_ABF'
}

function Assault_ABF()
{
	log_h3(`Заявляем штурм`)
	game.state = 'ABU_ABF'
}


//=== MOVEMENT PHASE

//=== COMBAT PHASE



function goto_player_turn() {
	set_active_player()

	log_h2(game.phasing)

	// paranoid resetting of state
	game.side_limit = {}
	game.rommel = 0
	game.from1 = game.from2 = 0
	game.to1 = game.to2 = 0

	// reset moved and fired flags
	set_clear(game.fired)
	set_clear(game.moved)

	game.commit = null

	goto_initial_supply_check()
}

function end_player_turn() {

}