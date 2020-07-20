const { nearestTen, getDistance, cityMap, districtMap } = require('../../utils/shelters_utils.js');
const { dataPost, getLogin, dataGet, dataGetCount} = require('../../utils/router.js');
const { parsePolyline, reverseGeoCoder, calculateDistance, sdkDirection, fillMarker } = require('../../utils/map_utils.js');
const { CONFIG } = require('../../utils/config.js');
const app = getApp();
const LEVEL = 14;
const routeColor = ['#f4c8b5','#f5956b']; // 路径颜色
let markersARR = [];//markers数据项
let topTen = [];
let viewpoints = [];//视野中的点

// 实例化API核心类
const db = wx.cloud.database();
const _ = db.command;

let routes = [
  { mode: 'WALKING', distance: 9999, duration: 99 },
  { mode: 'DRIVING', distance: 10000, duration: 90 },
  { mode: 'DRIVING', distance: 14200, duration: 92 },
];
Page({
  data: {
    sdkkey: CONFIG.sdkkey,
    sdksecret: CONFIG.sdksecret,
    mapview: true,
    listhide: true,
    searchhide: false,
    detailhide: true,
    starthidden: true,
    toTopFade: false,
    wayfound: true,
    guidehide: true,
    mapGuide: false,
    profilehide: true,
    loading: false,
    moreloading: false,
    name: '',
    city: 'gz',
    district: 0,
    cityName:'',
    districtName: '',
    comment: '',
    commentList: [],
    page: 0,
    moreLoding: false,
    searchList: [], // 及时搜索列表
    collectList: [], //收藏列表
    curList: [],
    districtPicking: false,
    scale: LEVEL,
    // longitude: 116.358316,
    // latitude: 39.880533,
    longitude: false,
    latitude: false,
    userLocation:[116.358316,39.880533],
    startLocation:[116.358316,39.880533],
    distance: 1000,
    detectEnable: true,
    datalist: [],
    nearby: [],
    markers: [],
    polyline: [],
    currIndex: 0,
    currRoute: { mode:'WALKING',distance: 9999, duration:99},
    locations: [],
    southwest: {
      longitude: 116.374414,
      latitude: 39.900927,
    },
    northeast: {
      longitude: 116.342228,
      latitude: 39.865163,
    },
    autoDetect: false,
    collected: false,
    userInfo: {
      'nick_name': '',
      'openid': '',
    }, // nickName avatarUrl gender province city country
    detail: {
      "sid": "bj546",
      "num": "",
      "name": "",
      "type": "",
      "city": "",
      "district": "",
      "street": "",
      "community": "",
      "address": "",
      "full_address": "",
      "format_addr": "",
      "longitude": '',
      "latitude": '',
      "postcode": "",
      "tel": "",
      "service": "",
      "service_time": "",
      "distance": '',
    },
    cityArr: cityMap,
    districtArr: districtMap,
    baseDetail: [
      { "type": '类型' },
      { "postcode": '邮编' },
      { "tel": '联系电话' },
      { "service": '服务内容' },
      { "service_time": '服务时间' }
    ],
    geoDetail: [
      { "city": '城市' },
      { "district": '区县' },
      { "street": '街道' },
      { "community": '社区' },
      { "longitude": '经度' },
      { "latitude": '纬度' },
      { "format_addr": '坐标地址' }
    ],
  },
  onLoad: function (options) {
  },
  onReady(e) {
    let that = this;
    this.mapCtx = wx.createMapContext("myMap");
    this.backToLoc();
    this.initUserLocation().then(msg => {
      reverseGeoCoder().then(msg => {
        that.nearestWay();
      });
    });
    getLogin().then(res =>{
      this.setData({
        userInfo: res.result || {},
      });
      that.getCollectList();
    });
  },

  /* handleEvent 事件处理 */
  onReachBottom: function () {
    if(this.data.listhide){
      return;
    }
    if(this.data.moreloading) {
      return;
    }
    if(this.data.curList.length){
      this.setData({
        moreloading: true
      });
      this.queryMore();
    }
  },

  handleTapMarker(e) {
    let i = e['markerId'];
    let len = this.data.markers.length - 1;
    if(len - i){
      return;
    }else {
      this.nearestWay();
    }
  },
  handleTapBubble(e) {
    let i = e['markerId'];
    let detail = markersARR[i];
    let lng1 = this.data.startLocation[0];
    let lat1 = this.data.startLocation[1];
    let lng2 = detail.longitude;
    let lat2 = detail.latitude;
    let distance = getDistance(lng1,lat1,lng2,lat2);
    detail.distance = distance;
    detail.tel = detail.tel || '';
    detail.service = detail.service || '';
    detail.service_time = detail.service_time || '';
    this.setData({
      detail: detail,
    });
    this.toDetail();
  },

  handleTapSearch() {
    if(this.data.listhide) {
      return;
    }
    this.setData({
      mapview: false,
      listhide: false,
      searchhide: false,
      detailhide: true,
    });
    this.queryAuto();
  },
  handleActiveStart() {
    this.setData({
      starthidden: false,
    });
  },
  handleConfirmStart() {
    this.setData({
      starthidden: true,
    });
    let that = this;
    that.getCenterLocation().then(msg => {
      reverseGeoCoder().then(res => {
        let city = res.result.address_component.city;
        city = city.replace('市','');
        for(let key in cityMap){
          if (cityMap[key].name === city){
            that.setData({
              city: key,
            });
            break;
          }
        }
        that.nearestWay();
      });
    });
  },
  handleTapSwitch() {
    let i = this.data.currIndex;
    let len = routes.length;
    i = (i+1) % len;
    let curr = routes[i];
    this.setData({
      currIndex: i,
      currRoute: curr,
      polyline: [curr.polyline],
    });
  },
  handleTapGo() {
    let end = {
      longitude: this.data.detail.longitude,
      latitude: this.data.detail.latitude
    };
    viewpoints = [end];
    this.findWay(end);
  },
  
  bindSearchInput(e) {
    let val = e.detail.value;
    if(this.data.name === val){
      return;
    }
    this.setData({
      name: val
    });
  },
  bindCommentInput(e) {
    let val = e.detail.value;
    if (this.data.comment === val) {
      return;
    }
    this.setData({
      comment: val
    });
  },
  toPickDistrict(){
    this.setData({
      districtPicking: true
    });
  },
  pickCity(e) {
    this.setData({
      city: e.target.dataset.id
    });
  },
  pickDist(e){
    let i = e.target.dataset.id;
    this.setData({
      district: i,
      districtPicking: false,
    });
    this.queryAuto();
  },

  moveToSelected(e) {
    let i = e.currentTarget.dataset.id;
    let selected = this.data.searchList[i];
    if(!this.data.profilehide){
      selected = this.data.collectList[i];
    }
    markersARR = [selected];
    let longitude = selected.longitude;
    let latitude = selected.latitude;
    let markers = this.renderMarkers();
    this.setData({
      latitude: latitude,
      longitude: longitude,
      loading: false,
      markers: markers,
    });
    this.toMap();
  },
 

  /* toPage 页面切换 */
  toProfile() {
    if (!this.data.profilehide) {
      return;
    }
    this.getCollectList();
    this.setData({
      mapview: false,
      listhide: true,
      profilehide: false,
    });
  },
  toDetail() {
    if(!this.data.detailhide) {
      return;
    }
    let star = false;
    let sid = this.data.detail.sid;
    let favorates = this.data.userInfo.favorates || '';
    favorates = favorates.split(',');
    for(let i in favorates){
      if(sid === favorates[i]){
        star = true;
        break;
      }
    }
    this.getCommentList();
    this.setData({
      mapview: false,
      listhide: true,
      // searchhide: true,
      detailhide: false,
      collected: star,
      // mapGuide: false,
    });
  },
  toMap() {
    if(this.data.mapview) {
      return;
    }
    this.setData({
      mapview: true,
      listhide: true,
      // searchhide: false,
      detailhide: true,
      guidehide: true,
      profilehide: true,
    });
  },
  toMapGuide() {
    this.setData({
      mapview: true,
      listhide: true,
      searchhide: true,
      detailhide: true,
      guidehide: true,
      mapGuide: true,
    });
  },
  mapGuideCancel() {
    this.setData({
      polyline: '',
      mapGuide: false,
      searchhide: false,
    });
  },
  toGuide() {
    this.setData({
      mapview: false,
      listhide: true,
      searchhide: true,
      detailhide: true,
      guidehide: false,
    });
  },
  toSearch() {
    if(!this.data.listhide) {
      return;
    }
    this.setData({
      mapview: false,
      listhide: false,
      searchhide: false,
      detailhide: true,
    });
    this.queryAuto();
  },
  
  cancelSearch() {
    if (this.data.mapview) {
      return;
    }
    this.setData({
      mapview: true,
      listhide: true,
    });
  },


  /* mapCtx  对地图组件进行操作*/

  drawAllPoints() {
    markersARR = this.data.searchList;
    viewpoints = [];
    for (let i = 0; i < markersARR.length; i++) {
      let point = {};
      let item = markersARR[i];
      point.latitude = item.latitude;
      point.longitude = item.longitude;
      viewpoints.push(point);
    }
    let markers = this.renderMarkers();
    this.setData({
      markers: markers,
      loading: false,
    });
    this.toMap();
    let obj = {};
    obj.points = viewpoints;
    obj.padding = [26,26,26,26];
    this.mapCtx.includePoints(obj);
  },
  findWay(end) {
    let start = {
      longitude: this.data.startLocation[0],
      latitude: this.data.startLocation[1]
    };
    let _this = this;
    let obj = {};
    viewpoints.push(start);
    obj.points = viewpoints;
    obj.padding = [50, 50, 50, 50];
    _this.mapCtx.includePoints(obj);
    let option = {
      start: start,
      end: end,
      mode: 'walking',
    };
    sdkDirection(option).then(res => {
      routes = res;
      option.mode = 'driving';
      sdkDirection(option).then(res => {
        routes = routes.concat(res);
        let polylines = [];
        for(let i in routes){
          let route = routes[i];
          let points = parsePolyline(route.polyline);
          let polyline = {
            points: points,
            color: routeColor[1],
            width: 12,
            arrowLine: true,
          };
          route.polyline = polyline;
          // polylines.push(polyline);
        }
        _this.setData({
          mapGuide: true,
          currIndex: 0,
          currRoute: routes[0],
          wayfound: true,
          polyline: [routes[0].polyline],
        });
        _this.toMapGuide();
      });
    });
  },
  backToLoc() {
    this.initUserLocation().then(msg => {
      this.mapCtx.moveToLocation();
      this.setData({
        'scale': LEVEL,
      });
    });
  },
  initUserLocation() {
    return new Promise((resolve, reject) => {
      let that = this;
      wx.getLocation({ 
        type: 'gcj02', 
        success: function (res) {
          that.setData({
            longitude: res.longitude,
            latitude: res.latitude,
            userLocation: [res.longitude,res.latitude],
            startLocation: [res.longitude,res.latitude],
          });
          resolve('sucess');
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  },
  getCenterLocation() {
    return new Promise((resolve, reject) => {
      let that = this;
      that.mapCtx.getCenterLocation({
        success: function (res) {
          that.setData({
            startLocation: [res.longitude,res.latitude],
          });
          resolve('sucess');
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  },
  getRegion() {
    return new Promise((resolve, reject) => {
      let that = this;
      that.mapCtx.getRegion({
        success: function (res) {
          that.setData({
            southwest: res.southwest,
            northeast: res.northeast,
          });
          resolve('sucess');
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  },
  walkingDistance(){
    return new Promise((resolve, reject) => {
      let end =[];
      for(let i in topTen){
        let item = {};
        item.longitude = topTen[i].longitude;
        item.latitude = topTen[i].latitude;
        end.push(item);
      }
      let start = {
        longitude: this.data.startLocation[0],
        latitude: this.data.startLocation[1]
      };
      let _this = this;
      let obj = {};
      obj.points = end.slice(0);
      obj.points.push(start);
      obj.padding = [26, 26, 26, 26];
      _this.mapCtx.includePoints(obj);
      let option = {
        start: start,
        end: end,
        mode: 'walking',
      };
      calculateDistance(option).then(res => {
        let elements = res.elements;
        for(let i in topTen){
          topTen[i].walkdistance = elements[i].distance;
          // topTen[i].walkduration = elements[i].duration; //步行方式耗时返回0
        };
        option.mode = 'driving'
        calculateDistance(option).then(res => {
          let elements = res.elements;
          for(let i in topTen){
            topTen[i].drivedistance = elements[i].distance;
            topTen[i].driveduration = elements[i].duration;
          };
          let sortarr = topTen.slice(0);
          let minwalk = '';
          let mindrive = '';
          sortarr.sort((a,b) => {
            return a.walkdistance - b.walkdistance;
          });
          minwalk = sortarr[0].sid;
          sortarr.sort((a,b) => {
            return a.driveduration - b.driveduration;
          });
          mindrive = sortarr[0].sid;
          let minall = 0;
          if(minwalk === mindrive){
            minall = minwalk;
          }
          for(let i in markersARR){
            let item = markersARR[i];
            let min = 0;
            if(item.sid === minwalk) {
              min = 1;
            }
            if(item.sid === mindrive) {
              min = 2;
            }
            if(item.sid === minall) {
              min = 3;
            }
            item.min = min;
          }
          resolve('ok');
        });
      });
    });
  },

  /** getData 数据查询 */
  districtQuery() {
    let query = {};
    query.name = new db.RegExp({
      regexp: this.data.name,
      options: 'i',
    });
    let district = this.data.districtArr[this.data.city][this.data.district];
    if (district !== '所有地区') {
      query.district = district;
    }
    return query;
  },
  getCommentList() {
    let params = {
      tablename: 'comments',
      query: {
        sid: this.data.detail.sid
      }
    };
    dataGet(params).then(res => {
      this.setData({
        loading: false,
        commentList: res.data,
      });
    });
  }, 
  getCollectList() {
    let sids = this.data.userInfo.favorates;
    sids = sids.split(',');
    let params = {};
    params.query = {
      sid: db.command.in(sids)
    };
    params.tablename = cityMap[this.data.city].table;
    dataGet(params).then(res => {
      this.setData({
        loading: false,
        collectList: res.data,
      });
    });
  }, 
  queryAuto() {
    this.setData({
      loading: true
    });
    let params = {};
    params.query = this.districtQuery();
    params.tablename = cityMap[this.data.city].table;
    dataGet(params).then(res => {
      this.setData({
        searchList: res.data,
        curList: res.data,
        loading: false,
      });
    });
  },
  queryMore() {
    this.setData({
      moreloading: true
    });
    let params = {};
    let page = this.data.page;
    params.query = this.districtQuery();
    params.tablename = cityMap[this.data.city].table;
    params.skip = page * 20;
    dataGet(params).then(res => {
      let searchList = this.data.searchList;
      searchList = searchList.concat(res.data);
      this.setData({
        curList: res.data,
        page: page + 1,
        searchList: searchList,
        moreloading: false
      });
    })
    .catch(err => {
      console.error(err);
      this.setData({
        moreloading: false
      });
      return err;
    });
  },
  getNearbyInfo(ids) {
    let len = ids.length;
    let n = Math.floor(len / 20);
    let sum = 0;
    let params = {};
    params.tablename = cityMap[this.data.city].table;
    for (let i = 0; i <= n; i++) {
      let count = i * 20;
      let temp = ids.slice(count, count + 20);
      params.query = {
        sid: db.command.in(temp)
      };
      dataGet(params).then(res => {
        let data = res.data;
        for (let i = 0; i < data.length; i++) {
          let index = count + i;
          let item = data[i];
          markersARR[index] = item;
        }
        if (sum === n) {
          return;
        }
        sum++;
      });
    }
  },
  getRegionInfo(total) {
    let n = Math.floor(total / 20);
    let sum = 0;
    let params = this.getRegionParams();
    dataGet(params).then(res => {
      let data = res.data;
      for (let i = 0; i < data.length; i++) {
        let index = i;
        let item = data[i];
        markersARR[index] = item;
      }
      if (sum === n) {
        return;
      }
      sum++;
    });
    for (let i = 1; i <= n; i++) {
      params.skip = i * 20;
      dataGet(params).then(res => {
        let data = res.data;
        for (let i = 0; i < data.length; i++) {
          let index = count + i;
          let item = data[i];
          markersARR[index] = item;
        }
        if (sum === n) {
          return;
        }
        sum++;
      });
    }
  },
  getRegionCount() {
    let params = this.getRegionParams();
    dataGetCount(params).then(res => {
      return res.total;
    });
  },
  
  addComment() {
    if (this.data.loading) {
      return;
    }
    let item = {};
    item.sid = this.data.detail.sid;
    item.openid = this.data.userInfo.openid;
    item.comment = this.data.comment;
    item.time_stamp = new Date();
    item.time_stamp = item.time_stamp.toString();
    if (!item.comment || !item.sid || !item.openid) {
      console.error('缺少评论信息');
      return;
    }
    let data = {};
    data.tablename = 'comments';
    data.query = item;
    data.method = 'add';
    this.setData({
      loading: true,
    });
    dataPost(data).then(msg => {
      this.getCommentList();
    });
  },
  detailStar() {
    let that = this;
    if(this.data.loading){
      return;
    }
    let item = {};
    let sid = this.data.detail.sid;
    let openid = this.data.userInfo.openid;
    if (!sid || !openid) {
      console.error('缺少用户信息');
      return;
    }
    let favorates = this.data.userInfo.favorates || '';
    favorates = favorates ? favorates.split(',') : [];
    let collected = this.data.collected;
    if (!collected){
      favorates.push(sid);
    }else {
      let temp = [];
      for(let i in favorates){
        if (favorates[i] === sid || favorates[i] === ''){
          continue;
        }
        temp.push(favorates[i]);
      }
      favorates = temp;
    }
    favorates = favorates.join(',');
    item.favorates = favorates;
    let query = {};
    query.query = {openid : openid};
    query.item = item;
    let data = {};
    data.tablename = 'users';
    data.query = query;
    data.method = 'update';
    let userInfo = this.data.userInfo;
    userInfo.favorates = favorates;
    that.setData({
      loading: true,
    });
    dataPost(data).then(msg => {
      that.setData({
        loading: false,
        collected: !collected,
        userInfo: userInfo,
      });
    });
  },   
 
  nearestWay() {
    let that = this;
    let lng = that.data.startLocation[0];
    let lat = that.data.startLocation[1];
    topTen = nearestTen(that.data.city, lng, lat);
    let ids = [];
    for (let i in topTen) {
      ids.push(topTen[i].sid);
    }
    markersARR = topTen.slice(0);
    this.getNearbyInfo(ids);
    that.walkingDistance().then(msg => {
      let markers = that.renderMarkers();
      let nearest = {};
      for (let i in markersARR) {
        let min = markersARR[i].min;
        if (!min) {
          continue;
        }
        if (min === 1) {
          nearest = markersARR[i];
        }
        if (min === 2) {
          let point = {
            longitude: markersARR[i].longitude,
            latitude: markersARR[i].latitude
          }
          viewpoints = [point];
        }
        if (min === 3) {
          nearest = markersARR[i];
        }
      }
      let end = {
        longitude: nearest.longitude,
        latitude: nearest.latitude
      }
      viewpoints.push(end);
      that.setData({
        markers: markers,
      });
      that.findWay(end);
    });
  },

  renderMarkers(msg) {
    let markers = [];
    for (let i = 0; i < markersARR.length; i++) {
      markers.push(fillMarker(markersARR[i],i));
    }
    let item = {};
    item.id = markersARR.length;
    item.longitude = this.data.startLocation[0];
    item.latitude = this.data.startLocation[1];
    item.iconPath = '../../images/start.png';
    item.anchor = {
      x: 0.5,
      y: 1,
    };
    item.height = 36;
    item.width = 36;
    markers.push(item);
    return markers;
  },

  searchInRegion() {
    wx.showLoading();
    this.getRegion();
    let total = this.getRegionCount();
    wx.showToast({
      title: '' + total,
    });
    this.getRegionInfo(total);
    this.setData({
      markers: this.renderMarkers(),
    });
  },

  getRegionParams() {
    let lons = [this.data.southwest.longitude,this.data.northeast.longitude];
    let lats = [this.data.southwest.latitude,this.data.northeast.latitude];
    let query = this.districtQuery();
    let params = {};
    params.tablename = cityMap[this.data.city].table;
    params.query = _.and([
      {
        longitude: _.gt(lons[0]).and(_.lt(lons[1])),
      },
      {
        latitude: _.gt(lats[0]).and(_.lt(lats[1]))
      },
      query,
    ]);
    return params;
  },
});