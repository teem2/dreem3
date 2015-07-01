// Copyright 2015 this2 LLC, MIT License (see LICENSE)
// this class

define.class('$dreem/teem_base', function(require, exports, self, Base){

	var Node = require('$base/node')
	var RpcProxy = require('$rpc/rpcproxy')
	var RpcMulti = require('$rpc/rpcmulti')
	var RpcPromise = require('$rpc/rpcpromise')
	var WebRTC = require('$rpc/webrtc')
	var Renderer = require('$renderer/renderer')

	self.atConstructor = function(screen_factory){

		Base.prototype.atConstructor.call(this)

		// web environment
		var BusClient = require('$rpc/busclient')
		var Mouse = require('$renderer/mouse_$rendermode')

		this.bus = new BusClient(location.pathname)
		this.renderer = new Renderer()

		var rpcpromise = new RpcPromise(this.bus)
		// lets put this on window just as  adebuggint tool
		window.this = this

		this.bus.atMessage = function(msg){
			if(msg.type == 'sessionCheck'){
				if(this.session) location.href = location.href
				if(this.session != msg.session){
					this.bus.send({type:'connectBrowser'})
				}
			}
			else if(msg.type == 'webrtcOffer'){
				if(msg.index != this.index){ // we got a webrtcOffer
					this.webrtc_answer = WebRTC.acceptOffer(msg.offer)
					this.webrtc_answer.onIceCandidate = function(candidate){
						//console.log('sending answer candidate')
						this.bus.send({type:'webrtcAnswerCandidate', candidate:candidate, index: this.index})
					}
					this.webrtc_answer.onAnswer = function(answer){
						//console.log('sending answer')
						this.bus.send({type:'webrtcAnswer', answer:answer, index: this.index})
					}
					this.webrtc_answer.atMessage = this.webrtc_offer.atMessage
				}
			}
			else if(msg.type == 'webrtcAnswer'){
				if(this.webrtc_offer && msg.index != this.index){
					//console.log('accepting answer')
					this.webrtc_offer.acceptAnswer(msg.answer)
				}
			}
			else if(msg.type == 'webrtcAnswerCandidate'){
				if(this.webrtc_offer && msg.index != this.index){
					//console.log('adding answer candidate')
					this.webrtc_offer.addCandidate(msg.candidate)
				}
			}
			else if(msg.type == 'webrtcOfferCandidate'){
				if(this.webrtc_answer && msg.index != this.index){
					//console.log('adding offer candidate')
					this.webrtc_answer.addCandidate(msg.candidate)
				}
			}
			else if(msg.type == 'connectBrowserOK'){
				RpcProxy.createFromDefs(msg.rpcdef, this, rpcpromise)

				this.webrtc_offer = WebRTC.createOffer()
				this.index = msg.index

				this.webrtc_offer.atIceCandidate = function(candidate){
					this.bus.send({type:'webrtcCandidate', candidate:candidate, index: this.index})
				}.bind(this)

				this.webrtc_offer.atOffer = function(offer){
					this.bus.send({type:'webrtcOffer', offer:offer, index: this.index})
				}.bind(this)

				var screen = screen_factory()

				// lets wire the screen set attribetus
				RpcProxy.bindSetAttribute(screen, 'screens.browser[0]', this.bus)

				screen.mouse = new Mouse()

				// recursive fire 'init' or spawn or whatnot
				this.renderer.render(screen, null, {teem:this, screen:screen}, function rerender(what){
					// ok lets re-render this thing
					// how do we do this?
					if(!what.initialized) what.initialized = true
					else{
						if(what.children) what.children.length = 0
						this.renderer.render(what, what.parent, {teem:this, screen:screen}, rerender.bind(this))

						var bindinits = []
						for(var i = 0; i < what.children.length; i++){
							var child = what.children[i]
							this.renderer.connectWires(child, bindinits)
							this.renderer.fireInit(child)
						}

						for(var i = 0; i<bindinits.length;i++){
							bindinits[i]()
						}
					}
					//if(what.children){
					//	what.children.length = 0
					//	what.children.push.apply(what.children,  what.render())
					//}

				}.bind(this))

				var wireinits = []
				this.renderer.connectWires(screen, wireinits)

				this.renderer.fireInit(screen)

				for(var i = 0; i<wireinits.length;i++){
					wireinits[i]()
				}

				//$$(this.renderer.dump(root_obj))

				if (false){
					console.log("root_obj >>>");
					console.dir(root_obj);
					console.log("<<< root_ obj");
				}
				
				/*
				var redrawing = 0
				var count = 0
				function redraw(){
					document.body.innerHTML = ''
					redrawing = false

					if(this.drawroot){
						renderer.destroy(this.drawroot)
					}
					
					var objroot = Node.createFromJSONML(root_jsonml)

					var drawroot = renderer.render(objroot, {}, {this:this}, function(count){
						if(!redrawing) window.requestAnimationFrame(redraw)
						redrawing = true
					}.bind(null, count++))
					renderer.spawn(drawroot, {dom_node:document.body})

					if(!this.drawroot) var init = true

					this.drawroot = drawroot
					this.objroot = objroot
					if(init) this.objroot.on_init.emit()
				}
				redraw()*/

			}
			else if(msg.type == 'join'){
				var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
				if(!obj) console.log('Cannot find '+msg.rpcid+' on join')
				else obj.createIndex(msg.index, msg.rpcid, rpcpromise)
			}
			else if(msg.type == 'attribute'){
				var obj = RpcProxy.decodeRpcID(this, msg.rpcid)
				if(obj) obj[msg.attribute] = msg.value
			}
			else if(msg.type == 'method'){
				// lets call our method on root.
				if(!this.root[msg.method]){
					return console.log('Rpc call received on nonexisting method ' + msg.method)
				}
				RpcProxy.handleCall(this.root, msg, this.bus)
			}
			else if (msg.type == 'return'){
				rpcpromise.resolveResult(msg)
			}
		}.bind(this)
	}
})