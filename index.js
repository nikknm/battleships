
var EMPTY_CELL = 0;
var SHIP_PART_CELL = 1;
var EMPTY_MISS_CELL = 2;
var DAMAGED_SHIP_CELL = 3;

var lastGoodShot = null;
var NextRandomShot = true;

var userLocked = false;

var username = "Вы";
var compname = "Компьютер";

window.onload = function(w, h) {

    var gameBlock = document.getElementById("game");
    gameBlock.classList.add("hide");

    var startButton = document.getElementById("start");

    startButton.onclick = function() {
        setNames();

        var gameBlock = document.getElementById("game");
        gameBlock.classList.remove("hide");

        var greeting = document.getElementById("greeting");
        greeting.classList.add("hide");
    }

    function setNames(){
        var usernameInput = document.getElementById("usernameInput");
        var usernameBlock = document.getElementById("username");
        if(usernameInput.value && usernameInput.value.length > 0){
            username = usernameInput.value;
        }
        usernameBlock.innerHTML = username;

        var compnameInput = document.getElementById("compnameInput");
        var compnameBlock = document.getElementById("compname");
        if(compnameInput.value && compnameInput.value.length > 0){
            compname = compnameInput.value;
        }
        compnameBlock.innerHTML = compname;
    }

    //  Поле
    var p1map = setShips();
    var p2map = setShips();
    var p1 = document.getElementById("battle-field-1");
    var p2 = document.getElementById("battle-field-2");
    var outputDiv = document.getElementById("output");
    outputDiv.innerHTML = "<p><b>Ваш ход!</b></p>";
    //p2.remove();


    for (var i = 0; i < w; i++) for (var j = 0; j < h; j++) {
        var div1 = document.createElement("div");
        div1.id = i + "_" + j;
        div1.className = p1map[i][j];
        if (p1map[i][j] == "1") {
            div1.className = "busy";
        } else if(p1map[i][j] == 0){
            div1.className = "empty";
        }
        p1.appendChild(div1);
        var div2 = document.createElement("div");
        div2.setAttribute("data-y", i);
        div2.setAttribute("data-x", j);
        div2.className = p2map[i][j] == "1" ? "busy" : "empty";
        div2.onclick = function() {
            if(!userLocked){
                if (fire(this, true, false))
                    backfire();
            }

        };
        p2.appendChild(div2);
    }
    function fire(el, isUser, finished) {

        if(finished){
            el.className = "finished";
        }
        if (el.className == "finished" || el.className == "damaged" || el.className == "miss") return false;
        el.className = el.className == "busy" ? "damaged" : "miss";

        if(el.className == "damaged" && isUser){

            var y = el.attributes[0].nodeValue; // attr = y
            var x = el.attributes[1].nodeValue; //attr = x
            for(var i = 0; i < el.attributes.length; i ++){
                if(el.attributes[i].name == "data-y"){
                    y = el.attributes[i].nodeValue;
                }
                if(el.attributes[i].name == "data-x"){
                    x = el.attributes[i].nodeValue;
                }
            }

            setShot(p2map, {Y: parseInt(y), X: parseInt(x)});
            var shipPointList = [];
            var killed = getShip(p2map, {Y: parseInt(y), X: parseInt(x)}, shipPointList, true);
            if(killed){
                var targets = document.querySelectorAll("#battle-field-2 .busy, #battle-field-2 .empty,  #battle-field-2 .damaged, #battle-field-2 .finished, #battle-field-2 .miss");
                for(var i = 0; i < shipPointList.length; i++){
                    var number = shipPointList[i].Y * 10 + shipPointList[i].X;
                    var curEl = targets[number];
                    curEl.className = "finished";
                }
                /*shipPointList.forEach((point)=> {
                    var number = point.Y * 10 + point.X;
                    var curEl = targets[number];
                    curEl.className = "finished";
                })*/
            }
        }


        if (document.querySelectorAll("#battle-field-2 .busy").length === 0) {
            alert("Вы победили!");
            return false;
        }
        if (document.querySelectorAll("#battle-field-1 .busy").length === 0) {
            var compMap = document.getElementById("battle-field-2")
            compMap.classList.add("disabled");
            alert("Вы проиграли, не расстраиваейтесь, попробуйте еще раз!");

        }
        if (el.className == "miss") return true;
    }
    function backfire() {
        userLocked = true;
        var targets = document.querySelectorAll("#battle-field-1 .busy, #battle-field-1 .empty");
        var compMap = document.getElementById("battle-field-2")
        compMap.classList.add("disabled");

        var outputDiv = document.getElementById("output");
        outputDiv.innerHTML = "<p><b>Ход компьютера</b></p>";

        analizeshots(p1map);
    }

    function analizeshots(map){
        var shots = [];
        var arr = map;

        var point;

        if(NextRandomShot || !lastGoodShot){
            point = {X: getRandomInt(0,9),Y: getRandomInt(0,9)};
        }
        else{
            var shipPointList = [];
            getShip(arr, lastGoodShot, shipPointList, true);
            //все возможные варианты выстрла
            var blackPossiblePoints =  getPossibleShootPoints(lastGoodShot);
            // отфильтрованные
            var clearPossiblePoints = [];
            //соседние точки
            var shootedPoints = [];

            for(var i = 0; i < shipPointList.length; i++){
                //var a = shipPointList[i].Y == lastGoodShot.Y;
                //var b = shipPointList[i].X == lastGoodShot.X;
                var c = arr[shipPointList[i].Y][shipPointList[i].X] == DAMAGED_SHIP_CELL;
                //if(!(a && b) && c){
                if(c){
                    shootedPoints.push(shipPointList[i]);
                }
            }


            for(var i = 0; i < blackPossiblePoints.length; i++){
                if(arr[blackPossiblePoints[i].Y][blackPossiblePoints[i].X] < EMPTY_MISS_CELL){
                    clearPossiblePoints.push(blackPossiblePoints[i]);
                }
            }
            //если попадания уже были относительно этой точки
            if(shootedPoints.length > 1){
                // рассчитать расстояние от предыдущего попадания
                clearPossiblePoints = [];
                //рассчет возможных вариантов выстрелов
                var endPoints = getEndPointsFromArr(shootedPoints);
                var rasnX = endPoints[0].X - endPoints[1].X == 0 ? 0 : 1;
                var rasnY = endPoints[0].Y - endPoints[1].Y == 0 ? 0 : 1;


                if(endPoints[1].Y + rasnY < arr.length && endPoints[1].X + rasnX < arr.length && arr[endPoints[1].Y + rasnY][endPoints[1].X + rasnX] < EMPTY_MISS_CELL){
                    clearPossiblePoints.push({
                        Y: endPoints[1].Y + rasnY,
                        X: endPoints[1].X + rasnX
                    });
                }
                if(endPoints[0].Y - rasnY >= 0 && endPoints[0].X - rasnX >= 0 && arr[endPoints[0].Y - rasnY][endPoints[0].X - rasnX] < EMPTY_MISS_CELL){
                    clearPossiblePoints.push({
                        Y: endPoints[0].Y - rasnY,
                        X: endPoints[0].X - rasnX
                    });
                }
            }
            if(clearPossiblePoints.length > 0){
                point = clearPossiblePoints[clearPossiblePoints.length - 1];
            }
            else{
                point = lastGoodShot;
            }

        }


        //если в эту ячейку уже попадали
        if(arr[point.Y][point.X] > SHIP_PART_CELL){
            analizeshots(map);
        }
        else{
            if(setShot(arr, point)){
                var isOverStep = false;
                setTimeout(function (){

                    var targets = document.querySelectorAll("#battle-field-1 .busy, #battle-field-1 .empty, #battle-field-1 .damaged, #battle-field-1 .finished, #battle-field-1 .miss");
                    var targetsBusy = document.querySelectorAll("#battle-field-1 .busy");
                    var isGoodShoot = setShot(arr, point);
                    if(isGoodShoot){
                        lastGoodShot = point;
                    }
                    var shipPointList = [];
                    //получили все пути
                    var killed = getShip(arr, point, shipPointList, true);

                    var number = point.Y * 10 + point.X;

                    var el = targets[number];


                    //отметить взорванный корабль
                    if(killed){
                        for(var i = 0; i < shipPointList.length; i++){
                            var finishedNumber = shipPointList[i].Y * 10 + shipPointList[i].X;
                            var curEl = targets[finishedNumber];
                            fire(curEl,false, killed);
                        }
                        setMissAroundKilledShip(arr,shipPointList);

                        lastGoodShot = null;
                        NextRandomShot = true;
                    }
                    else{
                        NextRandomShot = false;
                    }
                    //Если кораблей больше нет, если не попал
                    if (targetsBusy.length === 0 || fire(el,false, killed) ){
                        var outputDiv = document.getElementById("output");
                        var compMap = document.getElementById("battle-field-2")
                        outputDiv.innerHTML = "<p><b>Ваш ход!</b></p>";
                        compMap.classList.remove("disabled");
                    }
                    analizeshots(arr);
                }, 1000);

            }
            else{
                //если промах
                setTimeout(function(){
                    var targets = document.querySelectorAll("#battle-field-1 .busy, #battle-field-1 .empty,  #battle-field-1 .damaged, #battle-field-1 .finished, #battle-field-1 .miss");
                    var targetsBusy = document.querySelectorAll("#battle-field-1 .busy");
                    var number = point.Y * 10 + point.X;
                    var el = targets[number];
                    userLocked = false;
                    var outputDiv = document.getElementById("output");
                    var compMap = document.getElementById("battle-field-2")
                    outputDiv.innerHTML = "<p><b>Ваш ход!</b></p>";
                    compMap.classList.remove("disabled");
                    fire(el, false, false);
                }, 500);
            }
        }
    }
}(10, 10);

