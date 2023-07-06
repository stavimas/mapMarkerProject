//Получение данных для первого слоя
export async function fetchFirstLayerData() {
    let response = await fetch('./bars.geojson');
    let data = await response.json();
    return data;
}

//Получение данных для второго слоя
export async function fetchSecondLayerData() {
    let response = await fetch('./portals.csv');
    let text = await response.text();
    let data = csvJSON(text.toString())
    //let text = await response.text();
    //let contData = JSON.stringify(data, null, 2);
    //console.log(contData)
    return data;
}

  //Перегонка csv в json
function csvJSON(csv){
    var lines=csv.split("\n");
    var result = [];
    var headers=lines[0].split(";");
    for(var i=1;i<lines.length;i++){
        var obj = {};
        var currentline=lines[i].split(";");
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}