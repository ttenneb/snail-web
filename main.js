const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height=innerHeight;
const menu = document.getElementById("menu");
const snailTable = document.getElementById("snails");
const enableRemover = document.getElementById("remover");
const table = document.getElementById("table");
const tbodyRef = table.getElementsByTagName('tbody')[0];


let snailRowMap = new Map();


let image = new MarvinImage();
let image_original;
let image_original2;
let mouseDown = false;
let shiftDown = false;
let mouse_x = 0;
let mouse_y = 0;
let mouse_down_x = 0;
let mouse_down_y = 0;
let mouse_up_x = 0;
let mouse_up_y = 0;
let box_position = {
    "x1": 0,
    "x2":0,
    "y1": 0,
    "y2": 0
}
let box_height = 0;
let box_width = 0;
let scaledValue = 0;
let scaledVectors = [{},{}];
let loaded = false;
//TODO unload

var working_image = new MarvinImage();
var working_image_original = new MarvinImage();
let selection = new MarvinImage();
var snailPts = [];
let snailMeasuredPoints = [];
let penStack = {x:0, y:0};

let canvas_width = canvas.clientWidth;
let canvas_height = canvas.clientHeight;
// canvas.clientHeight = 720;

var scaleValue = document.getElementById("scale");
let selectedSnail = -1;
let species = "Not Specified"
let showProcessed = false;

var currentTool = select;
let inCanvas = false;


let snailSearchRange = 3;

const panzoom = Panzoom(canvas, {
    maxScale: 5,
    exclude: [canvas]
})
const panzoomMenu = Panzoom(menu, {
    maxScale: 1,
    disableZoom: true,
    exclude: [scaleValue]
})
const panzoomTable = Panzoom(snailTable, {
    maxScale: 1,
    disableZoom: true,
    exclude: []
})
canvas.style.cursor = "crosshair";



// GUHGUGHGHGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHh
document.getElementById("canvas").addEventListener("mouseenter", () => {inCanvas = true;});
document.getElementById("canvas").addEventListener("mouseout", () => {inCanvas = false;});

document.getElementById("bio").addEventListener("click", () => species = "Biomphalaria")
document.getElementById("mel").addEventListener("click", () => species = "Melanoides")
document.getElementById("phy").addEventListener("click", () => species = "Physa")

document.getElementById("sel").addEventListener("click", selectButton);
function selectButton(){
    currentTool = select;
}

document.getElementById("scl").addEventListener("click", scaleButton);
function scaleButton(){
    currentTool = scale;
}
document.getElementById("pen").addEventListener("click", penButton);
function penButton(){
    currentTool = pen;

}
document.getElementById("erase").addEventListener("click", eraseButton);
function eraseButton(){
    currentTool = erase;

}
document.getElementById("download").addEventListener("click", downloadButton);
function downloadButton(){
   let output = "X, Y, Species, Length (mm) \n"
    snailMeasuredPoints.forEach((s) => {
       output += s.x1 + ", " + s.y1 + ", " + s.species+  ", " + s.max + '\n';
    });
    download("output.csv", output)
}
document.getElementById("show").addEventListener("click", () => {
    showProcessed = !showProcessed;
    draw();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") panzoom.setOptions({
        maxScale: 5,
        exclude: []
    });
});
document.addEventListener("keyup", (e) => {
    if (e.key === "Shift")panzoom.setOptions({
        maxScale: 5,
        exclude: [canvas]
    });
});

