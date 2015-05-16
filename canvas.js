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
var edits = ['#rowEdit','#WallEdit','#columnEdit','#SqSizeEdit'];
ctx2.fillStyle = "#000000";
ctx2.fillRect(0, 0, anim.width, anim.height);
var docHeight = $(document).height()-$("#navbar").height();
var docWidth = $(document).width();
var XDist = 1;
var YDist = 21;
var SqSize = 30;
var map = [];
var wallPercent = 0.125;
var mapN = Math.floor(docHeight/SqSize)-1;
var mapM = Math.floor(docWidth/SqSize)-1;
var map = [];
var LastHandlCoord = false;
var colors = { "free": "#FFFFFF", "wall": "#505050", "start": "#B00000", "end": "#B00000", "path" : "#E51A4C", "open": "#6495ED", "selected": "red" };
var SelectedStart = false;
var SelectedEnd = false;
var StartSelect = false;
var map = [];
var currPath = false;
var currStatus = "selected";
var gridEn = true;
var visitedCells = false;
var debugEn = false;
var wallPressed = false;
canvas.width = XDist + SqSize * mapM + 1;
canvas.height = YDist + SqSize * mapN + 1;

rowEdit.value = mapN;
columnEdit.value = mapM;
SqSizeEdit.value = SqSize;
WallEdit.value = wallPercent*100;