//получить крайние точки из попаданий по кораблю
function getEndPointsFromArr(pointList){
    var res = [];
    var topleft = pointList[0];
    for(var i = 1; i < pointList.length; i++){
        if(pointList[i].X < topleft.X || pointList[i].Y < topleft.Y) topleft = pointList[i];
    }
    res.push(topleft);
    var botright = pointList[0];
    for(var i = 1; i < pointList.length; i++){
        if(pointList[i].X > botright.X || pointList[i].Y > botright.Y) botright = pointList[i];
    }
    res.push(botright);

    return res;
}

//возле корабля проставляет промах, чтобы компьютер больше не стрелял заведомо мимо
function setMissAroundKilledShip(arr, pointList){
    var endPoints = getEndPointsFromArr(pointList)
    var topLeftY = endPoints[0].Y > 0 ? endPoints[0].Y - 1 : endPoints[0].Y;
    var topLeftX = endPoints[0].X > 0 ? endPoints[0].X - 1 : endPoints[0].X;
    var bottomRightY = endPoints[1].Y < arr.length - 1 ?  endPoints[1].Y + 1 : endPoints[1].Y;
    var bottomRightX = endPoints[1].X < arr.length - 1 ?  endPoints[1].X + 1 : endPoints[1].X;

    for(var y = topLeftY; y <= bottomRightY; y++){
        for(var x = topLeftX; x <= bottomRightX; x++){
            if(arr[y][x] == 0){
                arr[y][x] = EMPTY_MISS_CELL;
            }
        }
    }
}

