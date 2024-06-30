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
}


function is_map_hex(x) {
	return x < hex_exists.length && hex_exists[x] === 1
}
// visible map width = 22 hexes: el agheila -> alexandria
// visible map height = 9 hexes: oasis to derne

const map_w = 3
const map_h = 3
const hexmonth = map_w * map_h


function build_hexes() {
	let yoff = 4
	let xoff = 62
	let hex_w = 121.5
	let hex_r = hex_w / sqrt(3)
	let hex_h = hex_r * 2

	let w = hex_w / 2
	let a = hex_h / 2
	let b = hex_h / 4

    function add_hex(x, y) {
		let sm_hex_w = hex_w - 8
		let sm_hex_h = sm_hex_w / sqrt(3) * 2
		let ww = sm_hex_w / 2
		let aa = sm_hex_h / 2
		let bb = sm_hex_h / 4
		return [
			[ round(x),   round(y-aa) ],
			[ round(x+ww), round(y-bb) ],
			[ round(x+ww), round(y+bb) ],
			[ round(x),   round(y+aa) ],
			[ round(x-ww), round(y+bb) ],
			[ round(x-ww), round(y-bb) ]
		].join(" ")
	}

	for (let y = 0; y < map_h+1; ++y) {
		for (let x = 0; x < map_w+1; ++x) {
			let hex_id = y * map_w + x
			let xx = x + y/2 - 4.5
			let hex_x = (xoff + hex_w * xx + hex_w/2)
			let hex_y = (yoff + hex_h * 3 / 4 * y + hex_h/2)

			ui.hex_x[hex_id] = round(hex_x)
			ui.hex_y[hex_id] = round(hex_y)


            let hex = ui.hexes[hex_id] = document.createElementNS(svgNS, "polygon")
            hex.setAttribute("class", "hex")
            hex.setAttribute("points", add_hex(hex_x, hex_y))
//            hex.addEventListener("mousedown", on_click_hex)
  //          hex.addEventListener("mouseenter", on_focus_hex)
    //        hex.addEventListener("mouseleave", on_blur)
            hex.hex = hex_id
            document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)
			
		}
	}
    ui.loaded = true;
}

build_hexes()