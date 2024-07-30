"use strict"

// https://www.redblobgames.com/grids/hexagons/

const svgNS = "http://www.w3.org/2000/svg"
const round = Math.round
const sqrt = Math.sqrt
const max = Math.max
const min = Math.min
const abs = Math.abs


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
const UNIT_HEX_SHIFT = 7
const UNIT_HEX_MASK = 255 << UNIT_HEX_SHIFT

function unit_hex(u) {
	return (view.units[u] & UNIT_HEX_MASK) >> UNIT_HEX_SHIFT
}

function is_unit_action(unit) {
	return !!(view.actions && view.actions.unit && view.actions.unit.includes(unit))
}

function is_unit_selected(unit) {
	if (Array.isArray(view.selected))
		return view.selected.includes(unit)
	return view.selected === unit
}

function is_any_hex_action(hex) {
	if (view.actions && view.actions.hex && view.actions.hex.includes(hex))
		return true
	return false
}


function is_hex_selected(hex) {
	if (hex === view.pursuit || hex === view.battle || hex === view.selected_hexes)
		return true
	if (Array.isArray(view.selected_hexes) && view.selected_hexes.includes(hex))
		return true
	return false
}



// количество вертрикальных гексов
const hexh = 8
// количество горизональных геков
const hexw = 9
//количество юнитов
const unit_count = 10

let stack_list = new Array(hexh * hexw)
for (let i = 0; i < stack_list.length; ++i)
	stack_list[i] = []

// Генерим гексы.

function build_hexes() {

    //Смещение. По сути начальные кооодиты
    let xoff = 169
    let yoff = 442

    //Радиус описывающей гекс окружности. Нужен для описания смещений. 
    let hex_w = 71.5
    //Зазор, чтобы гексы не наезжали друг на друга

    //TODO сделать зазор между гексами. 
    // Половина длины по горизонтале 
    let hex_h = hex_w
    // Половина длины по вертикати. 
    let hex_v = (hex_w * sqrt(3))/2

    function add_hex(x, y) {
		let gap = 3
		return [
			[ round(x-hex_h/2 + gap), round(y-hex_v + gap) ],
			[ round(x-hex_h + gap),         round(y) ],
			[ round(x-hex_h/2 + gap), round(y+hex_v -gap) ],
			[ round(x+hex_h/2 - gap), round(y+hex_v-gap) ],
			[ round(x+hex_h - gap),         round(y) ],
			[ round(x+hex_h/2 - gap), round(y-hex_v + gap) ]
		].join(" ")
	}

    /*
        Берем нулевую вертикальную. 
        Рисуем вертикальные
        Потом горизонтальные. 
        При смещении по горизонтале учитываем, что 
    */
        for(let num_h = 0; num_h < hexw; ++num_h){
            let x = (num_h * (hex_h + hex_h/2)) + xoff         
            for (let num_v = 0; num_v < hexh; ++num_v) {
                let y = (num_v * hex_v*2) - (hex_v*(num_h%2)) + yoff //тут учитываем, что каждая четная колонка ниже нечетной
                let hex_id = num_h * hexh + num_v
                let hex = ui.hexes[hex_id] = document.createElementNS(svgNS, "polygon") 
                ui.hex_x[hex_id] = round(x)	
                ui.hex_y[hex_id] = round(y)
                hex.setAttribute("class", "hex")
                hex.setAttribute("ID", '' + hex_id)
                hex.setAttribute("points", add_hex(x, y))  
                hex.addEventListener("mousedown", on_click_hex)
				hex.addEventListener("mouseenter", on_focus_hex)
				hex.addEventListener("mouseleave", on_blur)        
                hex.hex = hex_id

				// Создание текстового элемента для отображения текста в шестиугольнике

                document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)

            }
	}
    ui.loaded = true;
}


function on_update() {
	if (!ui.loaded) {
		return setTimeout(on_update, 500)
	}
    update_map()
    action_button("undo", "Undo")
	action_button('end_ABU_ABF', "End ABU BF")
	action_button('end_preper_to_Assault_ABF', "End Preper to Assault")
	action_button('end_movement_phase_step_1', "End Mandatory Withdrawal")
	action_button('end_movement_phase_step_2', "End Move Phase")
	action_button('end_resolution_of_assault', "end_resolution_of_assault")
	action_button('combat', "combat")
	action_button('end_combat_phase_step_1', "end_combat_phase_step_1")
	action_button('end_combat_phase_step_2', "end_combat_phase_step_2")
}

build_hexes()

function build_units() {
	function build_unit(u) {
		//let nationality = is_axis_unit(u) ? "axis" : "allied"   
		let elt = ui.units[u] = document.createElement("div")
		elt.className = `unit u${u}`
		elt.addEventListener("mousedown", on_click_unit)
		elt.addEventListener("mouseenter", on_focus_unit)
		elt.addEventListener("mouseleave", on_blur)
		elt.unit = u
	}
	for (let u = 0; u < unit_count; ++u) {
		build_unit(u)
	}
}

build_units()

