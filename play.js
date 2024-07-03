"use strict"

// https://www.redblobgames.com/grids/hexagons/

const svgNS = "http://www.w3.org/2000/svg"
const round = Math.round
const sqrt = Math.sqrt

///TODO временные файлы убрать. Херабота должна быть в файле rules.

let unit_states = []


/// тут заканчиваются временные переменные


let ui = {
	hexes: [],
	hex_x: [],
	hex_y: [],
    units: [],
    units_holder: document.getElementById("units"),
    focus: null,
}

// СОСТОЯНИЕ ОТРЯДОВ 
//Гекс отряда 
const UNIT_HEX_SHIFT = 0
const UNIT_HEX_MASK = 255 << UNIT_HEX_SHIFT

function unit_hex(u) {
	return (unit_states[u] & UNIT_HEX_MASK) >> UNIT_HEX_SHIFT
}

//TODO временная функция убрать. 
function set_unit_hex(u, x) {
	unit_states[u] = (unit_states[u] & ~UNIT_HEX_MASK) | (x << UNIT_HEX_SHIFT)
}

// количество вертрикальных гексов
const map_v = 8
// количество горизональных геков
const map_h = 9
//количество юнитов
const unit_count = 10

let stack_list = new Array(map_v * map_h)
for (let i = 0; i < stack_list.length; ++i)
	stack_list[i] = []

// Генерим гексы.

function build_hexes() {

    //Смещение. По сути начальные кооодиты
    let xoff = 172
    let yoff = 442

    //Радиус описывающей гекс окружности. Нужен для описания смещений. 
    let hex_w = 71.5
    //Зазор, чтобы гексы не наезжали друг на друга
    let gap = 10

    //TODO сделать зазор между гексами. 
    // Половина длины по горизонтале 
    let hex_h = hex_w
    // Половина длины по вертикати. 
    let hex_v = (hex_w * sqrt(3))/2

    function add_hex(x, y) {
 
		return [
			[ round(x-hex_h/2), round(y-hex_v) ],
			[ round(x-hex_h),         round(y) ],
			[ round(x-hex_h/2), round(y+hex_v) ],
			[ round(x+hex_h/2), round(y+hex_v) ],
			[ round(x+hex_h),         round(y) ],
			[ round(x+hex_h/2), round(y-hex_v) ]
		].join(" ")
	}

    /*
        Берем нулевую вертикальную. 
        Рисуем вертикальные
        Потом горизонтальные. 
        При смещении по горизонтале учитываем, что 
    */
        for(let num_h = 0; num_h < map_h; ++num_h){
            let x = (num_h * (hex_h + hex_h/2)) + xoff         
            for (let num_v = 0; num_v < map_v; ++num_v) {
                let y = (num_v * hex_v*2) - (hex_v*(num_h%2)) + yoff //тут учитываем, что каждая четная колонка ниже нечетной
                let hex_id = num_h * map_v + num_v
                let hex = ui.hexes[hex_id] = document.createElementNS(svgNS, "polygon") 
                ui.hex_x[hex_id] = round(x)	
                ui.hex_y[hex_id] = round(y)
                hex.setAttribute("class", "hex")
                hex.setAttribute("ID", '' + hex_id)
                hex.setAttribute("points", add_hex(x, y))  
               hex.addEventListener("mousedown", on_click_hex)
				hex.addEventListener("mouseenter", on_focus_hex)
				//hex.addEventListener("mouseleave", on_blur)        
                document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)
            }
	}
    ui.loaded = true;
}

build_hexes()

function build_units() {
	function build_unit(u) {
		//let nationality = is_axis_unit(u) ? "axis" : "allied"   
		let elt = ui.units[u] = document.createElement("div")
		elt.className = `unit`
		elt.addEventListener("mousedown", on_click_unit)
		elt.addEventListener("mouseenter", on_focus_unit)
		//elt.addEventListener("mouseleave", on_blur)
		elt.unit = u
	}
	for (let u = 0; u < unit_count; ++u) {
		build_unit(u)
	}
}

