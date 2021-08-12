const canvas = document.getElementById("canvas");
let image = new MarvinImage();
let mouseDown = false;
let mouse_x = 0;
let mouse_y = 0;
let mouse_down_x = 0;
let mouse_down_y = 0;
let mouse_up_x = 0;
let mouse_up_y = 0;
let box_height = 0;
let box_width = 0;
let scaledValue = 0;
let scaledVectors = [{},{}];

var working_image = new MarvinImage();
let selection = new MarvinImage();
var snailPts = [];

let canvas_width = 1280;
let canvas_height = 720;
canvas.clientHeight = 720;

var scaleValue = document.getElementById("scale");


var currentTool = select;
let inCanvas = false;






// GUHGUGHGHGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHh
document.getElementById("canvas").addEventListener("mouseenter", () => {inCanvas = true;});
document.getElementById("canvas").addEventListener("mouseout", () => {inCanvas = false;});
document.getElementById("sel").addEventListener("click", selectButton);

function selectButton(){
    currentTool = select;
}
document.getElementById("scl").addEventListener("click", scaleButton);
function scaleButton(){
    currentTool = scale;
}

image.load("DSC00050.JPG", function(){
    working_image = image.clone();

    var temp = new MarvinImage();
    Marvin.scale(image, temp, canvas_width, canvas_height);
    image = temp;
    for(let i = 0; i < image.getWidth(); i++){
        for(let j = 0; j < image.getHeight(); j++){
            if(compareColor(-1,60,40, image,i,j) == -1){
                    image.setIntColor(i,j,250, 0, 0, 250);
            }else snailPts.push([[i,j]]);
        }
    }

    draw();

});


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
        console.log(scaledValue);
    }
}


document.addEventListener("mousedown", (event) => {
    mouseDown = true;

    let pos = getMousePos(canvas, event);
    mouse_down_x = pos.x;
    mouse_down_y = pos.y;
});
document.addEventListener("mouseup", (event) => {
    mouseDown = false;
    let pos = getMousePos(canvas, event);
    mouse_up_x = pos.x;
    mouse_up_y = pos.y;
    if(inCanvas) currentTool();
});
document.addEventListener("mousemove", (event) => {
    let pos = getMousePos(canvas, event)
    mouse_x = pos.x;
    mouse_y = pos.y;
    if(mouseDown){

        box_width = pos.x-mouse_down_x;
        box_height = pos.y-mouse_down_y;
    }
    draw();
});

const draw = () => {
    // console.log(image);
    let imageclone = image.clone();

    if(mouseDown && inCanvas) {
        if(currentTool === select) {
            if (box_height < 0 && box_height < 0) {
                imageclone.drawRect(Math.floor(mouse_down_x) + box_width, Math.floor(mouse_down_y) + box_height, -1 * box_width, -1 * box_height, 0xFFFFFF00);
            } else if (box_height < 0) {
                imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y) + box_height, box_width, -1 * box_height, 0xFFFFFF00);
            } else if (box_width < 0) {
                imageclone.drawRect(Math.floor(mouse_down_x) + box_width, Math.floor(mouse_down_y), -1 * box_width, box_height, 0xFFFFFF00);
            } else {
                imageclone.drawRect(Math.floor(mouse_down_x), Math.floor(mouse_down_y), box_width, box_height, 0xFFFFFF00);
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


    imageclone.draw(canvas);
};

function isValidSelection(){
    return mouse_down_x +box_width> 0 && mouse_down_y + box_height > 0 && box_height + mouse_down_y < canvas_height && box_width + mouse_down_x < canvas_width;
}
function crop(){
        if (box_height < 0 && box_height < 0) {
            Marvin.crop(image, selection,Math.floor(mouse_down_x) + box_width, Math.floor(mouse_down_y) + box_height, -1 * box_width, -1 * box_height);
        } else if (box_height < 0) {
            Marvin.crop(image, selection,Math.floor(mouse_down_x), Math.floor(mouse_down_y) + box_height, box_width, -1* box_height);
        } else if (box_width < 0) {
            Marvin.crop(image, selection,Math.floor(mouse_down_x) + box_width, Math.floor(mouse_down_y), -1 * box_width, box_height);
        } else {
            Marvin.crop(image, selection,Math.floor(mouse_down_x), Math.floor(mouse_down_y), box_width, box_height);
        }
    process();
}
function process(){
    Marvin.prewitt(selection.clone(), selection);
    //Marvin.grayScale(selection.clone(), selection);

    let edgeList = [];
    for(let i = 0; i < selection.getWidth(); i++){
        for(let j = 0; j < selection.getHeight(); j++){
            if(selection.getIntComponent0(i,j) > 160 && selection.getIntComponent2(i,j) > 230){
                edgeList.push({x:i,y:j});
            }
        }
    }
    let max = 0;
    for(let i = 0; i < edgeList.length; i++){
        let pointMax = 0;
        for(let j = i; j < edgeList.length; j++){
            let dist = Math.sqrt(Math.pow(edgeList[i].x-edgeList[j].x,2) + Math.pow(edgeList[i].y-edgeList[j].y,2));
            if(dist > pointMax) pointMax = dist;
        }
        if(max < pointMax) max = pointMax;
    }
    console.log(max*scaledValue);
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
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
    // console.log(pos);
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
            image.setIntColor(x1 , i, color);
        }
    }else if(y2==y1){
        for(let i = x1; i < x2; i++){
            image.setIntColor(i, y1, color);
        }
    }else if(x2 - x1 > y2 - y1){
        let slope =  (y2 - y1) / (x2 - x1);
        for (let i = 0; i < x2 - x1; i++) {
            for(let j = 0; j < size; j++) {
                let round = Math.round(y1 + i * slope);
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
                let round = Math.round(x1 + i * slope);
                image.setIntColor(Math.floor(round), y1 + i, color);
                image.setIntColor(Math.floor(round), y1 + i - j, color);
                image.setIntColor(Math.floor(round), y1 + i + j, color);
                image.setIntColor(Math.floor(round) - j, y1 + i, color);
                image.setIntColor(Math.floor(round) + j, y1 + i, color);
            }
        }
    }
}
