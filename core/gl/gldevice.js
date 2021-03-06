// Copyright 2015 Teem2 LLC, MIT License (see LICENSE)

define.class(function(require, exports, self){

	var Shader = require('$gl/glshader')
	var Texture = require('$gl/gltexture')

	self.frame = 
	self.main_frame = Texture.rgb_depth_stencil()
	
	
	self.atConstructor = function(){
		this.extensions = {}
		this.shadercache = {}
		
		this.animFrame = function(time){
			this.anim_req = false
			Shader.prototype.device = this
			Texture.prototype.device = this
			this.atRedraw(time)
			Shader.prototype.device = null
			Texture.prototype.device = null
		}.bind(this)
	
		if(!this.parent) this.parent = document.body

		this.canvas = document.createElement("canvas")
		this.parent.appendChild(this.canvas)
		
		var options = {
			alpha: this.frame.type.indexOf('rgba') != -1,
			depth: this.frame.type.indexOf('depth') != -1,
			stencil: this.frame.type.indexOf('stencil') != -1,
			antialias: this.antialias,
			premultipliedAlpha: this.premultipliedAlpha,
			preserveDrawingBuffer: this.preserveDrawingBuffer,
			preferLowPowerToHighPerformance: this.preferLowPowerToHighPerformance
		}

		this.gl = this.canvas.getContext('webgl', options) || 
			this.canvas.getContext('webgl-experimental')

		// require derivatives
		this.getExtension('OES_standard_derivatives')

		//canvas.webkitRequestFullscreen()
		var resize = function(){
			var pixelRatio = window.devicePixelRatio
			var w = this.parent.offsetWidth
			var h = this.parent.offsetHeight
			var sw = w * pixelRatio
			var sh = h * pixelRatio
			this.gl.width = this.canvas.width = sw
			this.gl.height = this.canvas.height = sh
			this.canvas.style.width = w + 'px'
			this.canvas.style.height = h + 'px'
			this.gl.viewport(0, 0, sw, sh)
			// store our w/h and pixelratio on our frame
			this.main_frame.ratio = this.ratio || pixelRatio
			this.main_frame.size = vec2(sw, sh) // actual size
			this.size = vec2(w, h)
			this.ratio = this.main_frame.ratio
		}.bind(this)

		window.onresize = function(){
			resize()
			this.atResize()
			this.redraw()
		}.bind(this)

		resize()

		setTimeout(function(){
			this.redraw()
		}.bind(this),0)
	}

	self.clear = function(r, g, b, a){
		if(arguments.length === 1){
			a = r.length === 4? r[3]: 1, b = r[2], g = r[1], r = r[0]
		}
		if(arguments.length === 3) a = 1
		this.gl.clearColor(r, g, b, a)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT|this.gl.STENCIL_BUFFER_BIT)
	}

	self.atRedraw = function(time){}
	self.atResize = function(callback){}

	self.getExtension = function(name){
		var ext = this.extensions[name]
		if(ext) return ext
		return this.extensions[name] = this.gl.getExtension(name)
	}

	self.redraw = function(){
		if(this.anim_req) return
		this.anim_req = true
		window.requestAnimationFrame(this.animFrame)
	}

	self.setTargetFrame = function(frame){
		if(!frame) frame = this.main_frame
		this.frame = frame
		this.size = vec2(frame.size[0]/frame.ratio, frame.size[1]/frame.ratio)

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frame.frame_buf)
		this.gl.viewport(0, 0, frame.size[0], frame.size[1])
	}
})