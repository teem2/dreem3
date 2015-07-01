// Copyright 2015 Teem2 LLC, MIT License (see LICENSE)

define.class(function(require, exports, self){
	
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

	self.setup = function(device, viewportwidth, viewportheight){
		this.device = device;
		this.clipStack = [];
		this.device.gl.enable(this.device.gl.SCISSOR_TEST);
		if (viewportwidth === undefined) viewportwidth = device.size[0];
		if (viewportheight === undefined) viewportheight = device.size[1];
		
		this.uimode = true;
		this.matrix = mat4.ortho(0, device.size[0], 0, device.size[1], -100, 100);
		this.device.gl.scissor(0,0, viewportwidth * device.ratio, viewportheight * device.ratio);
		this.device.gl.viewport(0, 0, device.size[0] * device.ratio, device.size[1] * device.ratio)
		this.boundingrect = rect(0,0, device.size[0], device.size[1]);
	}
})