var faceapi;
var video;
var detections;

var startButton;
var cnv;
var div;

// by default all options are set to true
const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
}

locationPts = {
    mouth: [0, 6, 2, 9], //x border, y borders (l, r + top, bottom)
    nose: [4, 8, 0, 6],
    leftEye: [0, 3, 1, 5],
    rightEye: [0, 3, 2, 4],
    rightEyeBrow: [0, 4, 2, 4],
    leftEyeBrow: [0, 4, 2, 0]
}

data = []; //alle Gesichtsdaten
let addedFace = false;


function setup() {
    cnv = createCanvas(640, 360).parent("myCanvas");
    div = createDiv('<br>face-api models are loading...');
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    text("loading...", width/2, height/2);
    push();
    // load up your video
    video = createCapture(VIDEO);
    video.size(windowWidth, windowHeight);
    video.hide(); // Hide the video element, and just show the canvas
    faceapi = ml5.faceApi(video, detection_options, modelReady)
}

function startApp(){
    startButton.hide();
    cnv.show();
    cnv = resizeCanvas(windowWidth, windowHeight);
    //cnv = fullscreen(true);
    console.log(width);
}

function modelReady() {
    console.log('ready!');
    console.log(faceapi);
    //Button zum Starten/Fullscreen-Aktivierung: Fullscreen kann nur durch Userinteraktion gestartet werden
    div.hide();
    startButton = createButton("start face destructor");
    startButton.class("button");
    startButton.mousePressed(startApp);
    faceapi.detect(gotResults);

}

function gotResults(err, result) {
    if (err) {
        console.log(err)
        return
    }
    // console.log(result)
    detections = result;

    // background(220);
    background(0);
    //image(video, 0,0, width, height)
    if (detections) {
        if (detections.length > 0) {
            // console.log(detections)
            drawLandmarks(detections);
            addedFace = false;
        }else{
            data = [];
        }
    }
    faceapi.detect(gotResults)
}

function drawLandmarks(detections){
    for(let i = 0; i < detections.length; i++){
        const mouth = detections[i].parts.mouth; 
        const nose = detections[i].parts.nose;
        const leftEye = detections[i].parts.leftEye;
        const rightEye = detections[i].parts.rightEye;
        const rightEyeBrow = detections[i].parts.rightEyeBrow;
        const leftEyeBrow = detections[i].parts.leftEyeBrow;

        if(data.length - 1 < i){
            data.push({scaling: {mouth: [1, 1], nose: [1, 1], leftEye: [1, 1], rightEye: [1, 1],
                rightEyeBrow: [1, 1], leftEyeBrow: [1, 1]}});
            addedFace = true;
        }
        
        drawPart(mouth, "mouth", i);
        drawPart(nose, "nose", i);
        drawPart(leftEye, "leftEye", i);
        drawPart(leftEyeBrow, "leftEyeBrow", i);
        drawPart(rightEye, "rightEye", i);
        drawPart(rightEyeBrow, "rightEyeBrow", i);
        
    }
}

function drawPart(feature, key, detection){
    
    let pts = locationPts[key];
    let coord = [];
    let x, y, w, h;

    let areaData;

    for(let i = 0; i < pts.length; i++){
        coord.push([feature[pts[i]]._x, feature[pts[i]]._y]);
    }

    w = int((coord[1][0] - coord[0][0]) * 1.2);
    h = int((coord[3][1] - coord[2][1]) * 1.2);
    x = int(coord[0][0] + w/2);
    y = int(coord[2][1] + h/2);

    if(addedFace){ //wenn ein neues Gesicht hinzugekommen ist: Skalierung neu bestimmen
        if(key == "leftEye" || key == "rightEye"){
            data[detection].scaling[key][0] = random(0.5, 5);
            data[detection].scaling[key][1] = random(0.5, 5);
        }else{
            data[detection].scaling[key][0] = random(0.5, 2);
            data[detection].scaling[key][1] = random(0.5, 2);
        }
    }

    if(x > 0 && y > 0 && w > 0 && h > 0){
        video.loadPixels();
      
        areaData = createImage(w, h);
        areaData.loadPixels()
        for(let yPos = 0; yPos < h; yPos++){
            for(let xPos = 0; xPos < w; xPos++){
                let source = calcPos((x - int(w/2)) + xPos, (y- int(h/2)) + yPos, width);
                let imgPos = calcPos(0 + xPos, 0 + yPos, w);
                //print("x: "+area.x + x+", y: "+area.y + y);
      
                areaData.pixels[imgPos] = video.pixels[source];
                areaData.pixels[imgPos + 1] = video.pixels[source + 1];
                areaData.pixels[imgPos + 2] = video.pixels[source + 2];
                areaData.pixels[imgPos + 3] = video.pixels[source + 3];
            }
        }
        areaData.updatePixels();
        push();
        //translate(width/2, height/2);
        translate(width - x, y);
        scale(-1, 1);
        scale(data[detection].scaling[key][0], data[detection].scaling[key][1]);
        imageMode(CENTER);
        image(areaData, 0, 0);
        pop();
    }
}

function calcPos(x, y, widthPic){
    return (x+y*widthPic)*4;
}