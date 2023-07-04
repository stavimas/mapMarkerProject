

export async function fetchFirstLayerData() {
    let response = await fetch('./bars.geojson');
    let data = await response.json();
    return data;
}