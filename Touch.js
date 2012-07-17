(function(_root){

var E_TYPE_START=( window.ontouchstart===undefined ) ? 'mousedown' : 'touchstart';
var E_TYPE_MOVE=( window.ontouchmove===undefined ) ? 'mousemove' : 'touchmove';
var E_TYPE_END=( window.ontouchend===undefined ) ? 'mouseup' : 'touchend';
var E_TYPE_CANCEL='touchcancel';
var E_TYPE_CLICK='click';
function D(s){D.on && console.log(s);}
D.on=true;

function Tpos(){
	this.first=[];
	this.last=[];
	this.current=[];
}
Tpos.prototype={
add: function(evt){
	if( evt.touches ){
		var x,y;
		for( var i=0,touch; touch=evt.touches[i]; i++ ){
			this._setPos(i, touch);
		}
	}else{
		this._setPos(0, evt);
	}
	
	return this;
	
},
clear: function(){
	var i=this.last.length;
	while( i-- ){
		delete this.last[i];
	}
	
	i=this.current.length;
	while( i-- ){
		delete this.current[i];
	}
	
	i=this.first.length;
	while( i-- ){
		delete this.first[i];
	}
	
	this.first.length=this.last.length=this.current.length=0;
	return this;
},
def: function(id, withStart){
	var cur=this.current[id];
	var lst=( withStart ) ? this.first[id] : this.last;
	
	return {x: cur.x-lst.x, y: cur.y-lst.y};
},
_setPos: function(id, evt){
	var cur=this.current[id];
	this.current[id]={x:evt.pageX,y:evt.pageY};
	if( this.first[id]===undefined ){
		this.first[id]=this.current[id];
	}
	this.last[id]=cur || this.current[id];
},
destroy: function(){
	this.clear();
}
};

function Touch(element, cbStart, cbEnd, cbMove){
	this.element=( typeof(element)==='string' )? document.getElementById(element) : element;
	
	this.__events={};
	this.cbStart=cbStart;
	this.cbEnd=cbEnd;
	this.cbMove=cbMove;
	
	this.cbClick=null;
	this.cbCancel=null;
	
    this.target=null;
	this.targets=[];
    this.currentTargets=[];
    this.targetTouches=[];
    this.changedTouches=[];
	
	this.tpos=new Tpos();
	
    this.on();
	this.on('cancel');
    this.on('click');
	
}

Touch.prototype={
_start: function(evt){
D('_start');
    var mtx=this.element.getBoundingClientRect();
	this.metorix={x:mtx.left, y:mtx.top, r:mtx.right, b:mtx.bottom, w:mtx.right-mtx.left, h:mtx.bottom-mtx.top};
	
	this.tpos.add(evt);
	
    this._setTarget(evt);
	this._setOptionalTargets(evt);
	
	this.stopEvent(evt);
	if( this.cbStart && this.inElement(this.targets[0]) ){
		this.cbStart.call(this, evt, this.tpos.current);
	
	}
//    if( this.touchCount()===1 ){
//        this.on('move');
//        this.on('end');
//    }
 	
D('_start;');
	return true;
},
_move: function(evt){
D('_move');
    this.tpos.add(evt);
 
    this._setOptionalTargets(evt);
 
    this.stopEvent(evt);
    if( this.cbMove ){
        this.cbMove.call(this, evt, this.tpos.current);
    }
 
D('_move;');
    return true;
},
_end: function(evt){
D('_end ');
 	this._setOptionalTargets(evt);
D('_end2 '+this.targets.length+' '+ this.currentTargets.length+' '+ this.targetTouches.length+' '+this.changedTouches.length);
    
    this.stopEvent(evt);
    if( this.cbEnd ){
        this.cbEnd.call(this, evt, this.tpos.current);
    }
D('_end3 '+this.tpos); 
 
//    if( this.touchCount()===0 ){
        this.tpos.clear();
//        this.off('move');
//        this.off('end');
//    }
D('_end;'); 
    if( this.changedTouches[0]===this.currentTargets[0] ){
        this._click(evt);
    }
    return true;
},
_click: function(evt){
D('_click ');

//	this.tpos.add(evt);
//	this._setOptionalTargets(evt);
	
D('_click '+this.target);

    this.stopEvent(evt);
	if( this.cbClick ){
		this.cbClick.call(this, evt, this.tpos.current);
	}
	this.tpos.clear();
	
},
_cancel: function(evt){
D('_cancel '+this.target);
	
	this.stopEvent(evt);
	if( this.cbCancel ){
		this.cbCancel.call(this, evt, this.tpos.current);
	}
	
	this.tpos.clear();
//	this.off('move');
//	this.off('end');

	return true;
},
_setOptionalTargets: function(evt){
D('_setOTar ');
	this.currentTargets=this._getCurrentTargets(evt);
    
//D('_setOTar2 '+evt.changedTouches);
    if( evt.changedTouches ){
        var t=evt.changedTouches;
        this.changedTouches.length=t.length;
        for( var i=0; i<t.length; i++ ){
            this.changedTouches[i]=t[i].target;
        }
    }else{
        this.changedTouches.length=0;
    }
//D('_setOTar3'+evt.targetTouches);
    if( evt.targetTouches ){
        var t=evt.targetTouches;
        this.targetTouches.length=t.length;
        for( var i=0; i<t.length; i++ ){
            this.targetTouches[i]=t[i].target;
        }
    }else{
        this.targetTouches.length=0;
    }
//D('_setOTar; '+this.currentTargets.length+', '+this.targetTouches.length+', '+this.changedTouches.length );
	return this;
},

_getCurrentTargets: function(evt){
D('getCTars ');
    var ret=[];
	
	var cname=this.element.dataset.keypad;
	var els=(cname)? this.element.getElementsByClassName(cname): this.element.getElementsByTagName('*');
    
    els=Array.prototype.slice.call(els);
    els.push(this.element);
//D('getCTars2 '+els+' '+els.length+' '+cname);
	
	var regcname=new RegExp("(^|\\s)" + cname + "(\\s|$)");
    
    for( var i=0, tpos, touch; touch=this.tpos.current[i]; i++ ){
//D('getCTars4 '+i+':'+touch.x+','+touch.y);
		
		for( var k=0, el; el=els[k]; k++ ){
//D('getCTars5 '+k+':'+el.nodeName+','+el.childNodes.length+' '+el.className+':'+regcname.test(el.className));
            //if( !(cname && regcname.test(el.className)) && el.childNodes.length>1 || el.firstChild.nodeType===1 ){
            if( el.className && regcname.test(el.className) ){
                ;
            }else{
                if( el.childNodes.length>1 || el.firstChild && el.firstChild.nodeType===1 ){
//D('getCTars con '+k);
                    continue;
                }
            }
//D('getCTars6 '+k);
			var rect=el.getBoundingClientRect();
//D('getCTars7 '+rect.left+','+rect.top);
			if( rect.left<=touch.x && touch.x<=rect.right && rect.top<=touch.y && touch.y<=rect.bottom ){
//D('getCTars break '+ret.length);
				ret[ret.length]=el;
				break;
			}
	    }
	}
    
D('_getCTars; '+ret+' '+ret.length);
//D('_getTars; '+ret+' '+ret[0].nodeName+' '+((ret[0].childNodes.length)?ret[0].childNodes.length+' '+ret[0].firstChild.nodeType:'')+' '+ret[0].dataset.n);
	return ret;
},
//_getTarget: function(evt){
//    var ret=null;
//	
//	var touch=this.tpos.current[0];
//	
//console.log('_getTar '+touch.x+' '+touch.y);
//    
//	var cname=this.element.dataset.classname;
//    var els=(cname)? this.element.getElementsByClassName(cname): this.element.getElementsByTagName('*');
//    if( els ){
//    for( var i=0, el; el=els[i]; i++ ){
//        if( el.childNodes.length>1 || el.firstChild.nodeType===1 ){
//            continue;
//        }
//        var rect=el.getBoundingClientRect();
//        if( rect.left<=touch.x && touch.x<=rect.right && rect.top<=touch.y && touch.y<=rect.bottom ){
//            ret=el;
//            break;
//        }
//    }
//    }
//    
//    if( !ret ){
//        var rect=this.element.getBoundingClientRect();
//        if( rect.left<=touch.x && touch.x<=rect.right && rect.top<=touch.y && touch.y<=rect.bottom ){
//            ret=this.element;
//        }
//    }
//    
//console.log('_getTar; '+ret+' '+ret.nodeName+' '+((ret.childNodes.length)?ret.childNodes.length+' '+ret.firstChild.nodeType:'')+' '+ret.dataset.n);
//	return ret;
//},
//_setTargets: function(evt){
//	this.target=this._getTarget(evt);
//	
//	if( evt.touches ){
//console.log('_setTar-if '+evt.touches +', '+evt.targetTouches+', '+evt.changedTouches);
//        
//       	var tt=( evt.targetTouches.length )? evt.targetTouches: evt.changedTouches;
////console.log('_setTar2 '+tt[0]+' '+tt.length);
//		this.targets.length=tt.length;
//        for( var i=0; i<tt.length; i++ ){
//			this.targets[i]=tt.target;
//		}
//	}else{
//		this.targets.length=1;
//		this.targets[0]=evt.target;
//	}
//console.log('_setTar; '+this.target+' '+this.target.dataset.n+', '+this.pos(0,1).y+','+this.posDef(0,1).y );
//	return this;
//},
_setTarget: function(evt){
	this._getTouchesTarget(evt);
	this.target=this.targets[0];
},
_getTouchesTarget: function(evt){
D('_getTar ');
	if( evt.touches && evt.touches.length ){
		var touches=evt.touches;
D('_getTar1 '+touches.length);
		this.targets.length=touches.length;
		for( var i=0; i<touches.length; i++ ){
			this.targets[i]=touches[i].target;
		}
	}else{
D('_getTar1 else');
		this.targets.length=1;
		this.targets[0]=evt.target||evt.touches[0].target;
	}
},

click: function(callback){
	this.off('click');
	this.cbClick=callback;
	this.on('click');
},
start: function(callback){
	this.off('start');
	this.cbStart=callback;
	this.on('start');
},
move: function(callback){
	this.off('move');
	this.cbMove=callback;
	this.on('move');

},
end: function(callback){
	this.off('end');
	this.cbEnd=callback;
	this.on('end');
},
cancel: function(callback){
	this.off('cancel');
	this.cbCancel=callback;
	this.on('cancel');
},
inElement: function( el ){
	var mx=this.metorix, tp=this.tpos.current[0];
console.log('inE '+mx.x+' '+tp.x+' '+mx.r+', '+mx.y+' '+tp.y+' '+mx.b);
	return ( mx.x<=tp.x && tp.x<=mx.r && mx.y<=tp.y && tp.y<=mx.b );
},
//inElement: function( el ){
//	while( el ){
//		if( el==this.element ){
//			return true;
//		}
//		el=el.parentNode;
//	}
//	return false;
//},
touchCount: function(){
	return this.tpos.current.length;
},
addEvent: function(element, type, fn, flg){
	this.__events[type]=(function(_f, that){ return function(evt){ _f.call(that, evt); }; })(fn, this);
	
	element.addEventListener(type, this.__events[type], flg||false);
	return this;
},
removeEvent: function(element, type, fn, flg){
	if( this.__events[type] ){
		element.removeEventListener(type, this.__events[type], flg||false);
	}
	//element.removeEventListener(type, fn, flg||false);
	return this;
},
stopEvent: function(e){
	e.preventDefault();
	//e.stopPropagation();
	
},
on: function(type){
	switch(type){
	case 'start':
		this.addEvent(this.element, E_TYPE_START, this._start);
		break;
	case 'move':
		this.addEvent(this.element, E_TYPE_MOVE, this._move);
		break;
	case 'end':
		this.addEvent(this.element, E_TYPE_END, this._end);
		break;
	case 'cancel':
		this.addEvent(this.element, E_TYPE_CANCEL, this._canceled);
		break;
	case 'click':
		this.addEvent(this.element, E_TYPE_CLICK, this._click);
		break;
    case 'all':
        this.addEvent(this.element, E_TYPE_CANCEL, this._canceled);
        this.addEvent(this.element, E_TYPE_CLICK, this._click);
    default:
        this.addEvent(this.element, E_TYPE_START, this._start);
		this.addEvent(this.element, E_TYPE_MOVE, this._move);
		this.addEvent(this.element, E_TYPE_END, this._end);
	}
	return this;
},
off: function(type){
	switch(type){
	case 'start':
		this.removeEvent(this.element, E_TYPE_START, this._start);
		break;
	case 'move':
		this.removeEvent(this.element, E_TYPE_MOVE, this._move);
		break;
	case 'end':
		this.removeEvent(this.element, E_TYPE_END, this._end);
		break;
	case 'cancel':
		this.removeEvent(this.element, E_TYPE_CANCEL, this._canceled);
        break;
	case 'click':
		this.removeEvent(this.element, E_TYPE_CLICK, this._click);
		break;
	case 'all':
        this.removeEvent(this.element, E_TYPE_CANCEL, this._canceled);
        this.removeEvent(this.element, E_TYPE_CLICK, this._click);
    default:
		this.removeEvent(this.element, E_TYPE_START, this._start);
		this.removeEvent(this.element, E_TYPE_MOVE, this._move);
		this.removeEvent(this.element, E_TYPE_END, this._end);
	}
	return this;
},
posDef: function(id, withStart){
	id=id||0;
	return this.tpos.def(id, withStart);
},
pos: function(id){
	id=id||0;
	return this.tpos.current[id];
},
posLast: function(id){
	id=id||0;
	return this.tpos.last[id];
},
destroy: function(){
    this.off('all');
	delete this.cbStart;
	delete this.cbMove;
	delete this.cbEnd;
    delete this.cbClick;
    delete this.cbCancel;
    
    this.changedTouches=this.targets=this.target=this.currentTargets=this.targetTouches=null;
    delete this.target;
    delete this.targets;
    delete this.currentTargets;
    delete this.targetTouches;
    delete this.changedTouches;
            
    this.tpos.destroy();
	delete this.tpos;
	
}
};

_root.Touch=Touch;
})(window);
