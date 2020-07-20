const EARTH_RADIUS = 6378137;  
const PI = Math.PI;
const TEN = 10;

const cityMap = {
  'gz' : {
    name : '广州',
    table: 'gz_shelters',
    index: 3
  },
  'sz' : {
    name : '深圳',
    table: 'sz_shelters',
    index: 1
  },
  'cd' : {
    name : '成都',
    table: 'cd_shelters',
    index: 2
  },
  'bj' : {
    name : '北京',
    table: 'bj_shelters',
    index: 0
  }
};
const districtMap =
{
  'bj': [
  "所有地区",
  "西城区",
  "房山区",
  "通州区",
  "顺义区",
  "昌平区",
  "大兴区",
  "平谷区",
  "怀柔区",
  "密云县",
  "延庆县",
  "东城区",
  "门头沟区",
  "石景山区",
  "丰台区",
  "海淀区",
  "朝阳区"], 
  'sz': [
  "所有地区",
  '福田区',
  '罗湖区',
  '龙岗区',
  '坪山区',
  '宝安区',
  '南山区',
  '盐田区',
  '龙华区'],
'cd': ['所有地区', '锦江区', '龙泉驿区', '成华区', '金牛区', '高新区', '青羊区', '武侯区', '温江区', '新都区', '青白江区'],
'gz': ['所有地区', '番禺区','黄埔区','白云区','天河区','荔湾区','海珠区','增城区','花都区','南沙区','从化区','越秀区']
};

function getRad(d) {
  return d * PI / 180;
}
function getDistance(lng1, lat1, lng2, lat2) {
  var radLat1 = getRad(lat1);
  var radLat2 = getRad(lat2);
  var a = radLat1 - radLat2;
  var b = getRad(lng1) - getRad(lng2);
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * EARTH_RADIUS;
  s = parseInt(s);
  return s;
}


function nearestTen(city, lng, lat) {
  let arr = [];
  const { shelters } = require(`./shelters_locations/${city}_shelters.js`);
  for (let i = 0; i < shelters.length; i++) {
    let item = shelters[i];
    let lng2 = shelters[i]['longitude'];
    let lat2 = shelters[i]['latitude'];
    let distance = getDistance(lng, lat, lng2, lat2);
    // console.log(distance);
    item.distance = distance;
    arr.push(distance);
  }
  let group = [0];
  let pagesize = Math.floor(arr.length/TEN);
  for (let i = 1; i < TEN; i++) {
    group[i] = group[i-1]+pagesize; 
  }
  // console.log('group',group);
  let topTens =[];
  for (let i = 0; i < TEN; i++) {
    let start = group[i];
    let end = group[i+1] || arr.length;
    let topTen = [];
    topTen = findTopTens(start,end,arr);
    topTens = topTens.concat(topTen);
  }
  let topTen = findTopTen(topTens,arr);
  // console.log('topTens',topTens);
  // console.log('result',topTen);
  let result = [];
  for(let i in topTen){
    let index = topTen[i];
    let item = shelters[index];
    item.distance = arr[index];
    result.push(item);
  }
  return result;
}
function findTopTens(start,end,arr) {
  let topTen = [];
  if(end-start <= TEN) {
    for(let i = start;i<end;i++) {
      topTen.push(i);
    }
    return topTen;
  }
  for(let i = start;i<start+TEN;i++) {
    topTen.push(i);
  }
  topTen.sort(function(a,b){
    return arr[a] - arr[b];
  });
  for(let i = start + TEN;i<end;i++) {
    let d = arr[i];
    let min = topTen[9];
    min = arr[min];
    if(d < min){
      topTen[9] = i;
      topTen.sort(function(a,b){
        return arr[a] - arr[b];
      });
    }
  }
  return topTen;
}
function findTopTen(topTens,arr) {
  console.log('topTens', topTens);
  let topTen = [];
  if(topTens.length <= TEN) {
    return topTens;
  }
  for(let i=0;i<TEN;i++) {
    let index = topTens[i];
    topTen.push(index);
  }
  for(let i = TEN;i<topTens.length;i++) {
    let index = topTens[i];
    let d = arr[index];
    let min = topTen[9];
    min = arr[min];
    if(d < min){
      topTen[9] = index;
      topTen.sort(function(a,b){
        return arr[a] - arr[b];
      });
    }
  }
  return topTen;
}
export { nearestTen,getDistance , districtMap,cityMap};