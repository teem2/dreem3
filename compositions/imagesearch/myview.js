define.browser(function(require, view){
	this.render = function(){return(
		view({x:0, y:0, w:100, h:100, 'bg.color':'mix("ma","mi",mesh.y)'})
	)}
})