document.getElementById("panzoom-button").addEventListener("click", panzoomButton);
function panzoomButton(){
    if(panzoom.getOptions().exclude.length == 1){
        panzoom.setOptions({
            maxScale: 5,
            exclude: []
        });
        canvas.style.cursor = "crosshair";
    }else{

        panzoom.setOptions({
            maxScale: 5,
            exclude: [canvas]
        });
        canvas.style.cursor = "gran";
    }

}
document.getElementById("myFile").addEventListener("input", upload)
function upload() {
    image.load(URL.createObjectURL(document.getElementById("myFile").files[0]), function () {
        working_image = image.clone();

        var temp = new MarvinImage();
        Marvin.scale(image, temp, canvas_width, canvas_height);
        image = temp;
        working_image = image.clone();
        working_image_original = image.clone();
        for (let i = 0; i < image.getWidth(); i++) {
            for (let j = 0; j < image.getHeight(); j++) {
                if (compareColor(-1, 60, 40, image, i, j) == -1) {
                    image.setIntColor(i, j, 250, 0, 0, 250);
                } else snailPts.push([[i, j]]);
            }
        }
        image_original = image.clone();
        image_original2 = image.clone();
        loaded = true;
        draw();

    });
}
document.getElementById("myFile").click();
function pen(){
    drawLine(Math.floor(penStack.x),Math.floor(penStack.y), Math.floor(mouse_x), Math.floor(mouse_y), 4, 0xFF0000FF, image);
    drawLine(Math.floor(penStack.x),Math.floor(penStack.y), Math.floor(mouse_x), Math.floor(mouse_y), 4, 0xFF0000FF, image_original)
    drawLine(Math.floor(penStack.x),Math.floor(penStack.y), Math.floor(mouse_x), Math.floor(mouse_y), 4, 0xFF0000FF, working_image)
    // image.fillRect(Math.floor(point.x-4), Math.floor(point.y-4), 8,8, 0xFF0000FF);
    // image_original.fillRect(Math.floor(point.x-4), Math.floor(point.y-4), 8,8, 0xFF0000FF);
    // working_image.fillRect(Math.floor(point.x-4), Math.floor(point.y-4), 8,8, 0xFF0000FF);
    
}
function erase(){
    for(let i = Math.floor(box_position.x1); i < box_position.x1+box_width; i++){
        for(let j = Math.floor(box_position.y1); j < box_height+box_position.y1; j++){
            working_image.setIntColor(i,j,working_image_original.getIntColor(i,j));
            image.setIntColor(i,j,image_original2.getIntColor(i,j));
            image_original.setIntColor(i,j,image_original2.getIntColor(i,j));
        }
    }
    
}
function select(){
    if(isValidSelection())
        crop();
}
function scale(){
    scaledVectors[0].x = mouse_down_x;
    scaledVectors[0].y = mouse_down_y;
    scaledVectors[1].x = mouse_x;
    scaledVectors[1].y = mouse_y;

    let distance = Math.sqrt(Math.pow(mouse_down_x - mouse_up_x, 2) + Math.pow(mouse_down_y - mouse_up_y, 2));
    let x = parseInt(scaleValue.value)
    if(x > 0){

        scaledValue = x/distance;
    }
}


canvas.parentElement.addEventListener("mousedown", (event) => {
    mouseDown = true;
    let pos = getMousePos(canvas, event);
    mouse_down_x = pos.x;
    mouse_down_y = pos.y;
});
canvas.parentElement.addEventListener("mouseup", (event) => {
    mouseDown = false;
    let pos = getMousePos(canvas, event);
    mouse_up_x = pos.x;
    mouse_up_y = pos.y;
    

    box_position.x1 = Math.min(mouse_down_x, mouse_up_x);
    box_position.y1 = Math.min(mouse_down_y, mouse_up_y);
    if(inCanvas) currentTool();

});
canvas.parentElement.addEventListener("mousemove", (event) => {
    let pos = getMousePos(canvas, event)
    penStack.x = mouse_x;
    penStack.y = mouse_y;
    mouse_x = pos.x;
    mouse_y = pos.y;
    if(mouseDown){
        box_width = (pos.x-mouse_down_x);
        box_height = (pos.y-mouse_down_y);

        if(inCanvas && currentTool === pen ) currentTool();
    }

    draw();
});
canvas.parentElement.addEventListener("wheel", panzoom.zoomWithWheel)

