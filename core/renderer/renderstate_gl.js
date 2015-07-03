// Copyright 2015 Teem2 LLC, MIT License (see LICENSE)

define.class(function(require, exports, self){
	
	var GLTexture = require('$gl/gltexture')
	var GLShader = require('$gl/glshader')

	self.quadshader = new GLShader();
	self.quadshader.frame_texture = new GLTexture(); 
	self.quadshader.width = 1024;
	self.quadshader.height = 1024;
	
	self.quadshader.color = function(){		
				return frame_texture.sample(vec2(gl_FragCoord.x/width, gl_FragCoord.y/height));
	};
	
	self.quadshader.position = function(){return vec4(mesh.x, mesh.y, 0., 1.0);};
	self.quadshader.mesh = vec2.quad(-1, -1, 1, -1, -1, 1, 1, 1)
		
	self.pushClip = function( sprite){
		
		var previousdepth = this.clipStack.length;
		this.clipStack.push(sprite.boundingrect);		
		var gl = this.device.gl;
		
		gl.enable(gl.STENCIL_TEST);				
		gl.colorMask(true, true,true,true);
		gl.stencilFunc(gl.EQUAL, previousdepth, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
	}
	
	self.translate = function(x,y){
		var m2 = mat4.T(x,y,0);
	//	this.matrix = mat4.mul(this.matrix, m2);
		this.matrix = mat4.mul(m2, this.matrix);
	}
	
	self.stopClipSetup = function(sprite){
		var gl = this.device.gl;
		var depth = this.clipStack.length

	//	gl.colorMask(true,true,true,true);
		gl.stencilFunc(gl.EQUAL, depth, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);	
	}
	
	self.popClip = function( sprite) {
		
		this.clipStack.pop();
		var previousdepth = this.clipStack.length;
		var gl = this.device.gl;
		
		//gl.enable(GL_STENCIL_TEST);		// should still be enabled!
		gl.colorMask(gl.FALSE, gl.FALSE, gl.FALSE, gl.FALSE);
		gl.stencilFunc(gl.EQUAL, previousdepth + 1, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);

		// this erases the current sprite from the stencilmap
		sprite.drawStencil(this);
		
		gl.colorMask(true,true,true,true);
		gl.stencilFunc(gl.EQUAL, previousdepth - 1, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);			
	}
	
	self.swapToNewTarget = function(shader)
	{
		this.targetswaps++;
		var frametex = this.activetexture;
		this.activetexture = (this.activetexture + 1) % 2;
		
	//	this.device.gl.bindFramebuffer(this.device.gl.FRAMEBUFFER, this.framebuf.frame_buf)
	//	this.device.gl.framebufferTexture2D(this.device.gl.FRAMEBUFFER, this.device.gl.COLOR_ATTACHMENT0, this.device.gl.TEXTURE_2D, this.bouncesamples[this.activetexture], 0)

		this.quadshader.width = this.device.size[0];
		this.quadshader.height = this.device.size[1];
		
		this.quadshader.frame_texture = this.bouncetextures[frametex]; 
		this.quadshader.draw();
		
		shader.frame_texture = this.bouncetextures[frametex];
		
	}
	
	self.bouncetextures = []
	self.bouncesamples = []
	self.activetexture = 0;
	self.targetswaps = 0;
	
	self.configure = function(device,viewportwidth, viewportheight)
	{
		this.framebuf = GLTexture.rgba_depth_stencil(viewportwidth, viewportheight)
		this.bouncetextures.push(GLTexture.fromArray(new Float32Array(viewportwidth*viewportheight*4), viewportwidth, viewportheight))
		this.bouncetextures.push(GLTexture.fromArray(new Float32Array(viewportwidth*viewportheight*4), viewportwidth, viewportheight))
		
		inf = {samplerdef: {MIN_FILTER: 'LINEAR',
			MAG_FILTER: 'LINEAR',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'}}
		
		this.bouncesamples.push(this.bouncetextures[0].createGLTexture(device.gl,0, inf));
		this.bouncesamples.push(this.bouncetextures[1].createGLTexture(device.gl,1, inf));
		
		console.log(this.bouncetextures);
		console.log(this.bouncesamples);
		console.log(this.framebuf);
		
		this.framebuf.allocRenderTarget(device);
			
		console.log("created render targets for bounce: ", viewportwidth, viewportheight);
	}
	
	self.setup = function(device, viewportwidth, viewportheight){
		this.device = device;
		this.clipStack = [];
		this.activetexture = 0;
		this.targetswaps = 0;
		this.device.gl.enable(this.device.gl.SCISSOR_TEST);
		if (viewportwidth === undefined) viewportwidth = device.size[0];
		if (viewportheight === undefined) viewportheight = device.size[1];
		
		this.uimode = true;
		this.matrix = mat4.ortho(0, device.size[0], 0, device.size[1], -100, 100);
		this.device.gl.scissor(0,0, viewportwidth * device.ratio, viewportheight * device.ratio);
		this.device.gl.viewport(0, 0, device.size[0] * device.ratio, device.size[1] * device.ratio)
		this.boundingrect = rect(0,0, device.size[0], device.size[1]);
		
		//this.device.gl.bindFramebuffer(this.device.gl.FRAMEBUFFER, this.framebuf.frame_buf)
		//this.device.gl.framebufferTexture2D(this.device.gl.FRAMEBUFFER, this.device.gl.COLOR_ATTACHMENT0, this.device.gl.TEXTURE_2D, this.bouncesamples[this.activetexture], 0)

		//shader.frame_texture = this.bouncetextures[frametex];
	}
	
	self.finish = function(device)
	{
		device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);		
		this.quadshader.width = device.size[0];
		this.quadshader.height = device.size[1];
		this.quadshader.frame_texture = this.bouncetextures[this.activetexture]; 
		this.quadshader.draw();
	}
})
