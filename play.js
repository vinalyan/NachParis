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

// количество вертрикальных гексов
const map_v = 8
// количество горизональных геков
const map_h = 9


function build_hexes() {

    //Смещение. По сути начальные кооодиты
    let xoff = 339
    let yoff = 882

    // TODO сделать небольшое расстоения между гексами, чтобы они друг на друга не заезжали. 
    //Радиус описывающей гекс окружности. Нужен для описания смещений. 
    let hex_w = 143



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
        Идем сначала по вертикале. 
        От 1 до количетсва вертикальных гексов.
    */
        for(let num_h = 0; num_h < map_h; ++num_h){
            let x = (num_h * (hex_h + hex_h/2)) + xoff         
            for (let num_v = 0; num_v < map_v; ++num_v) {
                let y = (num_v * hex_v*2) - (hex_v*(num_h%2)) + yoff //тут пытаюсь сделать 
                let hex_id = '' + num_h + num_v
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