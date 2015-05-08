'use strict';
var canvas = document.getElementById('map');
console.log(canvas);
var ctx = canvas.getContext('2d');
var anim = document.getElementById('anim');
var ctx2 = anim.getContext('2d');
var redrawButt = document.getElementById('redrawButt');
var rowEdit = document.getElementById('rowEdit');
var columnEdit = document.getElementById('columnEdit');
var SqSizeEdit = document.getElementById('SqSizeEdit');
var WallEdit = document.getElementById('WallEdit');
var wallbutt = document.getElementById('wallbutt');
var pathbutt = document.getElementById('pathbutt');
var checkGrid = document.getElementById('checkGrid');
ctx2.fillStyle = "#000000";
ctx2.fillRect(0, 0, anim.width, anim.height);
//
ctx.lineWidth = 1;
var XDist = 1;
var YDist = 21;
var SqSize = 30;
var map = [];
var wall_percent = 0.125;
var mapN = 30;
var mapM = 30;
var cells = [];
var LastHandlCoord = false;
var colors = { "free": "#FFFFFF", "wall": "#505050", "start": "#B00000", "end": "#B00000", "path": "#6495ED", "selected": "red" };
var SelectedStart = false;
var SelectedEnd = false;
var StartSelect = false;
var cells = [];
var currPath = [];
var currStatus = "selected";
var gridEn = true;

canvas.width = XDist + SqSize * mapM + ctx.lineWidth;
canvas.height = YDist + SqSize * mapN + ctx.lineWidth;

rowEdit.value = mapN;
columnEdit.value = mapM;
SqSizeEdit.value = SqSize;
WallEdit.value = wall_percent*100;

