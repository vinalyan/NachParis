"use strict"

// https://www.redblobgames.com/grids/hexagons/

// Генерим гексы.

const svgNS = "http://www.w3.org/2000/svg"
const round = Math.round
const sqrt = Math.sqrt

let ui = {
	hexes: [],
	hex_x: [],
	hex_y: [],
    units: [],
}

// количество вертрикальных гексов
const map_v = 8
// количество горизональных геков
const map_h = 9


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
                document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)
            }
	}
    ui.loaded = true;
}

build_hexes()

//количество отрядов в гексе. 
let stack_list = new Array(map_v * map_h)
for (let i = 0; i < stack_list.length; ++i)
	stack_list[i] = []

//Устанваливаем отряд к гекс.
//Тут надо все переделать

stack_list[5] = [0,1,2] 

let s = 17

layout_stack(stack_list[5],ui.hexes[s],ui.hex_x[s],ui.hex_y[s],71.5, 1)

function layout_stack(stack, hex, start_x, start_y, wrap, xdir) {
	for (let i = 0; i < stack.length; ++i) {
        if(stack[i].length != 0)  //не пустой гекс. TODO переделать. 
        {
            let u = stack[i]  //5 
            let e = document.getElementById("units").children[i] //TODO заменить ui.units[u]
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
            e.style.zIndex = z

           // update_unit(e, u)
        }
	}

}


/*
//обновление карты. Когда все пререрисовываем. 
function update_map() {

	for (let i = 0; i < stack_list.length; ++i) {
		stack_list[i][0].length = 0
		stack_list[i][1].length = 0
	}

	for (let u = 0; u < unit_count; ++u) {
		let e = ui.units[u]
		let hex = unit_hex(u)
		if (hex) {
			if (!ui.units_holder.contains(e))
				ui.units_holder.appendChild(e)
			if (is_axis_unit(u)) {
				stack_list[hex][0].push(u)
				e.stack = stack_list[hex][0]
			} else {
				stack_list[hex][1].push(u)
				e.stack = stack_list[hex][1]
			}
			e.hex = hex
		} else {
			e.remove()
		}
	}

	for (let i = 0; i < stack_list.length; ++i) {
		stack_list[i][0].sort(cmp_unit_stack)
		stack_list[i][1].sort(cmp_unit_stack)
	}

	for (let hex = 0; hex < stack_list.length; ++hex) {
		let start_x = ui.hex_x[hex]
		let start_y = ui.hex_y[hex]
		let wrap = 6

		if (is_setup_hex(hex)) {
			start_x = 1095
			start_y = 25 + 8
		}

		let shared = (stack_list[hex][0].length > 0) && (stack_list[hex][1].length > 0)
		for (let aa = 0; aa < 2; ++aa) {
			let this_y = start_y
			if (stack_list[hex][aa] === ui.focus) {
				let height = Math.min(wrap, stack_list[hex][aa].length) * 56
				if (this_y + height + 25 > 960)
					this_y = 960 - height - 25
			}
			if (shared) {
				if (aa === 0)
					layout_stack(stack_list[hex][aa], hex, start_x - 28, this_y + 2, wrap, -1)
				else
					layout_stack(stack_list[hex][aa], hex, start_x + 28, this_y - 2, wrap, 1)
			} else {
				layout_stack(stack_list[hex][aa], hex, start_x, this_y, wrap, 1)
			}
		}
	}
}
*/

// Дебаг. Следим за координатами курсором.
const cursorPositionElement = document.getElementById('cursor-position');
            
document.addEventListener('mousemove', (event) => {
  const x = event.clientX;
  const y = event.clientY;
  cursorPositionElement.textContent = `X: ${x}, Y: ${y}`;
});


const coordsDiv = document.getElementById('coords');

document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    coordsDiv.style.left = `${mouseX + 10}px`;
    coordsDiv.style.top = `${mouseY + 10}px`;
    coordsDiv.textContent = `X: ${mouseX}, Y: ${mouseY}`;
});

