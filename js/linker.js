/*
 TODO
 prevent multiple onLoad call
 list current(active) ids
 */
DiveLinker.prototype.getAttrIds = function(name){
    let ret = [];
    let list = this.getIOList();
    for(let id in list.inValue) {
        if(list.inValue[id].name == name && !ret.includes(list.inValue[id].id)) {
            ret.push(list.inValue[id].id);
        }
    }
    for(let id in list.outValue) {
        if(list.outValue[id].name == name && !ret.includes(list.outValue[id].id)) {
            ret.push(list.outValue[id].id);
        }
    }
    return ret;
}
DiveLinker.prototype.getAttrValues = function(name){
    let ret = [];
    let outList = this.getOutputList();
    for(let id in outList)
        if(outList[id].name == name)
            ret.push(outList[id].value);
    return ret;
}
DiveLinker.prototype.getItem = function(name){
    let items = this.getProject().items;
    for(let item in items){
        if(items[item].itemName == name){
            return items[item];
        }
    }
}
DiveLinker.prototype.getItemAttrId = function(item, name){
    let items = this.getProject();
    items = items.items;
    for(let i in items){
        if(items[i].itemName == item){
            for(let attr in items[i].attributes){
                if(items[i].attributes[attr].attributeName == name){
                    return items[i].attributes[attr].attributeID;
                }
            }
            break;
        }
    }
}

DiveLinker.prototype.getItemsByAttr = function(name){
    let items = this.getProject().items;
    let ret = [];
    let list = this.getAttrIds(name);
    for(let item in items) {
        for(let id in list){
            if(items[item].attributes[list[id]]){
                ret.push(items[item]);
                break;
            }
        }
    }
    return ret;
}

