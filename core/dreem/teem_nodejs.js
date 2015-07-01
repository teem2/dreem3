// Copyright 2015 this2 LLC, MIT License (see LICENSE)
// teem class

define.class('$dreem/teem_base', function(require, exports, self, Base){

	var Node = require('$base/node')
	var RpcProxy = require('$rpc/rpcproxy')
	var RpcMulti = require('$rpc/rpcmulti')
	var RpcPromise = require('$rpc/rpcpromise')
	var Renderer = require('$renderer/renderer')

	// ok now what. well we need to build our RPC interface
	self.postAPI = function(msg, response){
		if(msg.type == 'attribute'){
			var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
			if(obj) obj[msg.attribute] = msg.value
			response.send({type:'return',value:'OK'})
		}
		else if(msg.type == 'method'){
			var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
			if(obj) RpcProxy.handleCall(obj, msg, response)
		}
		else response.send({type:'error', value:'please set type to rpcAttribute or rpcCall'})
	}

	self.atConstructor = function(modules, bus){
		this.bus = bus
		this.session = '' + Math.random() * 10000000
		var renderer = new Renderer()

		define.$rendermode = 'headless'

		// lets spawn up all modules!
		for(var i = 0; i < modules.length; i++){
			// lets instance all modules
			var module = modules[i]
			try{
				// lets store the modules
				var render = require(module.path)
				// lets call our constructor with our lisp arguments
				obj = this[module.name] = render()
				// lets initialize propertybindings
				// bus bind our attributes
				obj.emit('init')
				RpcProxy.bindSetAttribute(obj, module.name, bus)
			}
			catch(e){
				console.error(e.stack + '\x0E')
				return
			}
		}
		// initialize serverside property binding
		for(var i = 0; i < modules.length; i++){
			var module = modules[i]
			//renderer.propertyBind(this[module.name], {this:this})
		}
		
		bus.broadcast({type:'sessionCheck', session:this.session})

		bus.atConnect = function(socket){
			socket.send({type:'sessionCheck', session:this.session})
		}.bind(this)

		bus.atMessage = function(msg, socket){
			// we will get messages from the clients
			if(msg.type == 'connectBrowser'){

				// lets process the entire this object for RPC interfaces
				var rpcdefs = RpcProxy.createRpcDefs(this, Node)
				// ok so lets op a webrtc components
				//console.log(rpcdefs)
				if(this.screens){
					var screen_name = socket.url.split('/')[2] || 'browser'
					// instance a screen rpc interface
					var rpcid = 'screens.' + screen_name
					var multi = this.screens[screen_name]
					var index = multi.length++
					multi.createIndex(index, rpcid, socket.rpcpromise)
					socket.send({type:'connectBrowserOK', rpcdef: rpcdefs, index:index})
					socket.rpcpromise = new RpcPromise(socket)
					this.bus.broadcast({
						index: index,
						type: 'join',
						rpcid: rpcid
					})
				}
			}
			else if(msg.type == 'attribute'){
				// ok so if we get a setattribute, what we need is to forward it to all clients, not us
				bus.broadcast(msg, socket)
				var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
				if(obj) obj[msg.attribute] = msg.value
			}
			else if(msg.type == 'method'){
				var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
				if(obj) RpcProxy.handleCall(obj, msg, socket)
			}
			else if(msg.type == 'return'){
				// we got an rpc return
				socket.rpcpromise.resolveResult(msg)
			}
			else if(msg.type == 'webrtcOffer'){ bus.broadcast(msg) }
			else if(msg.type == 'webrtcAnswer'){ bus.broadcast(msg) }
			else if(msg.type == 'webrtcOfferCandidate'){ bus.broadcast(msg) }
			else if(msg.type == 'webrtcAnswerCandidate'){ bus.broadcast(msg) }
		}.bind(this)
	}
})