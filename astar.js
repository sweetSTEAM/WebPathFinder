var astar = {
    ClearParams: function(map) {
        for(var x = 0; x < map.length; x++) {
            for(var y = 0; y < map[x].length; y++) {
                map[x][y].f = 0;
                map[x][y].g = 0;
                map[x][y].h = 0;
                //map[x][y].debug = "";
                map[x][y].parent = null;
                map[x][y].visited = false;
                map[x][y].closed = false;
            }   
        }
    },
    search: function(map, start, end, options) {
        options = [true, false]; 
        this.diagonal = options[0];
        astar.ClearParams(map); //If map wasn't regenerated, all params will remain from previous search
        if (debugEn) visitedCells = [];

            var openData  = [];
        
        var startTime = (new Date()).getTime();

        openData.push(start);
        while (openData.length) {
            var min = 0;
            for(var i=0; i<openData.length; i++) {
                if(openData[i].f < openData[min].f) { min = i; }
            }
            var currentCell = openData[min];

            if (debugEn) visitedCells.push(currentCell);

            //If result has been found, return the traced path
            if (CoordsEqual(currentCell.coords(),end.coords())) {
                var curr = currentCell;
                var path = [];
                while(curr.parent) {
                    path.push(curr);
                    curr = curr.parent;
                }
                var endTime = (new Date()).getTime();
                return [path.reverse(),endTime-startTime,currentCell.g];
            }
 
            //Move curr cell from open to closed, check neighbours
            openData = this.removeCell(openData,currentCell); 
            currentCell.closed = true;
            var neighbours = this.getNeighbours(map, currentCell);
 
            for(var i=0; i<neighbours.length;i++) {
                var neighbour = neighbours[i];
                if(neighbour.closed || neighbour.isWall() || this.isWallCorner(neighbour,currentCell)) {
                    // if cell is not a valid to process, skip to next neighbour
                    continue;
                }
 
                // g score is the shortest distance from start to current cell, we need to check if
                //   the path we have arrived at this neighbour is the shortest one we have seen yet
                var gScore = this.getG(neighbour,currentCell); // 1 is the distance from a cell to it's neighbour
 
 
                if(!neighbour.visited) {
                    // This the the first time we have arrived at this cell, it must be the best
                    // Also, we need to take the h (heuristic) score since we haven't done so yet
                    neighbour.h = astar.heuristic(neighbour, end);
                    openData.push(neighbour);
                    neighbour.visited = true;
                }
                else if(gScore > neighbour.g) {
                    // We have already seen the cell and last time it had a less g and we do nothing
                    continue;
                }

                // Found an optimal (so far) path to this cell.  Store info on how we got here and
                
                this.setNewParent(neighbour,currentCell,gScore);
            }
        }
 
        // No path was found, empty array signifies failure to find path
        var endTime = (new Date()).getTime();
        return [[],endTime-startTime,0];
    },
    getG: function (cell, parent) {
        return (parent.g + Math.sqrt(Math.abs(cell.i-parent.i)+Math.abs(cell.j-parent.j)));
    },
    setNewParent: function(cell, parent, G) {
        cell.parent = parent;
        cell.g = G;
        cell.f = cell.g + cell.h;
        //cell.debug = "F: " + cell.f + "<br />G: " + cell.g + "<br />H: " + cell.h;
    },
    isWallCorner: function (cell,parent) {
        if (Math.abs(cell.i-parent.i)+Math.abs(cell.j-parent.j)!=2)
            return false;
        return (map[cell.i][parent.j].isWall()||map[parent.i][cell.j].isWall());
    },
    removeCell: function(list, cell) {
        var retList = [];
        for (var i = list.length - 1; i >= 0; i--) {
            if (!CoordsEqual(list[i].coords(), cell.coords()))
                retList.push(list[i]);
        }
        return retList;
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