class Linker{
    constructor(entry_id, options){
        this.linkers = {};  //DiveLinker list
        this.container = document.getElementById('container');
        this.back_to_fullscreen = document.createElement('div');
        this.back_to_fullscreen.style.backgroundColor = "black";
        this.back_to_fullscreen.style.opacity = 0.5;
        this.back_to_fullscreen.style.position = 'absolute';
        this.back_to_fullscreen.style.top = 0;
        this.back_to_fullscreen.style.left = 0;
        this.back_to_fullscreen.style.width = '100%';
        this.back_to_fullscreen.style.height = '100%';
        this.back_to_fullscreen.style.display = 'none';
        this.back_to_fullscreen.style.color = 'white';
        this.back_to_fullscreen.style.textAlign = 'center';
        this.back_to_fullscreen.style.fontSize = '200%';
        this.back_to_fullscreen.style.lineHeight = '1000%';
        var _this = this;
        document.onfullscreenchange = function(){
            if(!document.fullscreenElement || !document.webkitFullscreenElement){
                _this.back_to_fullscreen.style.display = "block";
            }
        }
        this.back_to_fullscreen.onclick = function(){
            _this.fullscreen().then(function(){
                _this.lockOrientation('landscape');
                _this.back_to_fullscreen.style.display = "none";
            });
        }
        this.back_to_fullscreen.innerHTML = "點我回到全螢幕";
        this.container.append(this.back_to_fullscreen);
        this.loading_screen = document.createElement("canvas");
        this.loading_screen.style.backgroundColor = 'black';
        this.loading_screen.style.position = 'absolute';
        this.loading_screen.width = 1920;
        this.loading_screen.height= 1080;
        this.loading_screen.style.width = '100%';
        this.loading_screen.style.height = '100%';
        this.loading_screen.style.display = 'none';
        this.container.append(this.loading_screen);
        this.preloadList = {};  //preload cache
        for(let property in options)
            this[property] = options[property];
        this.append(entry_id);
        this.loading(this.linkers[entry_id]);
    }
    getAllIds(){
        var ret = [];
        for(let id in this.linkers){
            ret.push(parseInt(id));
        }
        return ret;
    }
    append(id){ //append specified iframe and linker of given id
        let iframe = document.createElement("IFRAME");
        iframe.frameBorder=0;iframe.style.display="none";iframe.style.width="100%";iframe.style.height="100%";
        iframe.src = "http://dive.nutn.edu.tw:8080/Experiment//kaleTestExperiment5.jsp?eid="+id.toString()+"&record=false";
        iframe.name = "dive"+id.toString();
        this.container.appendChild(iframe);   //initial iframe
        this.linkers[id] = new DiveLinker(iframe.name);
    }
    remove(id){ //remove iframe and linker of given id
        this.container.removeChild(this.linkers[id].target);
        delete this.linkers[id];
    }
    loading(linker){    //check if linker loaded, will trigger onLoad once loaded
//         this.loading_screen.innerHTML = "loading";
        linker.target.style.display = "block";
        this.loading_screen.style.display = 'block';
        let _this = this;
        let loading_ctx = this.loading_screen.getContext('2d');
        let id = linker.getProjectID(); //current id
        this.loadingTimer = setTimeout(function _loading(){
            linker.getIOList(); //keep updating or IOList regardless of loadingStatus
            loading_ctx.clearRect(0, 0, _this.loading_screen.width, _this.loading_screen.height);
            let text_rect = loading_ctx.measureText("Loading.....");
            loading_ctx.font = "64px Arial";
            loading_ctx.fillStyle = "white";
            loading_ctx.fillText("Loading"+".".repeat(_this.loadingTimer%5), (_this.loading_screen.width/2)-(text_rect.width/2), (_this.loading_screen.height/2));
            if(!linker.getLoadingStatus()){ //not loaded
                _this.loadingTimer = setTimeout(_loading, 100);
                return;
            }
            linker.getProject();
            setTimeout(function(){
//                 _this.loading_screen.innerHTML = "點任意處開始";
                loading_ctx.clearRect(0, 0, _this.loading_screen.width, _this.loading_screen.height);
                let text_rect = loading_ctx.measureText("點任意處開始");
                loading_ctx.fillText("點任意處開始", (_this.loading_screen.width/2)-(text_rect.width/2), (_this.loading_screen.height/2));
                _this.loading_screen.onclick = function(){
                    loading_ctx.clearRect(0, 0, _this.loading_screen.width, _this.loading_screen.height);
                    _this.loading_screen.style.display = 'none';
                    _this.loading_screen.onclick = null;
                }
            }, 1000);
            if(_this.functionList.hasOwnProperty(id) && typeof(_this.functionList[id]).onLoad === "function"){
                _this.functionList[id].onLoad(linker, _this);
            }
            else{
                _this.functionList['fallback'].onLoad(linker, _this);
            }
            delete _this.loadingTimer;
        }, 100);
    }
    preload(linker){    //get preload list and append them
        let id = linker.getProjectID(); //current id
        if(!this.preloadList[id]){
            var preloads = linker.getAttrValues('preloadNum');
            for(var i=0;i<preloads.length;i++){
                preloads[i] = parseInt(preloads[i]);
            }
            this.preloadList[id] = preloads;
        }
        let len = this.preloadList[id].length;
        for(let i=0; i<len; i++){
            if(!this.getAllIds().includes(parseInt(this.preloadList[id][i]))){
                this.append(this.preloadList[id][i]);
            }
        }
    }
    complete(linker){   //check if project complete, will trigger onComplete once complete
        let parent = this;
        this.completeTimer = setTimeout(function _complete(){
            if(linker.checkComplete()){
                delete parent.completeTimer;
                if(parent.functionList.hasOwnProperty(linker.getProjectID()) && typeof(parent.functionList[linker.getProjectID()]).onComplete === "function")
                    parent.functionList[linker.getProjectID()].onComplete(linker, parent);
                else 
                    parent.functionList['fallback'].onComplete(linker, parent);
            }
            else
                parent.completeTimer = setTimeout(_complete, 100);
        }, 100);
    }
    fullscreen(){
        if(document.fullscreenEnabled || document.webkitFullscreenEnabled){
            if(!document.fullscreenElement || !document.webkitFullscreenElement){
                if(this.container.requestFullscreen){
                    return this.container.requestFullscreen();
                }
                else if(this.container.webkitRequestFullscreen){
                    return this.container.webkitRequestFullscreen();
                }
            }
            else{
                console.error("there are already fullscreen element");
            }
        }
        else
            console.error('this browser not support fullscreen');
    }
    exitFullscreen(){
        if(document.fullscreenElement || document.webkitFullscreenElement){
            if(document.exitFullscreen){
                return document.exitFullscreen();
            }
            else if(document.webkitExitFullscreen){
                return document.webkitExitFullscreen();
            }
        }
    }
    async lockOrientation(orientation){
        if(document.fullscreenElement || document.webkitFullscreenElement)
            screen.orientation.lock(orientation);
        else
            console.error("There must have a fullscreen element to lock orientation");
    }
    gonext(linker){ //get next id and clear projects of non nextid, then loading it
        let nextId = parseInt(linker.getAttrValues('gonext')[0]);
        linker.stop();
        linker.target.style.display = "none";
        var next_preloads = this.preloadList[nextId];
        for(let id in this.linkers){
            if(this.preloadList[nextId] && next_preloads.includes(parseInt(id))){
                this.linkers[id].stop();
                this.linkers[id].isComplete = false;
                this.linkers[id].target.style.display = "none";
            }
            else if(this.linkers[id].getProjectID() != nextId)
                this.remove(id);
        }
        if(this.linkers[nextId]){
            this.linkers[nextId].isComplete = false;
        }
        else{
            this.append(nextId);
        }
        this.loading(this.linkers[nextId]);
    }
}