/*
* генерация Списка возможных выстрелов
*   4
* 1 x 3
*   2
* */
function getPossibleShootPoints(point){
    var possibleShootPoints = [];

    var firstShoot = {
        X: lastGoodShot.X > 0 ? lastGoodShot.X - 1 : null,
        Y: lastGoodShot.Y
    }
    if(firstShoot.X != null) possibleShootPoints.push(firstShoot);

    var secondShoot = {
        X: lastGoodShot.X,
        Y: lastGoodShot.Y < 10 - 1   ? lastGoodShot.Y + 1 : null
    }
    if(secondShoot.Y != null) possibleShootPoints.push(secondShoot);


    var thirdShoot = {
        X: lastGoodShot.X < 10  - 1  ? lastGoodShot.X + 1 : null,
        Y: lastGoodShot.Y
    }
    if(thirdShoot.X != null) possibleShootPoints.push(thirdShoot);

    var fourthShoot = {
        X: lastGoodShot.X,
        Y: lastGoodShot.Y > 0 ? lastGoodShot.Y - 1 : null
    }
    if(fourthShoot.Y != null) possibleShootPoints.push(fourthShoot);

    return possibleShootPoints;
}

//возвращает пустую матрицу
function getMatrixArray(){
    var columns = 10;
    var rows = 10;
    var arr = new Array();
    for(var i = 0; i < rows; i++){
        arr[i] = new Array();
        for(var j = 0; j < columns; j++){
            arr[i][j] = EMPTY_CELL;//вместо i+j+1 пишем любой наполнитель. В простейшем случае - null
        }
    }
    return arr;
}

//Случайное значение в рамках
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// расстановка 1 корабля
function setShipInArr(arr, ship){

    //расчет верхней левой и нижней  правой точки для проверки на возможность вставки
    var topLeftY = ship.Y > 0 ? ship.Y - 1 : ship.Y;
    var topLeftX = ship.X > 0 ? ship.X - 1 : ship.X;
    var bottomRightX;
    var bottomRightY;

    if(ship.vertical ){
        bottomRightX = ship.X < arr.length - 1 ? ship.X + 1 : ship.X;
        bottomRightY = (ship.Y + ship.count) <= arr.length - 1 ? ship.Y + ship.count : ship.Y + ship.count - 1;
    }
    else {
        bottomRightX = (ship.X + ship.count) <= arr.length - 1 ? ship.X + ship.count : ship.X + ship.count - 1;
        bottomRightY = ship.Y < arr.length - 1 ? ship.Y + 1 : ship.Y;
    }

    var canSet = true;
    for(var y = topLeftY; y <= bottomRightY && canSet; y++){
        for(var x = topLeftX; x <= bottomRightX && canSet; x++){

            if(arr[y][x] == SHIP_PART_CELL){
                canSet = false;
            }
        }
    }

    if(!canSet){
        ship.X += 1;
        //если х выодит за границу
        if(bottomRightX == arr.length - 1 && bottomRightY < arr.length - 1){
            ship.X = 0;
            ship.Y += 1;
        }
        //если х и у выодит за границу
        if(bottomRightX == arr.length - 1 && bottomRightY == arr.length - 1){
            ship.X = 0;
            ship.Y = 0;
        }
        //если у выодит за границу
        if(bottomRightX < arr.length - 1 && bottomRightY == arr.length - 1){
            ship.X += 1;
            ship.Y = 0;
        }
        return setShipInArr(arr, ship);
    }
    else{
        //построить корабли
        if(ship.vertical){
            for(var row = ship.Y; row < ship.Y + ship.count ; row++){
                arr[row][ship.X] = SHIP_PART_CELL;
            }
        }
        else{
            for(var col = ship.X; col < ship.X + ship.count ;col++){
                arr[ship.Y][col] = SHIP_PART_CELL;
            }
        }
    }

    return true;
}

