define.browser(function(require, view){
	this.render = function(){return(
		view({x:0, y:0, w:300, h:300, 'bg.bgcolorfn':function(pos, tex){
			return mix('red','green',mesh.x)
		}})
	)}
})