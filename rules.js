"use strict"


var states = {}
var game = null
var view = null

const GERMAN = 'German'
const ALLIED = 'Allied'
const TIMEOUT = 250
var timeout = 0



// === STATE CACHES ===
const unit_count = 10

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
		gt: 0,
		units: new Array(unit_count).fill(0),
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
	console.log('exports.view')
	return common_view(current)
}


//COMMON TEMOLATES

function common_view(current) {
	view.log = game.log
	if (game.state === 'game_over') {
		view.prompt = game.victory
	} else if (current === 'Observer' || game.active !== current) {
		let inactive = states[game.state].inactive || game.state
		view.prompt = `Waiting for ${game.active} \u2014 ${inactive}...`
	} else {
		view.actions = {}
		if (states[game.state])
			states[game.state].prompt()
		else
			view.prompt = "Unknown state: " + game.state
		if (view.actions.undo === undefined) {
			if (game.undo && game.undo.length > 0)
				view.actions.undo = 1
			else
				view.actions.undo = 0
		}
	}
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

function s(action, argument) {
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

function gen_action_unit(u) {
	gen_action('unit', u)
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
	log_h1(game.scenario)
	let start_hexes = [30,37,37,37,37,37,37,37,37,37]
	for (let u = 0; u < start_hexes.length; ++u)
		{  
			set_unit_hex(u, start_hexes[u])
		}
	goto_player_turn()
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
}
	//==Admin step 1
function goto_admin_stape_1()
	{
		log_h3(`Шаг 1. Бросок на дождик`)
		log_h4(`Тут немцы в первый ход бросают на дождик`)

		game.state = 'admin_stape_1'
	}


	//==Admin step 2
function goto_admin_stape_2()
	{
		log_h3(`Шаг 2. Проверка линий коммуникаци  `)
		log_h4(`Линия коммуникаций фрицев заебок`)
		log_h4(`Линия коммуникаций союзников тоже заебок`)

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
	log_h2(`${game.active}\nАртналет `)

//TODO тут как-то должен остановаиться
// дальше тут появляеется кнопка to_Assault_ABF
// по нажатию на нее переходим на след фазу. 
	ABU_ABF()
}

function ABU_ABF()
{
	log_h3(`Стреляет Арта  `)
	game.state = 'ABU_ABF'

}

states.ABU_ABF = {
	inactive: "Barrage phase",
	prompt() {
		view.prompt = `Заканчиваем с вашим этим ABU_ABF.`
		gen_action('to_Assault_ABF')
		
	},
	to_Assault_ABF()
	{
		Assault_ABF()
	},
}

function Assault_ABF()
{
	log_h3(`Заявляем штурм`)
	game.state = 'Assault_ABF'
}


//=== MOVEMENT PHASE

//=== COMBAT PHASE


function goto_player_turn() {
	set_active_player()

	log_h2(game.phasing)
	goto_admin_phase()
	goto_barrage_phase()
	end_player_turn()
}

function end_player_turn() {
	if (game.phasing === GERMAN)
		game.phasing = ALLIED
	else
		{
			game.gt ++
		 	game.phasing = GERMAN
		}
	if (game.gt < 2)
		goto_player_turn()
	else
		goto_end_game()

}
function goto_end_game() {
	log_h1("End Game")
}


//=== COMMON LIBRARY ===

function clear_undo() {
	if (game.undo.length > 0)
		game.undo = []
}