function generateMap(randPath, randWall) {
	mapN = parseInt(rowEdit.value) > 0 ? parseInt(rowEdit.value): mapN;
	mapM = parseInt(columnEdit.value) > 0 ? parseInt(columnEdit.value): mapM;
	SqSize = parseFloat(SqSizeEdit.value) > 0 ? parseFloat(SqSizeEdit.value): SqSize;
	wall_percent = parseInt(WallEdit.value) >= 0 ? WallEdit.value/100: wall_percent;
	canvas.width = XDist + SqSize * mapM + ctx.lineWidth;
	canvas.height = YDist + SqSize * mapN + ctx.lineWidth;
	ClearMap();
	map = [];
	cells = [];
	for (var i = 0; i < mapN; i++) {
		cells.push([]);   			 
		map.push([]);     			  
		for (var j = 0; j < mapM; j++) {
			cells[i][j] = new cell(i, j, "free");
			map[i][j] = 1;
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
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}


function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function CoordsEqual(arr1, arr2) {
	return ((arr2) && (arr1[0] == arr2[0]) && (arr1[1] == arr2[1]));
}

function FILL(color, coords) {

	ctx.fillStyle = color;
	var x = XDist + 1 + coords[1] * SqSize;
	var y = YDist + 1 + coords[0] * SqSize;
	ctx.fillRect(x, y, gridEn ? SqSize - 1: SqSize, gridEn ? SqSize - 1: SqSize);
}

function FILLanim(color, x, y) {

	ctx2.fillStyle = color;
	var i = 6;
	var inter = setInterval(function () {
		anim.style.display = "block";
		anim.style.left = x-i + "px";
		anim.style.top = y-i + "px";
		anim.height = SqSize+i*2;
		anim.width = SqSize+i*2;
		ctx2.fillStyle = color;
		ctx2.fillRect(0, 0, anim.height, anim.height);
		if (!(i-=1)) {anim.style.display = "none"; clearInterval(inter);}
	}, 20);
	// ctx2.fillRect(x, y, gridEn ? SqSize - 1: SqSize, gridEn ? SqSize - 1: SqSize);
	// if (gridEn) ctx2.strokeRect(x - 0.5, y - 0.5, SqSize, SqSize);
}

function div(val, by) {
	return (val - val % by) / by;
}

function absToOtn(x, y, xabs, yabs) {
	var i = div((y - YDist), SqSize);
	var j = div((x - XDist), SqSize)
	return [i, j, XDist + 1 + j * SqSize+(xabs-x), YDist + 1 + i * SqSize+(yabs-y)];
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
			if (gridEn)
				ctx.strokeRect(XDist + 0.5 /* Аутизм */ + j * SqSize, YDist + 0.5 + i * SqSize, SqSize, SqSize);
			cells[i][j].changeType();
		}
}

function pathDrowTik (path, i) {
	cells[currPath[i].x][currPath[i].y].changeType("path");
}

function AStarDraw(SelectedStart, SelectedEnd) {
	var graph = new Graph(map);
	var start = graph.grid[SelectedStart.x][SelectedStart.y];
	var end = graph.grid[SelectedEnd.x][SelectedEnd.y];
	currPath = astar.search(graph, start, end);
	var i = 0;
	if (currPath.length>1)
		var inter = setInterval(function () {
			pathDrowTik(currPath,i);
			if ((i+=1)==currPath.length-1) clearInterval(inter); 
		}, 15);
	// for (var i = 0; i < currPath.length - 1; i++) {
	// 	cells[currPath[i].x][currPath[i].y].changeType("path");
	// }
}

///////////////////////////////////////////////////////Object prototype

function cell(x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type || "free";
}

cell.prototype.changeType = function (type,anim,PageX,PageY) {
	this.type = type || this.type;
	if (anim)
		FILLanim(colors[this.type], PageX, PageY);
	else
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
	var CurrHandlCoord = absToOtn(event.layerX, event.layerY, event.pageX, event.pageY);
	if (CurrHandlCoord[0]<mapN&&CurrHandlCoord[1]<mapM&&!CoordsEqual(CurrHandlCoord, LastHandlCoord)) {
		CurrHandlCoord = cells[CurrHandlCoord[0]][CurrHandlCoord[1]];
		if (!CurrHandlCoord.isWall()) {
			FILL(colors[currStatus], [CurrHandlCoord.x,CurrHandlCoord.y]);
			if (LastHandlCoord&&LastHandlCoord[0]<mapN&&LastHandlCoord[1]<mapM) cells[LastHandlCoord[0]][LastHandlCoord[1]].changeType();
			LastHandlCoord = [CurrHandlCoord.x,CurrHandlCoord.y];
		} else {
			if (LastHandlCoord) cells[LastHandlCoord[0]][LastHandlCoord[1]].changeType();
		}
	}
}

canvas.onclick = function (event) {
	var CurrHandlCoord = absToOtn(event.layerX, event.layerY, event.pageX, event.pageY);
	var PageX = CurrHandlCoord[2];
	var PageY = CurrHandlCoord[3];
	CurrHandlCoord = cells[CurrHandlCoord[0]][CurrHandlCoord[1]];
	if (currStatus=="selected") {
		if (!CurrHandlCoord.isWall()) {
			if (!StartSelect) {
				if (SelectedEnd)
					SelectedStart.changeType("free");
				SelectedStart = CurrHandlCoord;
				pathClear(currPath);
				SelectedStart.changeType("start",true,PageX,PageY);
				StartSelect = true;
			} else {
				StartSelect = false;
				if (SelectedEnd)
					SelectedEnd.changeType("free");
				SelectedEnd = CurrHandlCoord;
				SelectedEnd.changeType("end",true,PageX,PageY);
				AStarDraw(SelectedStart, SelectedEnd);
			}
		}
	} else {
		if (!CurrHandlCoord.isStartEnd()) { //TODO: onclick + onmousemove
			if (CurrHandlCoord.isFree()) {
				CurrHandlCoord.changeType("wall",true,PageX,PageY);
				map[CurrHandlCoord.x][CurrHandlCoord.y] = 0;
			} else {
				if (CurrHandlCoord.isWall()) {
					CurrHandlCoord.changeType("free");
					map[CurrHandlCoord.x][CurrHandlCoord.y] = 1;
				}
			}
		}
	}
}

wallbutt.onchange = function (event) {
	currStatus = "wall";
}

checkGrid.onchange = function (event) {
	gridEn = !gridEn;
	generateMap(false, true);
}

pathbutt.onchange = function (event) {
	currStatus = "selected";
}

redrawButt.onclick = function (event) {
	generateMap(false, true);
}

/////////////////////////////////////////////////////////////////////////////////////////







generateMap(false, true);



