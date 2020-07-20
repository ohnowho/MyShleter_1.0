const mysql = require('mysql');
const fs=require('fs');
const async = require('async');
const node_xlsx = require('node-xlsx');
const axios = require('axios');
const { CONFIG } = require('./config.js');

const knex = require('knex')({
	client: 'mysql',
	connection: {
		waitForConnections: true, // 达到最大连接数之后的连接请求进入等待队列，如果为false则直接返回err
		host: CONFIG.host, // 数据库服务器ip
		user: CONFIG.user, // 数据库用户名
		password: CONFIG.password, // 数据库密码
		database: CONFIG.database, // 数据库名称
		port: CONFIG.port, // 数据库端口
		charset: 'utf8mb4',
		multipleStatements: true
	}
});
const mypool = mysql.createPool({
	acquireTimeout: 10000, // 连接超时，10秒
	connectionLimit: 10, // 连接池最大连接数
	waitForConnections: true, // 达到最大连接数之后的连接请求进入等待队列，如果为false则直接返回err
	host: CONFIG.host, // 数据库服务器ip
	user: CONFIG.user, // 数据库用户名
	password: CONFIG.password, // 数据库密码
	database: CONFIG.database, // 数据库名称
	port: CONFIG.port, // 数据库端口
});

const cityMap = {
	'gz' : {
		name : '广州',
		table: 'gz_shelters',
	},
	'sz' : {
		name : '深圳',
		table: 'sz_shelters',
	},
	'cd' : {
		name : '成都',
		table: 'cd_shelters',
	},
	'bj' : {
		name : '北京',
		table: 'bj_shelters',
	}
}


async function geoCoder(arr,city) {
	return new Promise(( resolve, reject ) => {
    async.map(arr, async function(batch) {
		   	let search = {};
		   	search['key'] =CONFIG.amap_key;
		   	search['address'] = batch.join('|');
				search['city'] = city;
				search['batch'] = true;
				let res = await fetch(CONFIG.amap_url,search);
				return res;
		}, async (err, results) => {
		    if (err) throw err
		    // results is now an array of the response bodies
		    resolve(results);
		});  
	});
}

async function fetch(url,search) {
	return new Promise(( resolve, reject ) => {
    axios.get(url, {
	    params: search
	  })
	  .then(async function (response) {
	    resolve(response.data.geocodes);
	  })
	  .catch(async function (error) {
	    console.error(error);
	    reject(error);
	  });
  });
}

function mysqlquery(sql,values){
	return new Promise(( resolve, reject ) => {
    mypool.getConnection(function(err, connection) {
      if (err) {
        reject( err )
      } else {
        connection.query(sql, values, ( err, rows) => {

          if ( err ) {
            reject( err )
          } else {
            resolve( rows )
          }
          // 结束会话
          connection.release()
        })
      }
    })
  });
}

async function createTable(tableName) {
	var createsql = knex.schema.createTable(tableName, function (table) {
		table.string('sid');
		table.string('num');
		table.string('name');
		table.string('type');
		table.string('city');
		table.string('district');
		table.string('street');
		table.string('community');
		table.string('address');
		table.string('full_address');
		table.string('format_addr');
		table.decimal('longitude',10,6);
		table.decimal('latitude',10,6);
		table.string('postcode');
		table.string('contact');
		table.string('tel');
		table.string('service');
		table.string('service_time');
		table.string('update_time');
	}).toString();
	await mysqlquery(createsql);
}

/* dataInitCITY 将各城市的原始数据文件 分析后 按统一的字段 存储到MySql*/

async function dataInitGZ(city) {
	let arr = [];
	let i = 0;
	let originData = require(`./files/gz_origin_data.json`);
	for (var res of originData) {
		let rows = res['rows'];
		for(let row of rows){
			let item = {};
			item['sid'] = 'gz'+ i;
			item['num'] = i;
			item['name'] = row['MC'] || '';
			item['type'] = '';
			item['city'] = '广州';
			item['district'] = row['XZQH'] || '';
			item['street'] = '';
			item['community'] = '';
			item['address'] = row['DZ'] || '';
			item['full_address'] = item['district'] + item['address'];
			item['format_addr'] = '';
			item['longitude'] = '0';
			item['latitude'] = '0';
			item['postcode'] = '';
			row['DH'] = row['DH'] || '';
			item['contact'] = row['DH'].replace(/[0-9|\s]+/g,'');
			item['tel'] = row['DH'].replace(item['contact'],'');
			item['service'] = '';
			item['service_time'] = '';
			item['update_time'] = row['UPDATE_TIME'] || '';
			if(!item.name){
				item['name'] = row['YJBHCSMC'] || '';
				item['contact'] = row['GLRXM']|| '';
				item['tel'] = row['GLRLXDH'] || '';
				item['street'] = row['SSJD'] || '';
				item['address'] = row['JTDZ'] || '';
				item['full_address'] = item['address'];
				if(!item['name'].search('庇护')){
					item['full_address'] = item['address'] + item['name'];
				}
			}
			arr.push(item);
			i++;
		}
	}
	var dropsql = knex.schema.dropTable(tableName).toString();
	await mysqlquery(dropsql);
	var createsql = knex.schema.createTable(tableName, function (table) {
		table.string('sid');
		table.string('num');
		table.string('name');
		table.string('type');
		table.string('city');
		table.string('district');
		table.string('street');
		table.string('community');
		table.string('address');
		table.string('full_address');
		table.string('format_addr');
		table.decimal('longitude',10,6);
		table.decimal('latitude',10,6);
		table.string('postcode');
		table.string('contact');
		table.string('tel');
		table.string('service');
		table.string('service_time');
		table.string('update_time');
	}).toString();
	console.log(createsql);
	await mysqlquery(createsql);
	console.log('createsql');
	var clearsql = knex(tableName).truncate().toString();
	var insertsql = knex(tableName).insert(arr).toString();
	await mysqlquery(clearsql);
	console.log('clearsql');
	// console.log(insertsql);
	const rows = await mysqlquery(insertsql);
	console.log('inserted rows ');
	console.log(rows);
}

