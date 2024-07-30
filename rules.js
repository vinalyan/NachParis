"use strict"

var states = {}
var game = null
var view = null
var timeout = 0

const GERMAN = 'German'
const ALLIED = 'Allied'
const TIMEOUT = 250

const hexw = 9
const hexh = 8
const mapsize = hexw*hexh
const max = Math.max
const abs = Math.abs

const {
	start_hexes, hexes_terrain, units_max_mf
} = require("./data.js")


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

/// HEXES

function hex_to_coordinates(h){
	let q = Math.floor(h / hexh)
	let r = h% hexh - Math.floor((q+1) / 2)
	let s = 0-q-r
	return {q,r,s}
}

function calc_distance(a, b) {
	let hex_a = hex_to_coordinates(a)
	let hex_b = hex_to_coordinates(b)
	return max(abs(hex_b.q-hex_a.q), abs(hex_b.r-hex_a.r), abs(hex_b.s-hex_a.s))
}


function active_adjacents_for_move(hex, mf)
{	
	gen_action_hex(hex)
	let hexes = get_adjacents(hex)
	//TODO тут добавить различные проверки

	hexes.forEach(
		function(h) {
			if(get_mf_cost(h) <= mf)
			{		
				gen_action_hex(h)
			}
	})

}


function get_adjacents(hex)
{
	let hexes = []
	for (let h = 0; h < mapsize; h++) {
		if (calc_distance(hex,h)<=1)
		{
			set_add(hexes,h)
		}
	}
	return hexes
}

function get_mf_cost(hex_id){
	switch(hexes_terrain[hex_id]) {
		case 'Clear':
			return 10
		case 'Broken':
			return 12
		default:
			return 10
	  }
	
}

///UNIT STATE 

const UNIT_HEX_SHIFT = 7
const UNIT_HEX_MASK = 255 << UNIT_HEX_SHIFT

const UNIT_MF_SHIFT = 0
const UNIT_MF_MASK = 127 << UNIT_MF_SHIFT

function unit_hex(u) {
	return (game.units[u] & UNIT_HEX_MASK) >> UNIT_HEX_SHIFT
}

function set_unit_hex(u, x) {
	//invalidate_caches()
	game.units[u] = (game.units[u] & ~UNIT_HEX_MASK) | (x << UNIT_HEX_SHIFT)
}

function unit_mf(u) {
	return (game.units[u] & UNIT_MF_MASK) >> UNIT_MF_SHIFT
}

function set_unit_mf(u, x) {
	//invalidate_caches()
	game.units[u] = (game.units[u] & ~UNIT_MF_MASK) | (x << UNIT_MF_SHIFT)
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
		update_aliases()
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
		selected: [],
		selected_hexes: [],
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
		selected_hexes : game.selected_hexes,
		selected: game.selected,

	} 

	if (current === game.active)
		view.selected = game.selected
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

function gen_action_hex(x) {
	gen_action('hex', x)
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

	for (let u = 0; u < start_hexes.length; ++u)
		{  
			set_unit_hex(u, start_hexes[u])
			set_unit_mf(u,units_max_mf[u])
		}
	goto_player_turn()
}

function current_scenario() {
	return SCENARIOS[game.scenario]
}


//==PLAYER TURN====
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
	end_game() 
}

function end_game() {

	return goto_game_over("Draw", "No Victory!")
}

function goto_game_over(result, victory) {
	game.state = 'game_over'
	game.active = "None"
	game.result = result
	game.victory = victory
	log_br()
	log(game.victory)
	return true
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
		view.prompt = `Можете подвигать свои отряды`

	//TODO тут добавляем доступные юниты. 
		for (let u = 0; u < unit_count; ++u)
		{
			gen_action_unit(u)
		}

		gen_action('end_movement_phase_step_2')
		},
		unit(u) {
			set_toggle(game.selected, u)
			if (game.selected.length == 1) {
				game.state = "movement_unit"
				set_add(game.selected_hexes,unit_hex(u))
			}
		},
		end_movement_phase_step_2()
		{
			combat_phase()
		},
}