function generateMap(randPath, randWall) {
	ctx.lineWidth = 1;
	visitedCells = false;
	currPath = false;
	mapN = parseInt(rowEdit.value) > 0 ? parseInt(rowEdit.value): mapN;
	mapM = parseInt(columnEdit.value) > 0 ? parseInt(columnEdit.value): mapM;
	SqSize = parseFloat(SqSizeEdit.value) > 0 ? parseFloat(SqSizeEdit.value): SqSize;
	wallPercent = parseInt(WallEdit.value) >= 0 ? WallEdit.value/100: wallPercent;
	canvas.width = XDist + SqSize * mapM + 1;
	canvas.height = YDist + SqSize * mapN + 1;
	ClearMap();
	map = [];
	for (var i = 0; i < mapN; i++) {
		map.push([]);   			      			  
		for (var j = 0; j < mapM; j++) {
			map[i][j] = new cell(i, j, "free");
		}
	}

	if (randPath) {
		SelectedStart = map[getRandomInt(0, mapN - 1)][getRandomInt(0, mapM - 1)];
		SelectedEnd = map[getRandomInt(0, mapN - 1)][getRandomInt(0, mapM - 1)];
		SelectedStart.changeType("start")
		SelectedEnd.changeType("end");
	}

	if (randWall) {
		for (var i = 0; i < mapN; i++) {
			for (var j = 0; j < mapM; j++) {
				if ((Math.random() < wallPercent) && !(map[i][j].isStartEnd())) {
					map[i][j].changeType("wall");
				} else {
					if (!map[i][j].isStartEnd()) map[i][j].changeType("free");
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
	if (gridEn) {ctx.strokeStyle="#000000";ctx.strokeRect(x-0.5, y-0.5, SqSize, SqSize);}
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
		ctx2.strokeRect(0, 0, anim.height, anim.height);
		if (!(i-=1)) {anim.style.display = "none"; clearInterval(inter);}
	}, 20);
}

function div(val, by) {
	return (val - val % by) / by;
}

function absToOtn(x, y, xabs, yabs) {
	var i = div((y - YDist), SqSize);
	var j = div((x - XDist), SqSize)
	return [i, j, XDist + 1 + j * SqSize+(xabs-x), YDist + 1 + i * SqSize+(yabs-y)];
}

function otnToAbsX(j) {
	var x = XDist + (j+1) * SqSize;
	return x;
}

function otnToAbsY(i) {
	var y = YDist + (i+1) * SqSize;
	return y;
}

function pathClear(path,open) {
	if (path) {
		if (SelectedStart) {
			SelectedStart.changeType("free");
			if (map[SelectedStart.i-1]&&map[SelectedStart.i-1][SelectedStart.j])
					map[SelectedStart.i-1][SelectedStart.j].changeType();
			SelectedEnd.changeType("free");
		}
		for (var i = 0; i < path.length; i++) {
			var currCell = path[i];
			if (currCell.isPath()||currCell.isStartEnd()) {
				currCell.changeType("free");
				if (map[currCell.i-1]&&map[currCell.i-1][currCell.j])
					map[currCell.i-1][currCell.j].changeType();
			}
		}
		for (i = 0; i < open.length; i++) {
			var currCell = map[open[i].i][open[i].j];
			if (currCell.isOpen())
				currCell.changeType("free");
		}
	}
}

function MapDraw() {
	ClearMap();
	for (var i = 0; i < map.length; i += 1)
		for (var j = 0; j < map[i].length; j += 1) {
			if (gridEn)
				ctx.strokeRect(XDist + 0.5 /* Аутизм */ + j * SqSize, YDist + 0.5 + i * SqSize, SqSize, SqSize);
			map[i][j].changeType();
		}
}

function pathDraw() {
	ctx.beginPath();
	ctx.moveTo(otnToAbsX(SelectedStart.j)-SqSize/2,otnToAbsY(SelectedStart.i)-SqSize/2);
	var i = 0; 
	if (currPath.length>1) {
		var inter = setInterval(function () {
			currPath[i].changeType("path");
			ctx.lineWidth = 1.5;
			ctx.lineTo(otnToAbsX(currPath[i].j)-SqSize/2,otnToAbsY(currPath[i].i)-SqSize/2);
			ctx.strokeStyle = colors["path"];
			ctx.stroke();
			ctx.lineWidth = 1;
			if (i==currPath.length-1) clearInterval(inter);
			i++;
		}, 10);
	}
}

function AStarDraw(SelectedStart, SelectedEnd) {
	visitedCells = false;
	currPath = astar.search(map, SelectedStart, SelectedEnd, [true]);
	
	
	var p = 0;
	if (debugEn) {
		var inter2 = setInterval(function() {
			if (p<visitedCells.length) {
		        if (!visitedCells[p].isStartEnd()) {
		           visitedCells[p].changeType("open");
		        }
		        p++;
		    } else {
		    	clearInterval(inter2);
		    	pathDraw();
		    }
	    }, 10);
	} else {
		pathDraw();
	}
}

///////////////////////////////////////////////////////Cell prototype

function cell(x, y, type) {
	//init
	this.i = x;
	this.j = y;
	this.type = type || "free";
	this.f = 0;
    this.g = 0;
    this.h = 0;
    this.debug = "";
    this.parent = null;
}

cell.prototype.changeType = function (type,anim,PageX,PageY) {
	this.type = type || this.type;
	if (anim) {
		FILLanim(colors[this.type], PageX, PageY);
		FILL(colors[this.type], [this.i, this.j]);
	}
	else
		if (!this.isPath()) FILL(colors[this.type], [this.i, this.j]);
}

cell.prototype.coords = function () {
	return [this.i,this.j];
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
cell.prototype.isEnd = function () {
	return (this.type == "end");
}
cell.prototype.isPath = function () {
	return (this.type == "path");
}
cell.prototype.isOpen = function () {
	return (this.type == "open");
}


var CurrHandlCoord = false;

/////////////////////////////////////////////////////////////Handlers
function FILL2(color, x, y) {
	anim.style.display = "block";
	anim.style.left = x + 1 + "px";
	anim.style.top = y + 1 + "px";
	anim.height = SqSize-1;
	anim.width = SqSize-1;
	ctx2.fillStyle = color;
	ctx2.fillRect(0, 0, anim.height, anim.height);
}


canvas.onmousemove = function (event) {
	CurrHandlCoord = absToOtn(event.layerX, event.layerY, event.pageX, event.pageY);
	var PageX = CurrHandlCoord[2];
	var PageY = CurrHandlCoord[3];
	if (CurrHandlCoord[0]<mapN&&CurrHandlCoord[1]<mapM&&!CoordsEqual(CurrHandlCoord, LastHandlCoord)) {
		var _CurrHandlCoord = map[CurrHandlCoord[0]][CurrHandlCoord[1]];

		if (!_CurrHandlCoord.isWall()) {
			FILL2(colors[currStatus], PageX, PageY);
		} else {
			if (LastHandlCoord) {anim.style.display = "none";};
		}
		if (currStatus=="wall"&&wallPressed) {
			if (!_CurrHandlCoord.isStartEnd()) { //TODO: onclick + onmousemove
				if (_CurrHandlCoord.isWall()) {
					_CurrHandlCoord.changeType("free",true,PageX,PageY);
				} else {
					_CurrHandlCoord.changeType("wall",true,PageX,PageY);
				}
			}
		}
		LastHandlCoord = CurrHandlCoord;
	}
}

for (var i in ["#map","#anim"]) {
	$(["#map","#anim"][i]).mousedown(
		function (event) {
			var _CurrHandlCoord = map[CurrHandlCoord[0]][CurrHandlCoord[1]];
			var PageX = CurrHandlCoord[2];
			var PageY = CurrHandlCoord[3];
			if (currStatus=="selected") {
				if (!_CurrHandlCoord.isWall()) {
					if (!StartSelect) {
						pathClear(currPath,visitedCells);
						SelectedStart = _CurrHandlCoord;		
						SelectedStart.changeType("start",true,PageX,PageY);
						StartSelect = true;
					} else {
						StartSelect = false;
						SelectedEnd = _CurrHandlCoord;
						SelectedEnd.changeType("end",true,PageX,PageY);
						AStarDraw(SelectedStart, SelectedEnd);
					}
				}
			} else {
				wallPressed = true;
				if (!_CurrHandlCoord.isStartEnd()) { //TODO: onclick + onmousemove
					if (_CurrHandlCoord.isWall()) {
						_CurrHandlCoord.changeType("free",true,PageX,PageY);
					} else {
						_CurrHandlCoord.changeType("wall",true,PageX,PageY);
					}
				}
			}
		}
	)
	$(["#map","#anim"][i]).mouseup(
		function (event) {
			wallPressed = false;
		}
	)
}
wallbutt.onchange = function (event) {
	currStatus = "wall";
}

checkGrid.onchange = function (event) {
	gridEn = !gridEn;
	generateMap(false, true);
}

checkDebug.onchange = function (event) {
	debugEn = !debugEn;
}

pathbutt.onchange = function (event) {
	currStatus = "selected";
}

redrawButt.onclick = function (event) {
	generateMap(false, true);
}

for (var i in edits) {
	$(edits[i]).keydown(
		function(key) {
			var enterKey = 13;
			if (key.which == enterKey)
				generateMap(false, true);
		}
	)
}

/////////////////////////////////////////////////////////////////////////////////////////


generateMap(false, true);