async function dataInitSZ() {
	let tableName = 'sz_shelters';
	var exclefile='./sz_origin_data.xlsx';
	var obj = node_xlsx.parse(fs.readFileSync(exclefile));
	var arr = obj[0].data.slice(1);
	let geoarr = [];
	let g = Math.floor(arr.length/10);
	for(let j = 0;j <= g ; j++) {
		geoarr[j] = [];
	}
	for(let i = 0;i < arr.length;i++) {
		let item = {};
		item['sid'] = 'sz'+ i;
		item['num'] = arr[i][2];
		item['name'] = arr[i][1];
		// item['type'] = arr[i][4];
		item['city'] = '深圳';
		item['address'] = arr[i][4];
		item['full_address'] = item['address'];
		item['format_addr'] = '';
		item['longitude'] = '0';
		item['latitude'] = '0';
		item['contact'] = arr[i][0];
		item['update_time'] = arr[i][5];
		// item['postcode'] = arr[i][7];
		// item['tel'] = arr[i][8];
		// item['service'] = arr[i][9];
		// item['service_time'] = arr[i][10];
		arr[i] = item;
		g = Math.floor(i/10);
		geoarr[g].push(item['address']);
	}
	var clearsql = knex(tableName).truncate().toString();
	var insertsql=knex(tableName).insert(arr).toString();
	await mysqlquery(clearsql);
	const rows = await mysqlquery(insertsql);
	console.log('inserted rows ');
	console.log(rows);
}

/* updateGeoCode 将已经整理过的数据 进行地理编码 得到行政区划 街道 坐标等信息
 * 不是逐个更新，而且将整张表导出，清空后插入更新后的数据
 */
async function updateGeoCode(citycode){
	let tableName = cityMap[citycode]['table'];
	let city = cityMap[citycode]['name']
 	let arr = require(`./data/${tableName}.json`);
  let geoarr = [];
	let g = Math.floor(arr.length/10);
	for(let j = 0;j <= g ; j++) {
		geoarr[j] = [];
	}
	for(let i in arr){
		g = Math.floor(i/10);
		geoarr[g].push(arr[i]['full_address']);
	}
	let geocodes = await geoCoder(geoarr,city);
	console.log('----------------------------------');
	// console.log(JSON.stringify(geocodes));
	/***高德地理编码 返回格式 null返回空数组
	{
      "formatted_address": "广东省广州市番禺区桃园路|2号",
      "country": "中国",
      "province": "广东省",
      "citycode": "020",
      "city": "广州市",
      "district": "番禺区",
      "township": [],
      "neighborhood": { "name": [], "type": [] }, // 所在社区
      "building": { "name": [], "type": [] }, // 所在楼栋
      "adcode": "440113",
      "street": "桃园路",
      "number": "2号",
      "location": "113.332609,22.903014",
      "level": "门牌号"
    }
	**/
	for(let i = 0;i<geoarr.length;i++){
		let locations = geocodes[i];
		for( let j = 0; j<geoarr[i].length; j++){
			let item = locations[j];
			let index = 10*i + j;
			arr[index]['format_addr'] = item['formatted_address'];
			let location = item['location'].toString().split(',');
			arr[index]['longitude'] = location[0] || 0;
			arr[index]['latitude'] = location[1] || 0;
			arr[index]['district'] = item['district'];
			arr[index]['street'] = item['street'] instanceof String ? item['street'] : '';
			arr[index]['community'] =  item['neighborhood']['name'] instanceof String ? item['neighborhood']['name'] : '';
		}  
	}
	var clearsql = knex(tableName).truncate().toString();
	var insertsql=knex(tableName).insert(arr).toString();
	await mysqlquery(clearsql);
	const rows = await mysqlquery(insertsql);
	console.log('inserted rows ');
	console.log(rows);
}

function onReady() {
  console.log('-----start myshelter script-----');
	// jsonInitGZ('gz');
  // updateGeoCode('gz');
}

onReady();