states.movement_unit = {
	inactive: "Movemen phase",
	prompt(){
		view.prompt = `Отряд ${game.selected[0]} MF = ${unit_mf(game.selected[0])}`
		gen_action_unit(game.selected[0])
		active_adjacents_for_move(view.selected_hexes[view.selected_hexes.length-1], unit_mf(game.selected[0]))
	},
	unit(u) {
		set_toggle(game.selected, u)
		if (game.selected.length == 0) {
			set_clear(game.selected_hexes) 
			game.state = "movement_phase_step_2"			
		}
	},
	hex(h){		
		// Проверяем наличие элемента hex в массиве path
		if (set_has(game.selected_hexes,h)!=false)
		{
			// Если элемент есть и он последний
			if(set_has(game.selected_hexes,h) == game.selected_hexes.length - 1){
				set_unit_hex(game.selected[0],h)
			}
			else {
				pop_undo()
			}
		}
		else{
			push_undo()
			set_add(game.selected_hexes,h)
			let mf = unit_mf(game.selected[0])
			mf = mf - get_mf_cost(h)
			console.log(`mf ${mf}`)
			set_unit_mf(game.selected[0], mf)
		}

		/*
		set_unit_hex(game.selected[0],h)
		game.MF = game.MF - get_mf_cost(h)
		console.log( `MF = ${game.MF}`)*/
	}
}




function start_new_path(hex){

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

function combat_phase()
{
	log_h3(`IV COMBAT`)
	resolution_of_assault()
}

function resolution_of_assault()
{
	game.state = 'resolution_of_assault'
}

states.resolution_of_assault = {
	inactive: "Combat phase",
	prompt()
	{
		view.prompt = `Необходимо реализовать штурмы`
		gen_action('end_resolution_of_assault')
	},
	end_resolution_of_assault()
	{
		combat_phase_step_1()
	},
}

function combat_phase_step_1()
{
	log_h4("combat_phase_step_1")
	game.state = 'combat_phase_step_1'
}

states.combat_phase_step_1 = {
	inactive: "Combat phase",
	prompt()
	{
		view.prompt = `Проводим бои`
		gen_action('end_combat_phase_step_1')
		gen_action('combat')
	},
	end_combat_phase_step_1()
	{
		remove_step_loss_markers()
		combat_phase_step_2()
	},
	combat()
	{
		combat()
	},
}

function combat()
{
	log_h4("combat")
	/*
		- Early CAV Withdrawal
		- Combat results, 
		- retreat, 
		- advance, 
		- change facing
	*/
}

function early_cav_withdrawal()
{

}

function combat_results()
{

} 

function retreat()
{

} 

function advance()
{

}

function change_facing()
{

}

function remove_step_loss_markers()
{
//Remove "Step Loss" markers.
//Flip "2+ Step Loss" markers to "Step Loss" side
log_h4("сняли маркеры Step Los")
}

function combat_phase_step_2()
{
	log_h4("combat_phase_step_2")
	game.state = 'combat_phase_step_2'
}

states.combat_phase_step_2 = {
	inactive: "Combat phase",
	prompt()
	{
		view.prompt = `Надо вывести отряды на сколько-то там очков`
		gen_action('end_combat_phase_step_2')
	},
	end_combat_phase_step_2()
	{
		remove_EXM_marker()
		end_player_turn()
	},
}

function combat_movement()
{

}

function unit_consolidation()
{

}

function replacement_absorption()
{

}

function fieldworks_construction()
{

}

function remove_EXM_marker()
{
	log_h4("remove_EXM_marker")
	/*
	- Remove EXM, 
	- Preparatory Barrage Launched
	- ABF Assault markers
	*/
}



//=== COMMON LIBRARY ===


function object_copy(original) {
	if (Array.isArray(original)) {
		let n = original.length
		let copy = new Array(n)
		for (let i = 0; i < n; ++i) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	} else {
		let copy = {}
		for (let i in original) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	}
}

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

function set_add(set, item) {
	if(set_has(set, item)===false){
		set.push(item)
	}
	else
		return set
}

function set_toggle(set, item) {
	if(set_has(set, item)===false)
	{
		set_add(set, item)
	}
	else
	{
		set_delete(set, item)
	}
	return set
}

function set_delete(set, item) {
		set.splice(set_has(set, item), 1)
		return set
}

function set_clear(set) {
	set.length = 0
}

function set_has(set, item) {
    for (let i = 0; i < set.length; i++) {
        if (set[i] === item) {
            return i; // Возвращаем индекс элемента, если он найден
        }
    }
    return false; // Возвращаем false, если элемент не найден
}