const draw = () => {
    if(loaded){
        ctx.font = '16px serif';
        ctx.fillStyle = "red";
        let imageclone;
        if(!showProcessed)
        
            imageclone = working_image.clone();
        else

           imageclone = image.clone();

        if(mouseDown && inCanvas) {
            if(currentTool === select) {
                if (box_height < 0 && box_height < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y) + Math.floor(box_height), -1 * Math.floor(box_width), -1 * Math.floor(box_height), 0xFFFFFF00);
                } else if (box_height < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y) + Math.floor(box_height), Math.floor(box_width), -1 * Math.floor(box_height), 0xFFFFFF00);
                } else if (box_width < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y), -1 * Math.floor(box_width), Math.floor(box_height), 0xFFFFFF00);
                } else {
                    imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y), Math.floor(box_width), Math.floor(box_height), 0xFFFFFF00);
                }
            }
            if(currentTool === erase) {
                if (box_height < 0 && box_height < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y) + Math.floor(box_height), -1 * Math.floor(box_width), -1 * Math.floor(box_height), 0xFFFF0000);
                } else if (box_height < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y) + Math.floor(box_height), Math.floor(box_width), -1 * Math.floor(box_height), 0xFFFF0000);
                } else if (box_width < 0) {
                    imageclone.drawRect(Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y), -1 * Math.floor(box_width), Math.floor(box_height), 0xFFFF0000);
                } else {
                    imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y), Math.floor(box_width), Math.floor(box_height), 0xFFFF0000);
                }
            }
            else if(currentTool === scale){
                drawLine(Math.floor(mouse_down_x), Math.floor(mouse_down_y),Math.floor(mouse_x), Math.floor(mouse_y),3,0xFFFFFF00, imageclone );
                imageclone.fillRect(Math.floor(mouse_down_x)-5, Math.floor(mouse_down_y)-5, 10, 10, 0xFFFFFF00);
                imageclone.fillRect(Math.floor(mouse_x)-5, Math.floor(mouse_y)-5, 10, 10, 0xFFFFFF00);
            }
        }
        if(scaledValue !=0 ){
            drawLine(Math.floor(scaledVectors[0].x), Math.floor(scaledVectors[0].y),Math.floor(scaledVectors[1].x), Math.floor(scaledVectors[1].y),3,0xFFFFFF00, imageclone );
            imageclone.fillRect(Math.floor(scaledVectors[0].x)-5, Math.floor(scaledVectors[0].y)-5, 10, 10, 0xFFFFFF00);
            imageclone.fillRect(Math.floor(scaledVectors[1].x)-5, Math.floor(scaledVectors[1].y)-5, 10, 10, 0xFFFFFF00);
        }
        snailMeasuredPoints.forEach((p) => {
            drawLine(Math.floor(p.x1), Math.floor(p.y1),Math.floor(p.x2), Math.floor(p.y2),1,0xFFFF0000, imageclone );
        });
        if(selectedSnail != null){
            let s = selectedSnail;

            imageclone.drawRect(Math.floor(s.minx),Math.floor(s.miny),Math.floor(s.maxx-s.minx),Math.floor(s.maxy-s.miny), 0xFF00FF00);
        }
        imageclone.draw(canvas);
        snailMeasuredPoints.forEach((p) => {
            ctx.fillText(p.max.toFixed(2), Math.floor(p.x1)-10, Math.floor(p.y1)-10);
        });
    }
};

