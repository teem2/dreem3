// Copyright 2015 Teem2 LLC, MIT License (see LICENSE)
// Reactive renderer

define.class(function(require, exports, self){

	var Node = require('$base/node')
	
	self.render = function(object, parent, globals, rerender){
		// set up property binding values
		Object.defineProperty(object, 'parent', {value:parent})
		for(var key in globals){
			Object.defineProperty(object, key, {value:globals[key]})
		}

		var recur 
		// store the attribute dependencies
		object.atAttributeGet = function(key){
			// if we use an attribute that has a property binding, try to initialize it now
			if(this.isWired(key)){
				//var inits = []
				//this.connectBinding(key, inits)
				//for(var i = 0; i < inits.length; i++) inits[i]()
			}
			this[key] = function(){
				rerender(this)
			}
		}

		// create more children!
		var children = object.render(parent)

		object.atAttributeGet = undefined
		
		if(children){
			if(!object.children) object.children = []
			if(Array.isArray(children))
				object.children.push.apply(object.children, children)
			else object.children.push(children)
		}


		if(object.children) for(var i = 0; i < object.children.length; i++){
			// create child name shortcut
			var child = object.children[i]
			var name = child.name
			if(name !== undefined && !(name in object)) object[name] = child
			this.render(child, object, globals, rerender)
		}
	}

	self.connectWires = function(object, initarray){
		object.connectWires(initarray)
		if(object.children) for(var i = 0; i < object.children.length; i++){
			var child = object.children[i]
			this.connectWires(child, initarray)
		}
	}

	self.fireInit = function(node){
		// on demand attribute binding initializer
		//node.atAttributeGet = function(key){
		//	if(this.isBound(key)){
		//		attr.connectBinding()
		//		attr.bindfn()
		//	}
		//}
		node.emit('init')

		if(node.children) for(var i = 0; i < node.children.length; i++){
			this.fireInit(node.children[i])
		}

		node.atAttributeGet = undefined
	}

	self.destroy = function(object, parent){
		// tear down all listener structures
		var obj = object
		while(obj){
			// emit a destroy
			obj.ondestroy.emit()

			var listeners = obj._proplisten
			if(listeners){
				for(var i = 0;i < listeners.length; i++){
					listeners[i]()
				}
				obj._proplisten = undefined
			}
			for(var key in obj){
				var attr = obj['attr_' + key]
				if(attr && attr.owner == obj){
					attr.removeAllListeners()
				} 
			}
			if(obj.child){
				for(var i =0; i<obj.child.length; i++){
					this.destroy(obj.child[i], obj)
				}
			}
			obj = obj.outer
		}
	}

	self.dump = function(node, depth){
		var ret = ''
		if(!depth) depth = ''
		ret += depth + node.name + ': ' + node.constructor.name
		var outer = node.outer
		while(outer){
			ret += " - " + outer.constructor.name
			outer = outer.outer
		}
		if(node.children) for(var i = 0; i<node.children.length; i++){
			ret += "\n"
			ret += this.dump(node.children[i], depth +'-')
		}
		return ret
	}
})