$(window).load(function() {	

	//waiting for a button press is much more browser-friendly 
	//than drawing everything immediately
	$('#plumb-draw-button').click(function() {

		//hide the button, unhide the state divs then scroll the page down
		//in order to better see the graph
		//
		//this is all necessary to allow jsPlumb enough time to draw
		//everything correctly
		$('.plumb-state').css('display', 'inherit');
		$('#plumb-button-container').css('display', 'none');

		$('html, body').animate({
	        scrollTop: $("#menu-container").offset().top
	    }, 200);

		//jsPlumb defaults;
		jsPlumb.Defaults.Container = "plumb-canvas";

		var states= $('#plumb-canvas > .plumb-state');
		var transitions = $('#plumb-container > .plumb-transition');
		var paths = $('#plumb-container > .plumb-path');

		distribute(states);

				//makes the state boxes movable
		$(states).each(function() {
			jsPlumb.draggable($(this).attr('id'), {
				containment: '#plumb-canvas',
			});
		});

		$(paths).each(function() {

			var start_id = $(this).find('div.plumb-path-start').text();
			var end_id = $(this).find('div.plumb-path-end').text();

			var e0 = 'plumb-state-' + start_id;
			var e1 = 'plumb-state-' + end_id;

			var path_label = $(this).find('.plumb-path-transition').text();

			jsPlumb.connect({ 
				source:e0,
				target:e1,
				connector:"StateMachine",
				overlays:[
				["Arrow", {location:1, width:10}],
				[ "Label", { label:path_label, location:0.2, cssClass:"plumb-label"} ]
				],
				anchor: "Continuous",
				endpoint: "Blank",
				paintStyle:{ strokeStyle:"black", lineWidth:1 },

			});
		})

	});
	//Crude function to randomly distribute the divs around the canvas
	function distribute(divs)
	{
		$(divs).each(function() {
			var css_left = Math.ceil(Math.random() * ($('#content').width() - $(this).width()));
			var css_top = Math.ceil(Math.random() * $('#plumb-canvas').height());

			$(this).css('top', css_top);
			$(this).css('left', css_left);
		});
	}
});