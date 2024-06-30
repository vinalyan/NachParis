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