function isValidSelection(){
    if(Math.abs(magnitude(mouse_down_x,mouse_down_y)-magnitude(mouse_up_x,mouse_down_y)) > 10) return mouse_down_x +box_width > 0 && mouse_down_y + box_height > 0 && box_height + mouse_down_y < canvas_height && box_width + mouse_down_x < canvas_width;
    else {
        let m = {
            minx: mouse_down_x,
            miny: mouse_down_y,
            maxx: mouse_up_x,
            maxy: mouse_up_y
        }
        snailMeasuredPoints.forEach((s) => {
            if(DoBoxesIntersect(s,m)){
                if(selectedSnail != -1 && selectedSnail != null){
                    snailRowMap.get(selectedSnail).style.background = "lightgrey";
                }
                selectedSnail = s;
                snailRowMap.get(selectedSnail).style.background = "grey";
                draw();
            }
        });
    }
}
function crop(){
        if (box_height < 0 && box_width < 0) {
            //TODO do scale before floor
            Marvin.crop(image_original, selection,Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y) + Math.floor(box_height), -1 * Math.floor(box_width), -1 * Math.floor(box_height));
        } else if (box_height < 0) {
            Marvin.crop(image_original, selection,Math.floor(mouse_down_x), Math.floor(mouse_down_y) + Math.floor(box_height), Math.floor(box_width), -1* Math.floor(box_height));
        } else if (box_width < 0) {
            Marvin.crop(image_original, selection,Math.floor(mouse_down_x) + Math.floor(box_width), Math.floor(mouse_down_y), -1 * Math.floor(box_width), Math.floor(box_height));
        } else {
            Marvin.crop(image_original, selection,Math.floor(mouse_down_x), Math.floor(mouse_down_y), Math.floor(box_width), Math.floor(box_height));
        }

    process();
}
async function process(){
    Marvin.prewitt(selection.clone(), selection);
    //image = selection;
    let edges = [];
    let edgeMap = new Map()
    for(let i = 0; i < selection.getWidth(); i++){
        for(let j = 0; j < selection.getHeight(); j++){
            if(selection.getIntComponent0(i,j) > 80 && selection.getIntComponent2(i,j) > 230){
                edgeMap.set(i+j*image.getWidth(), edges.length);
                edges.push({x:i,y:j, assigned: -1});
            }
        }
    }
    let snails = [];
    for(const e of edges){
       if(e.assigned == -1){
           snails[snails.length] = [];
           search(e, edgeMap, edges, snails.length - 1, snails);
       }
    };
    snails.forEach((edgeList) =>
    {
        if(edgeList.length < 10) return;
        let max = 0;
        let x = {"min": 99999999, "max": 0}, y = {"min": 99999999, "max": 0};
        let jmax = 0;
        let current = snailMeasuredPoints.length;
        edgeList.forEach((s) => {
            image.setIntColor(Math.floor(s.x+box_position.x1), Math.floor(s.y+box_position.y1), 0xFFFF0000);
            if (s.x < x.min) {
                x.min = s.x
            }
            if (s.x > x.max) {
                x.max = s.x
            }
            if (s.y < y.min) {
                y.min = s.y
            }
            if (s.y > y.max) {
                y.max = s.y
            }
        });
        if(edgeList.length > 200)
            if(enableRemover.checked) edgeList = calculateOutliers(edgeList);

        for (let i = 0; i < edgeList.length; i++) {
            let pointMax = 0;
            
            for (let j = i; j < edgeList.length; j++) {
                let dist = Math.sqrt(Math.pow(edgeList[i].x - edgeList[j].x, 2) + Math.pow(edgeList[i].y - edgeList[j].y, 2));
                if (dist > pointMax) {
                    jmax = j;
                    pointMax = dist;
                }
            }
            if (max < pointMax) {
                max = pointMax;
                if(max*scaledValue > 2) snailMeasuredPoints[current] = {
                    "x1": edgeList[i].x + box_position.x1,
                    "y1": edgeList[i].y + box_position.y1,
                    "x2": edgeList[jmax].x + box_position.x1,
                    "y2": edgeList[jmax].y + box_position.y1,
                    "max": max * scaledValue,
                    "minx": x.min + box_position.x1,
                    "maxx": x.max + box_position.x1,
                    "miny": y.min + box_position.y1,
                    "maxy": y.max + box_position.y1,
                    "species": species,
                    "toBeDeleted": false
                };

            }
        }

        if(max * scaledValue > 2) {
            parseSnail(max * scaledValue);
        }
    });
    let toBeDeleted = [];
    for(let i = 0; i < snailMeasuredPoints.length; i++){
        for(let j = i+1; j < snailMeasuredPoints.length; j++){
            if(DoBoxesIntersect(snailMeasuredPoints[i], snailMeasuredPoints[j])){

                let min = Math.min(snailMeasuredPoints[i].max, snailMeasuredPoints[j].max);
                if(min == snailMeasuredPoints[i].max){
                    toBeDeleted.push(i);
                }else if(min == snailMeasuredPoints[j].max){
                    toBeDeleted.push(j);
                }

            }
        }
    }
    
    for(let i = toBeDeleted.length-1; i > -1; i--){
        removeSnail(snailMeasuredPoints[toBeDeleted[i]]);
    }    
}
function search(e, edgeMap, edges, snail, snails) {
    let index = edgeMap.get(e.x+e.y*image.getWidth());
    if(index != undefined && edges[index].assigned == -1){
        edges[index].assigned = snail;
        for(let i = 1; i <= snailSearchRange; i++) {
            search({x: e.x + i, y: e.y}, edgeMap, edges, snail, snails);
            search({x: e.x, y: e.y + i}, edgeMap, edges, snail, snails);
            search({x: e.x + i, y: e.y + i}, edgeMap, edges, snail, snails);
            search({x: e.x - i, y: e.y}, edgeMap, edges, snail, snails);
            search({x: e.x, y: e.y - i}, edgeMap, edges, snail, snails);
            search({x: e.x - i, y: e.y - i}, edgeMap, edges, snail, snails);
            search({x: e.x + i, y: e.y - i}, edgeMap, edges, snail, snails);
            search({x: e.x - i, y: e.y + i}, edgeMap, edges, snail, snails);
        }
        snails[snail].push(edges[index]);
        return true;
    }
    return false;
}
function parseSnail(x){

    let newRow = tbodyRef.insertRow();
    newRow.snail=snailMeasuredPoints[snailMeasuredPoints.length-1];
    snailRowMap.set(newRow.snail, newRow);
    newRow.addEventListener("click", () => {
        if(selectedSnail != -1 && selectedSnail != null){
            console.log(snailRowMap, selectedSnail)
            snailRowMap.get(selectedSnail).style.background = "lightgrey";
        }
        selectedSnail=newRow.snail;
        newRow.style.background = "grey";
        draw();
    });
    //panzoom.getOptions().exclude.add(newRow);
    let newCell = newRow.insertCell();
    let newText = document.createTextNode("X: " +newRow.snail.minx.toFixed(2) + ", Y: " + newRow.snail.miny.toFixed(2) );
    newCell.appendChild(newText);

    newCell = newRow.insertCell();
    newText = document.createTextNode(newRow.snail.species);
    newCell.appendChild(newText);

    newCell = newRow.insertCell();
    newText = document.createTextNode(x.toFixed(2) +"mm");
    newCell.appendChild(newText);

    newCell = newRow.insertCell();
    let newButton = document.createElement("button");
    newButton.innerText = "Delete"

    newButton.addEventListener("click", (e)=>{
        removeSnail(newRow.snail);
        draw();
        e.stopImmediatePropagation();
    })
    newCell.appendChild(newButton);
    newRow.style.background="lightgrey"
}

