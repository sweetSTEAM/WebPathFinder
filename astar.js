var astar = {
    ClearParams: function(map) {
        for(var x = 0; x < map.length; x++) {
            for(var y = 0; y < map[x].length; y++) {
                map[x][y].f = 0;
                map[x][y].g = Infinity;
                map[x][y].h = 0;
                //map[x][y].debug = "";
                map[x][y].parent = null;
                map[x][y].visited = false;
                map[x][y].closed = false;
            }   
        }
    },
    search: function(map, start, end, options) {
        options = options || [true, true]; 
        this.diagonal = options[0];
        this.UseAstar = options[1];
        astar.ClearParams(map); //If map wasn't regenerated, all params will remain from previous search
        start.g = 0;
        if (debugEn) visitedCells = [];
        var openData  = [];
        var startTime = (new Date()).getTime();
        openData.push(start);
        while (openData.length) {
            var currentCell = this.extractMin(openData);
            currentCell.closed = true;
            if (debugEn) visitedCells.push(currentCell);
            //If result has been found, return the traced path
            if (CoordsEqual(currentCell.coords(),end.coords())) {
                return [this.pathTo(end),(new Date()).getTime()-startTime,currentCell.g];
            }
            //Move curr cell from open to closed, check neighbours
            var neighbours = this.getNeighbours(map, currentCell);
            for(var i=0; i<neighbours.length;i++) {
                var neighbour = neighbours[i];
                if(neighbour.closed || neighbour.isWall() || this.isWallCorner(neighbour,currentCell,map)) {
                    // if cell is not a valid to process, skip to next neighbour
                    continue;
                }
                // g score is the shortest distance from start to current cell, we need to check if
                //   the path we have arrived at this neighbour is the shortest one we have seen yet
                var newG = this.getG(neighbour,currentCell); // 1 is the distance from a cell to it's neighbour
 
                if (neighbour.g > newG) {
                    // This the the first time we have arrived at this cell, it must be the best
                    // Also, we need to take the h (heuristic) score since we haven't done so yet
                    neighbour.h = this.UseAstar ? astar.heuristic(neighbour, end): 0;
                    // Found an optimal (so far) path to this cell.  Store info on how we got here and
                    this.relax(neighbour,currentCell,newG);
                    neighbour.f = neighbour.g + neighbour.h;
                    if (!neighbour.visited) {
                        openData.push(neighbour);
                        neighbour.visited = true;
                    }
                }
            }
        }
        // No path was found, empty array signifies failure to find path
        var endTime = (new Date()).getTime();
        return [[],endTime-startTime,0];
    },
    pathTo: function (cell) {
        var path = [];
        while (cell.parent) {
            path.push(cell);
            cell = cell.parent;
        }
        return path.reverse();
    },
    getG: function (cell, newparent) {
        return (newparent.g + Math.sqrt(Math.pow(cell.i-newparent.i,2)+Math.pow(cell.j-newparent.j,2)));
    },
    relax: function(cell, newparent, G) {
        cell.parent = newparent;
        cell.g = G;
    },
    isWallCorner: function(cell,parent,map) {
        if ((!this.diagonal)||Math.abs(cell.i-parent.i)+Math.abs(cell.j-parent.j)!=2)
            return false;
        return (map[cell.i][parent.j].isWall()||map[parent.i][cell.j].isWall());
    },
    extractMin: function(openData) {
        //too slow

        var min = 0;
        for(var i=0; i<openData.length; i++) {
            if(openData[i].f < openData[min].f) { min = i; }
        }
        var cell = openData[min];
        var p = 0;
        for (var i = 0; i < openData.length; i++) {
            if (!CoordsEqual(openData[i].coords(), cell.coords()))
                openData[p++] = openData[i];
        }
        openData.length = p;
        return cell;
    },
    heuristic: function(pos0, pos1) {
        //Diagonal distance
        var D = 1;
        var D2 = Math.sqrt(2);
        var d1 = Math.abs(pos1.i - pos0.i);
        var d2 = Math.abs(pos1.j - pos0.j);
        return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    },
    getNeighbours: function(map, cell) {
        var ret = [];
        var i = cell.i;
        var j = cell.j;
        if (this.diagonal)
            var rel = [[-1,-1],[0,-1],[1,-1],
                       [-1, 0],       [1, 0],
                       [-1, 1],[0, 1],[1, 1]];
        else
            var rel = [        [0,-1],
                        [-1,0],       [1,0],
                               [0, 1]       ];
        for (var p in rel) {
            if(map[i+rel[p][1]] && map[i+rel[p][1]][j+rel[p][0]]) {
                ret.push(map[i+rel[p][1]][j+rel[p][0]]);
            }
        }
        return ret;
    }
};