function update_map() {
    for (let i = 0; i < stack_list.length; ++i) {
		stack_list[i].length = 0
	}
	for (let u = 0; u < unit_count; ++u) 
        {
            let hex = unit_hex(u)
            let e = ui.units[u]
		    if (!ui.units_holder.contains(e))
            ui.units_holder.appendChild(e)  
			if(hex){
				stack_list[hex].push(u)
				e.stack = stack_list[hex]
				layout_stack(stack_list[hex], hex, ui.hex_x[hex],ui.hex_y[hex],60, -1)
			}
        }
	for (let hex = 0; hex < stack_list.length; ++hex) {
		let start_x = ui.hex_x[hex]
		let start_y = ui.hex_y[hex]
		let wrap = 6
		if (ui.hexes[hex]) {
			ui.hexes[hex].classList.toggle("action", is_any_hex_action(hex))
			ui.hexes[hex].classList.toggle("selected", is_hex_selected(hex))
		}
	
	}	
}

//количество отрядов в гексе.



//отрисовываем отряды в гексах
function layout_stack(stack, hex, start_x, start_y, wrap, xdir) {
	for (let i = 0; i < stack.length; ++i) {
            let u = stack[i]  
            let e = ui.units[u] 
            let x, y, z

            if (stack === ui.focus) {
                x = start_x - 37 + xdir * ((i / wrap) | 0) * 56
                y = start_y - 40 + (i % wrap) * 80
                z = 200
            } else {
                if (stack.length <= 1) {
                    x = start_x - 37 + i * 11
                    y = start_y - 40 + i * 14
                } else if (stack.length <= 4) {
                    x = start_x - 40 + i * 7
                    y = start_y - 40 + i * 7
                } else if (stack.length <= 8) {
                    x = start_x - 37 + i * 4
                    y = start_y - 40 + i * 4
                } else {
                    x = start_x - 37 + i * 4
                    y = start_y - 40 + i * 4
                }
                z = 100 + i

            }
            e.style.top = y + "px"
            e.style.left = x + "px"
            e.style.zIndex = 100 + z

//			update_unit(e, u)
			e.classList.toggle("action", !view.battle && is_unit_action(u))
			e.classList.toggle("selected", !view.battle && is_unit_selected(u))
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
    let text = ui.hexes[hex].hex
	document.getElementById("status").textContent = text

}

function on_click_hex(evt) {
	if (evt.button === 0) {
		if (send_action('hex', evt.target.hex))
			evt.stopPropagation()
    }
}

function on_blur(evt) {
	document.getElementById("status").textContent = ""
}

document.getElementById("map").addEventListener("mousedown", function (evt) {
	if (evt.button === 0) {
		blur_stack()
	}
})

// КОНЕЦ СОБЫТИЙ МЫШИ И КЛАВЫ

function sub_hex_name(match, p1, offset, string) {
	let x = p1 | 0
	let n = hex_name[x]
	return `<span class="hex" onmouseenter="on_focus_hex_tip(${x})" onmouseleave="on_blur_hex_tip(${x})" onclick="on_click_hex_tip(${x})">${n}</span>`
}

function sub_unit_name(match, p1, offset, string) {
	let u = p1 | 0
	return units[u].name
}

function on_log_line(text, cn) {
	let p = document.createElement("div")
	if (cn) p.className = cn
	p.innerHTML = text
	return p
}

function on_log(text) {
	let p = document.createElement("div")

	if (text.match(/^>>/)) {
                text = text.substring(2)
                p.className = "ii"
        }

	if (text.match(/^>/)) {
                text = text.substring(1)
                p.className = "i"
        }

	text = text.replace(/&/g, "&amp;")
	text = text.replace(/</g, "&lt;")
	text = text.replace(/>/g, "&gt;")

//	text = text.replace(/#(\d+)/g, sub_hex_name)
//	text = text.replace(/%(\d+)/g, sub_unit_name)

	if (text.match(/^\.h1/)) {
		text = text.substring(4)
		p.className = "h1"
	}
	if (text.match(/^\.h2/)) {
		text = text.substring(4)
		if (text.startsWith("German"))
			p.className = "h2 german"
		else if (text.startsWith("Allied"))
			p.className = "h2 allied"
		else
			p.className = "h2"
	}
	if (text.match(/^\.h3/)) {
		text = text.substring(4)
		p.className = "h3"
	}
	if (text.match(/^\.h4/)) {
		text = text.substring(4)
		p.className = "h4"
	}

	if (text.indexOf("\n") < 0) {
		p.innerHTML = text
	} else {
		text = text.split("\n")
		p.appendChild(on_log_line(text[0]))
		for (let i = 1; i < text.length; ++i)
			p.appendChild(on_log_line(text[i], "i"))
	}
	return p
}


// Дебаг. Следим за координатами курсором.

const coordsDiv = document.getElementById('coords');

document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    coordsDiv.style.left = `${mouseX + 10}px`;
    coordsDiv.style.top = `${mouseY + 10}px`;
    coordsDiv.textContent = `X: ${mouseX}, Y: ${mouseY}}` ;
});