build_units()

function update_map() {
    for (let i = 0; i < stack_list.length; ++i) {
		stack_list[i] = []
	}
	for (let u = 0; u < unit_count; ++u) 
        {
            let hex = unit_hex(u)
            let e = ui.units[u]
		    if (!ui.units_holder.contains(e))
            ui.units_holder.appendChild(e)    
            e.stack = stack_list[hex]
        }

}

update_map()

//количество отрядов в гексе.



//Устанваливаем отряд к гекс.

function layout_stack(stack, hex, start_x, start_y, wrap, xdir) {
	for (let i = 0; i < stack.length; ++i) {
        if(stack[i].length != 0)  //не пустой гекс. TODO переделать. 
        {
            let u = stack[i]  //5 
            let e = ui.units[u] //TODO заменить ui.units[u]
            let x, y, z

            if (stack === ui.focus) {
                if (start_x > 2000) xdir = -1
                if (start_x < 600) xdir = 1
                x = start_x - 25 + xdir * ((i / wrap) | 0) * 56
                y = start_y - 25 + (i % wrap) * 56
                z = 200
            } else {
                if (stack.length <= 1) {
                    x = start_x - 37 + i * 11
                    y = start_y - 40 + i * 14
                } else if (stack.length <= 4) {
                    x = start_x - 40 + i * 7
                    y = start_y - 40 + i * 7
                } else if (stack.length <= 8) {
                    x = start_x - 30 + i * 4
                    y = start_y - 30 + i * 4
                } else {
                    x = start_x - 35 + i * 3
                    y = start_y - 35 + i * 3
                }
                z = 100 + i

            }
            e.style.top = y + "px"
            e.style.left = x + "px"
            e.style.zIndex = 100 + z

 //           update_unit(e, u)
        }
	}
}

//разворачиваем стек
function focus_stack(stack) {
	if (ui.focus !== stack) {
		ui.focus = stack
		update_map()
		return stack.length <= 1 
	}
	return true
}

//сворачиваем стек
function blur_stack() {
	if (ui.focus !== null) {
		ui.focus = null
		update_map()
	}
}


/// СОБЫТИЯ МЫШКИ И КЛАВЫ

function on_click_unit(evt) {
	if (evt.button === 0) {
		evt.stopPropagation()
		if (focus_stack(evt.target.stack, evt.target.hex))
			if (!send_action('unit', evt.target.unit))
				blur_stack()
	}
}

function on_focus_unit(evt) {
	let u = evt.target.unit
 	let t = ""
	document.getElementById("status").textContent = t
}

function on_focus_hex(evt) {
	let hex = evt.target.hex
}

function on_click_hex(evt) {
	if (evt.button === 0) {
		if (send_action('hex', evt.target.hex))
			evt.stopPropagation()
    }
}


// КОНЕЦ СОБЫТИЙ МЫШИ И КЛАВЫ

//TODO убрать 
let units_start_hexes = [2,12,22,22,30,30,30,55,55,55]
function setup (start_hexes) {
    for (let u = 0; u < start_hexes.length; ++u)
        {
            stack_list[start_hexes[u]].push(u)
            set_unit_hex(u, start_hexes[u])             
            layout_stack(stack_list[start_hexes[u]],ui.hexes[start_hexes[u]],ui.hex_x[start_hexes[u]],ui.hex_y[start_hexes[u]],71.5, 1) 
        }
}
setup(units_start_hexes)

// Дебаг. Следим за координатами курсором.

const coordsDiv = document.getElementById('coords');

document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    coordsDiv.style.left = `${mouseX + 10}px`;
    coordsDiv.style.top = `${mouseY + 10}px`;
    coordsDiv.textContent = `X: ${mouseX}, Y: ${mouseY}`;
});

