jsPlumb.ready(function() {	
	alert('success');
	var e0 = jsPlumb.addEndpoint("node0"),
	e1 = jsPlumb.addEndpoint("node1");
	jsPlumb.connect({ source:e0, target:e1 });
});