let faceapi;
let video;
let detections;

let startButton;

var cnv;

// by default all options are set to true
const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
}

const locationPts = {
    mouth: [0, 6, 2, 9], //x border, y borders (l, r + top, bottom)
    nose: [4, 8, 0, 6],
    leftEye: [0, 3, 1, 5],
    rightEye: [0, 3, 2, 4],
    rightEyeBrow: [0, 4, 2, 4],
    leftEyeBrow: [0, 4, 2, 0]
}

let savedPos = [];

let changePos = false; //bewegt sich das erkannte Gesicht?
let addedFace = false; //kommt ein weiteres Gesicht dazu?

data = [];

let scaling = {mouth: [1, 1], nose: [1, 1], leftEye: [1, 1], rightEye: [1, 1],
    rightEyeBrow: [1, 1], leftEyeBrow: [1, 1]}

function setup() {
    cnv = createCanvas(640, 360); //vorher 640 x 360
    push();

    //Button zum Starten/Fullscreen-Aktivierung: Fullscreen kann nur durch Userinteraktion gestartet werden
    startButton = createButton("start face destructor");
    startButton.class("button");
    startButton.mousePressed(startApp);
    
    calcScaling(); //Verzerrung für erste Erkennung berechnen
}

function startApp(){
    startButton.hide();
    cnv.show();
    cnv = resizeCanvas(displayWidth, displayHeight);
    cnv = fullscreen(true);
    console.log(width);

    // load up your video
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide(); // Hide the video element, and just show the canvas
    faceapi = ml5.faceApi(video, detection_options, modelReady)
}

function modelReady() {
    console.log('ready!')
    console.log(faceapi)
    faceapi.detect(gotResults)
}

function gotResults(err, result) {
    if (err) {
        console.log(err)
        return
    }
    // console.log(result)
    detections = result;

    background(255);
    //image(video, 0,0, width, height)
    if (detections) {
        if (detections.length > 0) {
            // console.log(detections)
            drawLandmarks(detections); //Gesichtsteile abbilden
            changePos = false;
            addedFace = false;
        }else{
            calcScaling(); //neue Verzerrung berechnen
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

        //Einträge für jedes erkannte Gesicht erstellen
        if(changePos){
            data.push({pos: {mouth: [0, 0], nose: [0, 0], leftEye: [0, 0], rightEye: [0, 0], 
                rightEyeBrow: [0, 0], leftEyeBrow: [0, 0]}});
        }else if(data.length < detections.length){
            data.push({pos: {mouth: [0, 0], nose: [0, 0], leftEye: [0, 0], rightEye: [0, 0], 
                rightEyeBrow: [0, 0], leftEyeBrow: [0, 0]}});
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
        coord.push([feature[pts[i]]._x, feature[pts[i]]._y]); //Schlüsselpunkte des Gesichtteils sammeln
    }

    w = int((coord[1][0] - coord[0][0]) * 1.2);
    h = int((coord[3][1] - coord[2][1]) * 1.2);
    x = int(coord[0][0] + w/2);
    y = int(coord[2][1] + h/2);
    
   if(changePos || addedFace){ //wenn das Gesicht sich bewegt oder ein neues hinzugekommen ist: Positionierung neu bestimmen
        let scaledW = w * scaling[key][0];
        let scaledH = h * scaling[key][1];

        data[detection].pos[key][0] = random(scaledW/2, width - scaledW/2);
        data[detection].pos[key][1] = random(scaledH/2, height - scaledH/2);
        //print(data);
    }

    if(x > 0 && y > 0 && w > 0 && h > 0){
        video.loadPixels();
        //Pixel der betroffenen Regionen ausschneiden
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
        //translate(width - x, y);
        translate(width - data[detection].pos[key][0], data[detection].pos[key][1]);
        scale(-1, 1);
        scale(scaling[key][0], scaling[key][1]);
        imageMode(CENTER);
        image(areaData, 0, 0);
        pop();
    }
}

function calcScaling(){
    let landmarks = Object.keys(scaling);
    for(let i = 0; i < landmarks.length; i++){
        if(landmarks[i] == "leftEye" || landmarks[i] == "rightEye"){
            scaling[landmarks[i]][0] = random(0.5, 10);
            scaling[landmarks[i]][1] = random(0.5, 10);
        }else{
            scaling[landmarks[i]][0] = random(0.5, 5);
            scaling[landmarks[i]][1] = random(0.5, 5);
        }
    }
    changePos = true;
    data = [];
}

function calcPos(x, y, widthPic){ //# des zu kopierenden Pixels im Pixelarray berechenen 
    return (x+y*widthPic)*4;
}