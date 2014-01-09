$(window).load(function() {	

	$('#plumb-draw-button').live('click', function() {

		//hide the button, unhide the state divs then scroll the page down
		//in order to better see the graph
		//
		//Requiring a button press to generate the graph
		//is all necessary to allow jsPlumb enough time to draw
		//everything correctly. 
		//Doing so on page load is too resource intensive.
		$('.plumb-state').css('display', 'inherit');
		$('#plumb-button-container').css('display', 'none');

		scrollToElement('#menu-container');

		//jsPlumb defaults;
		jsPlumb.Defaults.Container = "plumb-canvas";

		var states = getStateDivs();
		var paths = $('#plumb-container > .plumb-path');

		makeDraggable(states);

		distribute(states);

		buildConnections(paths);

		setViewMode(states);

		$('#plumb-toolbox').show();
	});

	$('#plumb-mode-button').live('click', function() {

		var states = $('#plumb-canvas > .plumb-state');

		if($(this).hasClass('view')){

			setDesignMode(states);
		}else if($(this).hasClass('design')){

			setViewMode(states);
		}
	})

	$('#tabs-menu a[id^="fieldsetlegend-"]').live('click', function() {

		//Set the page to view mode if
		//the user clicks one of the "fieldsetlegend" tabs.
		if( $('.plumb-state').css('display') != 'none' )
		{
			setViewMode(getStateDivs());
		}
	})

	$('.plumb-state').live('click', function() {

		expandState($(this));
	});

	var options = {
		beforeSerialize: setLayout,
		success: function() {
			alert("Layout saved successfully.");
			setViewMode(getStateDivs());
		}
	};

	$('#plumb-layout-form').ajaxForm(options);

	function expandTransition(element)
	{
		//Disabling the functionality in design mode.
		if($('#plumb-mode-button').hasClass('design'))
		{
			return true;
		}

		//if the transition is already open, then close it
		//and exit.
		if( $(element).hasClass('expanded')) 
		{
			$(element).removeClass('expanded');
			$(element).find('div, a').remove();
			return true;
		}

		var id = $(element).text();

		var url = document.URL + "&selected-transition=" + id;

		//the ID of the element in WFM containing 
		//all the info needed in this context
		var name = 'transition-' + id;
		id = '#transition-' + id;

		var props = $(id).find('.transition-properties');

		var transitionTitle = props.find('input[name="' + name + '-title"]').val();
		var description = props.find('textarea[name="' + name + '-description"]').val();

		$(element).addClass('expanded');
		$(element).append('<div>' + transitionTitle + '</div>');
		$(element).append('<div>' + description + '</div>');
		$(element).append('<a class="goto-link" href="' + url + '"">Edit</a>');
	}

	function expandState(element)
	{

		//Disabling the functionality in design mode.
		if($('#plumb-mode-button').hasClass('design'))
		{
			return true;
		} 

		//If the element is already expanded, close it
		//and exit.
		if($(element).hasClass('expanded'))
		{
			$(element).children().hide();
			$(element).find('.plumb-state-id').show();
			$(element).removeClass('expanded');
			return true;
		}

		$(element).find('.plumb-state-id').hide();
		$(element).children().show();
		$(element).addClass('expanded');
	}

	function setLayout()
	{
		$('#plumb-workflow').attr('value', $('#selected-workflow').attr('value'));
		var states = $('.plumb-state-id');
		message = {};

		states.each(function() {
			message[$(this).text()] = $(this).parent().position();
		});

		var output = JSON.stringify(message);
		$('#plumb-layout-container').text(output);
	}

	function distribute(divs)
	{
		//this function simply places the divs randomly onto the canvas
		//unless the layout has been saved, then it recreates the saved layout
		var layout = $('#plumb-layout-container').attr('value');
		

		if( layout.length > 0 )
		{
			layout = JSON.parse(layout);
		}
		else
		{
			layout = {};
		}

		$(divs).each(function() {
			if( layout[$(this).find('.plumb-state-id').text()] ) 
			{
				var top = layout[$(this).find('.plumb-state-id').text()].top;
				var left = layout[$(this).find('.plumb-state-id').text()].left;

				$(this).css('top', top);
				$(this).css('left', left);
			}
			else
			{
				var css_left = Math.ceil(Math.random() * ($('#content').width() - $(this).outerWidth(true)));
				var css_top = Math.ceil(Math.random() * ($('#plumb-canvas').height() - $(this).outerHeight(true)));

				$(this).css('top', css_top);
				$(this).css('left', css_left);
			}
		});
	}

	function getStateDivs()
	{

		return $('#plumb-canvas .plumb-state');
	}

	function setDesignMode(states)
	{
		var element = $('#plumb-mode-button');
		//the class on the button is what mode we're in now
		//the value is the class we would switch to by pressing the button
		element.removeClass('view').addClass('design');
		element.removeClass('btn-inverse').addClass('btn');
		element.prop('value', 'Switch to view mode');

		//lock page scrolling and move down to the
		//graph canvas
		scrollToElement('#menu-container');
		lockScrolling();
	    enableDragging(states);
	}

	function setViewMode(states)
	{
		var element = $('#plumb-mode-button');
		element.removeClass('design').addClass('view');
		element.removeClass('btn').addClass('btn-inverse');
		element.prop('value', 'Switch to design mode');

		unlockScrolling();
		disableDragging(states);
	}

	function scrollToElement(element)
	{
		$('html, body').animate({
		        scrollTop: $(element).offset().top
		}, 200);
	}

	function unlockScrolling()
	{
		$('html, body').css('width', 'inherit');	
		$('html, body').css('overflow', 'auto');
	}

	function lockScrolling()
	{
		//This isn't as pointless as it seems.
		//By setting the width explicitly, it prevents 
		//the body width from changing when the overflow is changed.
		$('html, body').css('width', $('html, body').css('width'));
		$('html, body').css('overflow', 'hidden');
	}

	function disableDragging(states)
	{
		//this will work with either a single element
		//or an array of them
		$(states).each(function() {
			jsPlumb.setDraggable($(this), false);
		});
	}

	function enableDragging(states)
	{
		$(states).each(function() {
			jsPlumb.setDraggable($(this), true);
		});
	}

	function makeDraggable(states)
	{
		//this function is needed to set the 
		//options since you can't pass them to the
		// toggle/disable functions
		$(states).each(function() {
			jsPlumb.draggable($(this), {
				containment: '#plumb-canvas',
				scroll: false
			});
		});
	}

	function buildConnections(paths)
	{
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
				hoverPaintStyle:{ strokeStyle:"gold" },
				overlays:[
				["Arrow", {location:1, width:10}],
				["Label", { 
					label:path_label, 
					location:0.2, 
					cssClass:"plumb-label",
					events:{
						//Defining the event here is the only effective way, 
						//since jsPlumb makes it difficult/impossible to add a listener
						//outside the connection definition
          				click:function(labelOverlay, originalEvent) { 
            				expandTransition(originalEvent.currentTarget);
          				}
        			}
        		}]
				],
				anchor: "Continuous",
				endpoint: "Blank",
				paintStyle:{ strokeStyle:"black", lineWidth:1 },
			});
		});
	}
});

