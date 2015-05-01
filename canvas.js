'use strict'
var canvas = document.getElementById('map');
var ctx = canvas.getContext('2d');
var redrawButt = document.getElementById('redrawButt');
var rowEdit = document.getElementById('rowEdit');
var columnEdit = document.getElementById('columnEdit');
var SqSizeEdit = document.getElementById('SqSizeEdit');

ctx.lineWidth = 1;
var XDist = 1;
var YDist = 21;
var SqSize = 30;
var map = [];
var wall_percent = 0.125;
var mapN = 30;
var mapM = 50;
var cells = [];
var LastHandlCoord = false;
var colors = { "free": "#FFFFFF", "wall": "#000000", "start": "#B00000", "end": "#B00000", "path": "#6495ED", "selected": "red" };
var SelectedStart = [];
var SelectedEnd = [];
var StartSelect = false;
var cells = [];
var currPath = [];
canvas.width = XDist + SqSize * mapM + ctx.lineWidth;
canvas.height = YDist + SqSize * mapN + ctx.lineWidth;

rowEdit.value = mapN;
columnEdit.value = mapM;
SqSizeEdit.value = SqSize;

function generateMap(randPath, randWall) {
	mapN = parseInt(rowEdit.value) > 0 ? parseInt(rowEdit.value): 30;
	mapM = parseInt(columnEdit.value) > 0 ? parseInt(columnEdit.value): 50;
	SqSize = parseInt(SqSizeEdit.value) > 0 ? parseInt(SqSizeEdit.value): 30;
	canvas.width = XDist + SqSize * mapM + ctx.lineWidth;
	canvas.height = YDist + SqSize * mapN + ctx.lineWidth;
	ClearMap();
	map = [];
	cells = [];
	for (var i = 0; i < mapN; i++) {
		cells.push([]);   			  //Создание клеток-объектов для UI 
		map.push([]);     			  //И массива карты для объекта grid в алгоритме
		for (var j = 0; j < mapM; j++) {
			cells[i][j] = new cell(i, j, "free");
			map[i][j] = 0;
		}
	}

	if (randPath) {
		SelectedStart = cells[getRandomInt(0, mapN - 1)][getRandomInt(0, mapM - 1)];
		SelectedEnd = cells[getRandomInt(0, mapN - 1)][getRandomInt(0, mapM - 1)];
		SelectedStart.changeType("start")
		SelectedEnd.changeType("end");
	}

	if (randWall) {
		for (var i = 0; i < mapN; i++) {
			for (var j = 0; j < mapM; j++) {
				if ((Math.random() < wall_percent) && !(cells[i][j].isStartEnd())) {
					map[i][j] = 0;
					cells[i][j].changeType("wall");
				} else {
					map[i][j] = 1;
					if (!cells[i][j].isStartEnd()) cells[i][j].changeType("free");
				}
			}
		}
	}
	MapDraw();
	if (randPath) {
		AStarDraw(SelectedStart, SelectedEnd);
	}
}


function ClearMap() {
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, 665, 665);
}


function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function CoordsEqual(arr1, arr2) {
	return ((arr2) && (arr1[0] == arr2[0]) && (arr1[1] == arr2[1]));
}

function inArray(coords, arr) {
	if (arr.length == 0) return false;
	for (var i = arr.length - 1; i >= 0; i--) {
		if (CoordsEqual(arr[i][0], coords))
			return true;
	}
	return false;
}

function FILL(color, coords) {
	ctx.fillStyle = color;
	var x = XDist + 1 + coords[1] * SqSize;
	var y = YDist + 1 + coords[0] * SqSize;
	ctx.fillRect(x, y, SqSize - 2, SqSize - 2);
}

function div(val, by) {
	return (val - val % by) / by;
}

function absToOtn(x, y) {
	return [div((y - YDist), SqSize), div((x - XDist), SqSize)];
}



function pathClear(path) {
	for (var i = 0; i < path.length; i++) {
		cells[path[i].x][path[i].y].changeType("free");
	}
}

function MapDraw() {
	ClearMap();
	for (var i = 0; i < cells.length; i += 1) //x - j, y -i
		for (var j = 0; j < cells[i].length; j += 1) {
			cells[i][j].changeType();
			ctx.strokeRect(XDist + j * SqSize, YDist + i * SqSize, SqSize, SqSize);
		}
}

function AStarDraw(SelectedStart, SelectedEnd) {
	var graph = new Graph(map);
	var start = graph.grid[SelectedStart.x][SelectedStart.y];
	var end = graph.grid[SelectedEnd.x][SelectedEnd.y];
	currPath = astar.search(graph, start, end);
	for (var i = 0; i < currPath.length - 1; i++) {
		cells[currPath[i].x][currPath[i].y].changeType("path");
	}
}

//////////////////////////////////////////////////Object prototype

function cell(x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type || "free";
}

cell.prototype.changeType = function (type) {
	this.type = type || this.type;
	FILL(colors[this.type], [this.x, this.y]);
}

cell.prototype.isWall = function () {
	return (this.type == "wall");
}
cell.prototype.isFree = function () {
	return (this.type == "free");
}
cell.prototype.isStartEnd = function () {
	return (this.type == "start" || this.type == "end");
}




/////////////////////////////////////////////////////////////Handlers

canvas.onmousemove = function (event) {
	var CurrHandlCoord = absToOtn(event.layerX, event.layerY);
	if (!CoordsEqual(CurrHandlCoord, LastHandlCoord)) {
		if (!cells[CurrHandlCoord[0]][CurrHandlCoord[1]].isWall()) {
			FILL(colors.selected, CurrHandlCoord);
			if (LastHandlCoord&&LastHandlCoord[0]<mapN&&LastHandlCoord[1]<mapM) cells[LastHandlCoord[0]][LastHandlCoord[1]].changeType();
			LastHandlCoord = CurrHandlCoord;
		} else {
			if (LastHandlCoord) cells[LastHandlCoord[0]][LastHandlCoord[1]].changeType();
		}
	}
}

canvas.onclick = function (event) {
	var CurrHandlCoord = absToOtn(event.layerX, event.layerY);
	CurrHandlCoord = cells[CurrHandlCoord[0]][CurrHandlCoord[1]];
	if (!CurrHandlCoord.isWall()) {
		if (!StartSelect) {
			SelectedStart.changeType("free");
			SelectedStart = CurrHandlCoord;
			pathClear(currPath);
			SelectedStart.changeType("start");
			StartSelect = true;
			//map clear
		} else {
			StartSelect = false;
			SelectedEnd.changeType("free");
			SelectedEnd = CurrHandlCoord;
			SelectedEnd.changeType("end");
			AStarDraw(SelectedStart, SelectedEnd);
		}
	}
}

redrawButt.onclick = function (event) {
	generateMap(true, true);
}

/////////////////////////////////////////////////////////////////////////////////////////







generateMap(true, true);