//расстановка всех кораблей и возвращает матрицу
function setShips(){
    var pole = getMatrixArray();

    //А,Б,В,Г,Д,Е,Д,З,И,К
    //0,1,2,3,4,5,6,7,8,9
    //Распределение 4 палубника - 1
    var position4pal = {
        vertical: getRandomInt(0,1),
        count: 4,
        X: 0,
        Y: 0,
    }

    if(position4pal.vertical == 1){
        //положение вертикально
        position4pal.X = getRandomInt(0,9);
        position4pal.Y = getRandomInt(0,6);
    }
    else{
        position4pal.X = getRandomInt(0,6);
        position4pal.Y = getRandomInt(0,9);
    }
    setShipInArr(pole, position4pal);



    //Распределение 3 палубника - 2
    for(var index = 0; index < 2; index++){
        var position3pal = {
            vertical: getRandomInt(0,1),
            count: 3,
            X: 0,
            Y: 0,
        }

        if(position3pal.vertical == 1){
            //положение вертикально
            position3pal.X = getRandomInt(0,9);
            position3pal.Y = getRandomInt(0,7);
        }
        else{
            position3pal.X = getRandomInt(0,7);
            position3pal.Y = getRandomInt(0,9);
        }
        setShipInArr(pole, position3pal);
    }
    //Распределение 2 палубника - 3
    for(var index = 0; index < 3; index++){
        var position2pal = {
            vertical: getRandomInt(0,1),
            count: 2,
            X: 0,
            Y: 0,
        }

        if(position2pal.vertical == 1){
            //положение вертикально
            position2pal.X = getRandomInt(0,9);
            position2pal.Y = getRandomInt(0,8);
        }
        else{
            position2pal.X = getRandomInt(0,8);
            position2pal.Y = getRandomInt(0,9);
        }
        setShipInArr(pole, position2pal);
    }

    //Распределение 1 палубника - 4
    for(var index = 0; index < 4; index++){
        var position1pal = {
            vertical: getRandomInt(0,1),
            count: 1,
            X: getRandomInt(0,9),
            Y: getRandomInt(0,9)
        }
        setShipInArr(pole, position1pal);
    }
    return pole;
}

//Ставит значение в матрицу
function setShot(arr, point){
    var isDamaged  = false;
    //point  = {X,Y}

    var part = arr[point.Y];
    if(part[point.X] > 0){
        isDamaged = true
        arr[point.Y][point.X] = DAMAGED_SHIP_CELL;
    }
    else{
        arr[point.Y][point.X] = EMPTY_MISS_CELL;
    }

    return isDamaged;
}

//получаем весь корабль
//arr - матрица
//point - текущяя точка
//pointList -все точки корабля
function getShip(arr, point, pointList, killed){
    var foundPoints = [];
    pointList.push(point);
    //pointList  = [{X,Y}, {X,Y}]
    var topLeftY = point.Y > 0 ? point.Y - 1 : point.Y;
    var topLeftX = point.X > 0 ? point.X - 1 : point.X;
    var bottomRightY = point.Y < arr.length - 1 ?  point.Y + 1 : point.Y;
    var bottomRightX = point.X < arr.length - 1 ?  point.X + 1 : point.X;
    for(var y = topLeftY; y <= bottomRightY; y++){
        for(var x = topLeftX; x <= bottomRightX; x++){
            if(arr[y][x] == SHIP_PART_CELL ){
                killed = false;
            }
            var exist = false;

            for(var i = 0; i < pointList.length; i++){
                if(x == pointList[i].X && y == pointList[i].Y){
                    exist = true;
                }
            }

            if(!exist){
                if((arr[y][x] == SHIP_PART_CELL) || (arr[y][x] == DAMAGED_SHIP_CELL)){
                    foundPoints.push({X: x, Y: y});
                }
            }
        }
    }
    //оптимизировать
    for(var i = 0; i < foundPoints.length; i++){
        killed = getShip(arr, foundPoints[i], pointList,killed);
    }
    return killed;
}

