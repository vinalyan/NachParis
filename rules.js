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
		state: null,
		log: [],
		undo: [],
		summary: null,
		scenario: scenario,
		gt_start: SCENARIOS[scenario].start,
		gt_end: SCENARIOS[scenario].end,
		gt_now: SCENARIOS[scenario].start,
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

exports.action = function (state, current, action, arg) {
	timeout = Date.now() + TIMEOUT // don't think too long!
	load_state(state)
	let S = states[game.state]
	if (S && action in S) {
		S[action](arg, current)
	} else {
		if (action === 'undo' && game.undo && game.undo.length > 0)
			pop_undo()
		else
			throw new Error("Invalid action: " + action)
	}
	return game
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

//==Player Turn
function goto_player_turn() {
	set_active_player()
	admin_phase()
	barrage_phase()
}

function end_player_turn() {
	log_h2(`${game.active}\nEnd Turn GT${game.gt_now}`)
	if (game.phasing === GERMAN)
		game.phasing = ALLIED
	else
		{
			game.gt_now ++
		 	game.phasing = GERMAN
		}
	if (game.gt_now <= game.gt_end)
		{
			goto_player_turn()
		}
	else
		goto_end_game()

}
function goto_end_game() {
	log_h1("End Game")
}

//===ADMIN PHASE

function admin_phase(){
	log_h2(`${game.active}\nGT${game.gt_now}`)
	log_h3(`I ADMIN`)

	game.selected = []
	game.summary = {}
	admin_stape_1()
	admin_stape_2()
	admin_stape_3()

}
	//==Admin step 1
function admin_stape_1()
	{
		log_h4(`Шаг 1. Бросок на дождик`)
		log_h4(`Тут немцы в первый ход бросают на дождик`)
	}

	//==Admin step 2
function admin_stape_2()
	{
		log_h4(`Шаг 2. Проверка линий коммуникаци  `)
		log_h4(`Линия коммуникаций фрицев заебок`)
		log_h4(`Линия коммуникаций союзников тоже заебок`)
	}

	//==Admin step 3
function admin_stape_3()
	{
		log_h4(`Шаг 4. Чиним поломки  `)
	}

//===BARRAGE PHASE
function barrage_phase()
{
	log_h3(`II BARRAGE`)
	ABU_ABF()
}

function ABU_ABF()
{
	game.state = 'ABU_ABF'
	log_h4(`Стреляет Арта `)
}

states.ABU_ABF = {
	inactive: "Barrage phase",
	prompt() {
		view.prompt = `Постреляйте по юнитам и крепостям ABU_ABF.`
		gen_action('end_ABU_ABF')		
	},
	end_ABU_ABF()
	{
		preper_to_Assault_ABF()
	},
}

function preper_to_Assault_ABF()
{
	log_h3(`Заявляем штурм`)
	game.state = 'preper_to_Assault_ABF'
}

states.preper_to_Assault_ABF = {
	inactive: "Barrage phase",

prompt() {
		view.prompt = `Подготовьте отряды к штурму укреплений.`
		gen_action('end_preper_to_Assault_ABF')
		},
		end_preper_to_Assault_ABF()
		{
			movemen_phase()
		},
}

//=== MOVEMENT PHASE
function movemen_phase()
{
	log_h3(`III MOVEMENT`)
	remove_FOM_markers()
	movement_phase_step_1()
}

function remove_FOM_markers()
{
	log_h4(`FOM маркеры удалены`)

}

function movement_phase_step_1()
{
	log_h4(`С поля уеюбывают эти`)
	game.state = 'movement_phase_step_1'
}

states.movement_phase_step_1 = {
	inactive: "Movemen phase",

prompt() {
		view.prompt = `Надо вывести отряды на сколько-то там очков`
		gen_action('end_movement_phase_step_1')
		},
		end_movement_phase_step_1()
	{
		movement_phase_step_2()
	},
}

function movement_phase_step_2()
{
	game.state = 'movement_phase_step_2'
}

states.movement_phase_step_2 = {
	inactive: "Movemen phase",

prompt() {
		view.prompt = `Выберете доступное действие`
		movement()
//		unit_arrivals()
//		facing_unit()
//		specific_structures_destruction()
//		railroad_network_delimitation()
//		split_units()
//		recombine_units()
		gen_action('end_movement_phase_step_2')
		},
		end_movement_phase_step_2()
	{
		end_player_turn()
	},
}

function movement()
{
	log_h4('Дико подвигались юниты')
}

function unit_arrivals()
{
	log_h4('Отряды прибыли')
}

function facing_unit()
{
	log_h4('Отряды покрутили жалами')
}

function specific_structures_destruction()
{
	log_h4('Поломали здания')
}

function railroad_network_delimitation()
{
	log_h4('Позахватывали ЖД')
}

function split_units()
{
	log_h4('Отряды объеденились')
}

function recombine_units()
{
	log_h4('Разделили отряды')
}

//=== COMBAT PHASE

/*
COMBAT PHASE

state Resolution of Assault ABF
state combat_phase_step_1
- Combat
	- Early CAV Withdrawal
	- Combat results, 
	- retreat, 
	- advance, 
	- change facing

Remove "Step Loss" markers.
Flip "2+ Step Loss" markers to "Step Loss" side

state combat_phase_step_2
	- Combat Movement
	- Unit Consolidation
	- Replacement Absorption
	- Fieldworks Construction

- Remove EXM, Preparatory Barrage Launched
and ABF Assault markers
*/



//=== COMMON LIBRARY ===

function clear_undo() {
	if (game.undo.length > 0)
		game.undo = []
}

function push_undo() {
	let copy = {}
	for (let k in game) {
		let v = game[k]
		if (k === "undo")
			continue
		else if (k === "log")
			v = v.length
		else if (typeof v === "object" && v !== null)
			v = object_copy(v)
		copy[k] = v
	}
	game.undo.push(copy)
}

function pop_undo() {
	let save_log = game.log
	let save_undo = game.undo
	let state = save_undo.pop()
	save_log.length = state.log
	state.log = save_log
	state.undo = save_undo
	load_state(state)
}