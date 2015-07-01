define.browser(function(screen, view){

	this.render = function(){return(
		view("hello", {y:20},
			function init(){
				console.log('view initialized!')
			},
			view("test", {x:10, y:20})
		)
	)}

})