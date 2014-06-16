
var WorkflowGraph = function WorkflowGraph() {
	this.constructor;
	this.init();
	props = this.props;
	t = this;
}

WorkflowGraph.prototype = {	

	props: {
		//To help refactor this horrible naming scheme eventually...
		graphSaveButtonId:  '#plumb-graph-save',
		drawButtonId:  		'#plumb-draw-button',
		modeButtonId:  		'#plumb-mode-button',
		transButtonId:  	'#plumb-add-transition-button',
		toolboxId:  		'#plumb-toolbox',
		stateIdClass:  		'.plumb-state-id',
		stateClass:  		'.plumb-state',
		canvasId:  			'#plumb-canvas',
		workflowId:  		'#plumb-workflow',
		layoutContainerId:  '#plumb-layout-container',
		layoutFormId: 		'#plumb-layout-form', 
		containerId:  		'#plumb-container',
		labelClass:  		'.plumb-label',
		helpMessageId: 		'#plumb-help-message',
		formHolder:  		'#plumb-form-holder',
		formOverlay:  		'#plumb-overlay',
		zoomBox: 			'#plumb-zoom-box',

		transDescClass:  	'.transition-description',
		transTitleClass:  	'.transition-title',
		transIdClass: 		'.transition-id',
		transLinkClass:  	'.transition-link',

		pathClass:  		'.plumb-path',
		pathStartClass:  	'.plumb-path-start',
		pathEndClass:  		'.plumb-path-end',
		pathTransitionClass: 
							'.plumb-path-transition',
	},

	init: function() {
		props = this.props;
		t = this;

		$(props.modeButtonId).live('click', function() {

			var states = $(props.canvasId + ' ' + props.stateClass);

			if($(this).hasClass('view')){

				t.setDesignMode(states);
			}else if($(this).hasClass('design')){

				t.setViewMode(states);
			}
		});

		$(props.transButtonId).live('click', function(e) {

			t.addEndpoints();
		})

		$(props.stateClass).live('click', function(e) {

			//Detects if the event was triggered by the state select list
			if( typeof(e['originalEvent']) == 'undefined' )
			{
				return true;
			}

			t.expandState($(this));
		});

		$(props.stateIdClass).hover(function() {

			$(this).addClass('highlight');
		},
		function() {
			$(this).removeClass('highlight');
		});

		$(props.graphSaveButtonId).live('click', function() {

			var options = {
				beforeSerialize: t.setLayout(),
				success: function() {
					alert("Layout saved successfully.");
					t.setViewMode(t.getStateDivs());
				},
				error: function(xhr) {
					alert("There was a problem saving the layout.");
					console.log(xhr);
				}
			};

			$(props.layoutFormId).ajaxSubmit(options);
		})

	},

	addEndpoints: function()
	{
		var dropOptions = {
			anchor: "Continuous",
			isSource: true,
			connector: "StateMachine",
			scope: "newTransitions",
		};

		var stateBoxes = $(props.stateClass);

		stateBoxes.each(function() {
			jsPlumb.addEndpoint($(this), dropOptions);
		});

		jsPlumb.makeTarget(stateBoxes, {
			scope: "newTransitions",
			hoverClass: "highlight",
			anchor: "Continuous",
		});

		jsPlumb.repaintEverything();

		jsPlumb.bind("connection", function(info, dropOptions) {

			var source = info['sourceId'];
			var target = info['targetId'];

			var pts = jsPlumb.selectEndpoints({scope:"newTransitions"});
			var endPts = pts.getParameter();

			$(endPts).each(function() {
				if( !( this[1].elementId == source || this[1].elementId == target ) )
				{
					this[1].detach();
				}
			})
			t.addConnection(info);
		});
	},

	addConnection: function(info)
	{
		var source = info['sourceId'];
		var target = info['targetId'];

		var paths = $(props.pathClass);

		paths.each(function() {
			var start = 'plumb-state-' + $(this).find(props.pathStartClass).text();
			var end = 'plumb-state-' + $(this).find(props.pathEndClass).text();

			if( end == target && start == source )
			{
			}
		});
	},

	buildConnections: function(paths)
	{
		//Position variable that is incremented with each 
		//added connection. Doing this helps spread out the overlays a bit.
		//It's still not perfect, but it's better than having an arbitrary value.
		var position = 2;
		$(paths).each(function() {

			if( position == 8 )
			{
				position = 2
			}

			var start_id = $(this).find('div' + props.pathStartClass).text();
			var end_id = $(this).find('div' + props.pathEndClass).text();

			var e0 = 'plumb-state-' + start_id;
			var e1 = 'plumb-state-' + end_id;

			var path_label = $(this).find(props.pathTransitionClass).text();

			jsPlumb.connect({ 
				source:e0,
				target:e1,
				connector:"StateMachine",
				hoverPaintStyle:{ strokeStyle:"gold" },
				overlays:[
				["Arrow", {location:1, width:15}],
				["Label", { 
					label:path_label, 
					location: (position / 10), 
					cssClass:"plumb-label",
					events:{
						//Defining the event here is the only effective way, 
						//since jsPlumb makes it difficult/impossible to add a listener
						//outside the connection definition
          				click:function(labelOverlay, originalEvent) { 
            				t.expandTransition(originalEvent.currentTarget);
          				}
        			}
        		}]
				],
				anchor: "Continuous",
				endpoint: "Blank",
				paintStyle:{ strokeStyle:"black", lineWidth:1.5 },
			});

			position += 1;
		});
	},

	buildGraph: function()
	{

		//if the connectors exist, 
		//the graph is already complete.
		if( $('._jsPlumb_connector').length > 0 )
		{
			return true;
		}

		if( $(props.canvasId).length <= 0 )
		{
			return true;
		}

		$(props.stateClass).css('display', 'inherit');

		//If we're redrawing on the same page, it helps to clean everything out first
		jsPlumb.reset();

		jsPlumb.Defaults.Container = "plumb-zoom-box";

		var states = t.getStateDivs();
		var paths = $(props.containerId + ' > ' + props.pathClass);

		t.distribute(states);

		$(props.toolboxId).show();

		t.makeDraggable(states);

		t.buildConnections(paths);

		t.wrapOverlays();

		t.setViewMode(states);
	},

	collapseAllItems: function() {
		var open = $(props.canvasId + " > div.expanded");

		$(open).each(function() {
			if( $(this).hasClass(props.stateClass) )
			{
				t.expandState($(this));
			}
			else
			{
				t.expandTransition($(this));
			}
		})
	},

	disableDragging: function(states)
	{
		//this will work with either a single element
		//or an array of them
		$(states).each(function() {
			jsPlumb.setDraggable($(this), false);
		});
	},

	distribute: function(divs)
	{
		//this function simply places the divs randomly onto the canvas
		//unless the layout has been saved, then it recreates the saved layout
		var layout = $(props.layoutContainerId).attr('value');

		if( layout.length > 0 )
		{
			layout = JSON.parse(layout);
		}
		else
		{
			layout = {};
		}

		var layoutExists = false;

		var height = $(props.zoomBox).height();
		var width = $(props.zoomBox).width();

		$(divs).each(function() {
			if( layout[$(this).find(props.stateIdClass).text()] ) 
			{
				var top = (layout[$(this).find(props.stateIdClass).text()].top) * height;
				var left = (layout[$(this).find(props.stateIdClass).text()].left) * width;

				$(this).css('top', top);
				$(this).css('left', left);
				layoutExists = true;
			}
			else
			{
				var css_left = Math.ceil(Math.random() * ($('#content').width() - $(this).outerWidth(true)));
				var css_top = Math.ceil(Math.random() * ($(props.canvasId).height() - $(this).outerHeight(true)));

				$(this).css('top', css_top);
				$(this).css('left', css_left);
			}
		});

		if( layoutExists == false )
		{
			$(props.helpMessageId).dialog({
				modal: true,
			});
		}
	},

	enableDragging: function(states)
	{
		$(states).each(function() {
			jsPlumb.setDraggable($(this), true);
		});
	},

	expandState: function(element)
	{

		//Disabling the functionality in design mode.
		if($(props.modeButtonId).hasClass('design'))
		{
			return true;
		}

		//If the element is already expanded, close it
		//and exit.
		if($(element).hasClass('expanded'))
		{
			$(element).children().hide();
			$(element).find(props.stateIdClass).show();
			$(element).removeClass('expanded');
			return true;
		}

		var state =  $(element).find(props.stateIdClass).text();

		$(element).children(':not(fieldset)').show();
		$(element).find(props.stateIdClass).hide();
		$(element).addClass('expanded');
	},

	expandTransition: function(element)
	{
		//Disabling the functionality in design mode.
		if($(props.modeButtonId).hasClass('design'))
		{
			return true;
		}

		//if the transition is already open, then close it
		//and exit.
		if( $(element).hasClass('expanded')) 
		{
			$(element).removeClass('expanded');
			$(element).find('a, div').remove();
			$(element).find('span').show();
			return true;
		}

		var id = $(element).find('span').text();

		id = '#plumb-transition-' + id;

		var transitionTitle = $(id).find(props.transTitleClass).text();
		var description = $(id).find(props.transDescClass).text();

		$(element).addClass('expanded');
		$(element).find('span').hide();
		$(element).append('<div class="plumb-title">' + transitionTitle + '</div>');
		$(element).append('<div>' + description + '</div>');

		var anchor = $(id).find(props.transLinkClass).clone();
		$(anchor).overlay(overlay_settings);
		$(element).append(anchor);
	},

	getStateDivs: function()
	{

		return $(props.canvasId + ' ' + props.stateClass);
	},

	lockScrolling: function()
	{
		//This isn't as pointless as it seems.
		//By setting the width explicitly, it prevents 
		//the body width from changing when the overflow is changed.
		$('html, body').css('width', $('html, body').css('width'));
		$('html, body').css('overflow', 'hidden');
	},

	makeDraggable: function(states)
	{
		//this function is needed to set the 
		//options since you can't pass them to the
		// toggle/disable functions
		$(states).each(function() {
			jsPlumb.draggable($(this), {
				containment: props.canvasId,
				scroll: false
			});
		});
	},

	scrollToElement: function(element)
	{
		$('html, body').animate({
		        scrollTop: $(element).offset().top
		}, 200);
	},

	setDesignMode: function(states)
	{
		var element = $(props.modeButtonId);
		//the class on the button is what mode we're in now
		//the value is the class we would switch to by pressing the button
		element.removeClass('view').addClass('design');
		element.removeClass('btn-inverse').addClass('btn');
		element.prop('value', 'Switch to view mode');

		t.slayDragon()

		//lock page scrolling and move down to the
		//graph canvas
		t.scrollToElement('#menu-container');
		t.lockScrolling();
	    t.enableDragging(states);
	},

	setLayout: function()
	{
		$(props.workflowId).attr('value', $('#selected-workflow').attr('value'));
		var states = $(props.stateIdClass);
		message = {};

		var height = $(props.zoomBox).height();
		var width = $(props.zoomBox).width();

		var box_offset = $(props.zoomBox).position()

		var getRelativeOffset = function(position)
		{
			// The - box_offset[] part accounts for when the user has dragged the
			// zoom-box down/right. When this happens, the boxes relative position
			// (returned by .position()) becomes negative, compared to the drawing canvas.
			// This would cause states to be rendered outside of the box, and out of the reach of 
			// the user
			var left = position['left'] - box_offset['left'];
			var top = position['top'] - box_offset['top'];

			var offset = {
				'left': (left/width),
				'top': (top/height)
			};

			return offset;

		}

		states.each(function() {
			message[$(this).text()] = getRelativeOffset($(this).parent().position());
		});

		var output = JSON.stringify(message);
		$(props.layoutContainerId).text(output);
	},

	setupDragon: function()
	{
		$(props.canvasId).addClass('dragon');
		$(props.canvasId).dragOn();
	},

	setViewMode: function(states)
	{
		var element = $(props.modeButtonId);
		element.removeClass('design').addClass('view');
		element.removeClass('btn').addClass('btn-inverse');
		element.prop('value', 'Switch to design mode');

		t.setupDragon()

		t.unlockScrolling();
		t.disableDragging(states);
	},

	slayDragon: function()
	{

		$(props.canvasId).trigger('DragOn.remove');
	},

	unlockScrolling: function()
	{
		$('html, body').css('width', 'inherit');	
		$('html, body').css('overflow', 'auto');
	},

	wrapOverlays: function()
	{

		var overlays = $(props.labelClass);

		overlays.each(function() {

			var text = $(this).text();
			$(this).empty();

			$(this).append('<span>' + text + '</span>');
		})
	},
};