function removeSnail(s) {
    tbodyRef.removeChild(snailRowMap.get(s));
    snailRowMap.delete(s);
    snailMeasuredPoints.splice(snailMeasuredPoints.indexOf(s), 1);
    selectedSnail=null;
}
function compareColor(r,g,b,i,x,y){
    let pass = 0;
    if(r == -1 ||  r > i.getIntComponent0(x,y)) pass++;
    if(g == -1 ||  g > i.getIntComponent1(x,y)) pass++;
    if(b == -1 ||  b > i.getIntComponent2(x,y)) pass++;
    if(pass == 3)
        return 1;
    else
        return -1;
}
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    let pos = {
        x: (evt.clientX - rect.left)/panzoom.getScale(),
        y: (evt.clientY - rect.top)/panzoom.getScale()
    };
    return pos;
}
function drawLine( x1,  y1,  x2,  y2, size, color, image) {
    if(Math.sqrt(Math.pow(x1,2) + Math.pow(y1,2)) > Math.sqrt(Math.pow(x2,2) + Math.pow(y2,2))){
        let xmem = x1;
        let ymem = y1;
        x1 = x2;
        y1 = y2;
        x2 = xmem;
        y2 = ymem;
    }
    if(x2==x1){
        for(let i = y1; i < y2; i++){
            for(let j = 0; j < size; j++) {
                image.setIntColor(x1+j , i, color);
                image.setIntColor(x1-j , i, color);
            }
        }
    }else if(y2==y1){
        for(let i = x1; i < x2; i++){
            for(let j = 0; j < size; j++) {
                image.setIntColor(i, y1+j, color);
                image.setIntColor(i, y1-j, color);
            }
        }
    }else if(x2 - x1 > y2 - y1){
        let slope =  (y2 - y1) / (x2 - x1);
        for (let i = 0; i < x2 - x1; i++) {
            for(let j = 0; j < size; j++) {
                let round = Math.floor(y1 + i * slope);
                image.setIntColor(x1 + i - j, Math.floor(round), color);
                image.setIntColor(x1 + i + j, Math.floor(round), color);
                image.setIntColor(x1 + i, Math.floor(round) - j, color);
                image.setIntColor(x1 + i, Math.floor(round) + j, color);
                image.setIntColor(x1 + i, Math.floor(round), color);
            }
        }
    }else {
        let slope = (x2 - x1) /  (y2 - y1);
        for (let i = 0; i < y2 - y1; i++) {
            for (let j = 0; j < size; j++) {
                let round = Math.floor(x1 + i * slope);
                image.setIntColor(Math.floor(round), y1 + i, color);
                image.setIntColor(Math.floor(round), y1 + i - j, color);
                image.setIntColor(Math.floor(round), y1 + i + j, color);
                image.setIntColor(Math.floor(round) - j, y1 + i, color);
                image.setIntColor(Math.floor(round) + j, y1 + i, color);
            }
        }
    }
}
function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', "data:text/csv;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
function DoBoxesIntersect( a, b) {
    return (Math.abs((a.minx + (a.maxx-a.minx)/2) - (b.minx + (b.maxx-b.minx)/2)) * 2 < ((a.maxx-a.minx) + (b.maxx-b.minx))) &&
           (Math.abs((a.miny + (a.maxy-a.miny)/2) - (b.miny + (b.maxy-b.miny)/2)) * 2 < ((a.maxy-a.miny) + (b.maxy-b.miny)));
}
function calculateOutliers(set){
    console.log(set)
    let colorSet = [];
    set.forEach((p) => {
        let val =  (working_image.getIntComponent0(Math.floor(p.x+box_position.x1),Math.floor(p.y+box_position.y1))*1.5+working_image.getIntComponent2(Math.floor(p.x+box_position.x1),Math.floor(p.y+box_position.y1))-working_image.getIntComponent1(Math.floor(p.x+box_position.x1),Math.floor(p.y+box_position.y1)));
        let color = {"red":val, "x": p.x+box_position.x1, "y":p.y+box_position.y1, "assigned":p.assigned};
        colorSet.push(color);
    });
    colorSet.sort((a,b) => a.red-b.red);
    let Q1 = colorSet[Math.floor(colorSet.length/4)].red;
    let Q3 = colorSet[Math.floor(3*colorSet.length/4)].red;
    let IQR = Q3-Q1;
    let threshold = Q1+IQR*.3;

    let output = []; 
    colorSet.forEach((p) => {
        if(p.red >= threshold){
            image.setIntColor(Math.floor(p.x),Math.floor(p.y),0xFF00FF00);
        }else{
            output.push({
                "x": p.x-box_position.x1,
                "y": p.y-box_position.y1,
                "assigned": p.assigned
            });
        }
    });
    return output;
}
function magnitude(x,y){
    return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
}