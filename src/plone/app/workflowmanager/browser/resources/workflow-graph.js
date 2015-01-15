
var WorkflowGraph = function WorkflowGraph() {
	this.constructor;
	this.init();
	props = this.props;
	t = this;
}

WorkflowGraph.prototype = {	

	props: {
		//To help refactor this horrible naming scheme eventually...
		graphSaveButtonId:  		'#plumb-graph-save',
		drawButtonId:  					'#plumb-draw-button',
		modeButtonId:  					'#plumb-mode',
		modeBoxId: 							'#plumb-mode-box',
		transButtonId:  				'#plumb-add-transition-button',
		toolboxId:  						'#plumb-toolbox',
		stateIdClass:  					'.plumb-state-id',
		stateClass:  						'.plumb-state',
		stateTitleClass: 				'.plumb-state-title',
		canvasId:  							'#plumb-canvas',
		workflowId:  						'#plumb-workflow',
		layoutContainerId:  		'#plumb-layout-container',
		layoutFormId: 					'#plumb-layout-form', 
		containerId:  					'#plumb-container',
		labelClass:  						'.plumb-label',
		formHolderId:  					'#plumb-form-holder',
		formOverlayId:  				'#plumb-overlay',
		zoomBoxId: 							'#plumb-zoom-box',
		stateSelectClass: 			'.state-select',
		transitionSelectClass: 	'.transition-select',

		transDescClass:  				'.transition-description',
		transTitleClass:  			'.transition-title',
		transIdClass: 					'.transition-id',
		transLinkClass:  				'.transition-link',

		pathClass:  						'.plumb-path',
		pathStartClass:  				'.plumb-path-start',
		pathEndClass:  					'.plumb-path-end',
		pathTransitionClass: 		'.plumb-path-transition',

		transEditLink: 					'.transition-edit-link',
		stateEditLink: 					'.state-edit-link',
		highlightTransitionId: 	'#plumb-transition-highlight',
		transitionHighlightClear:
							'#plumb-transition-highlight-clear',
		highlightStateId: 			'#plumb-state-highlight', 
		stateHighlightClear: 		'#plumb-state-highlight-clear',
		editStateid: 						'#plumb-state-edit',
		editTransitionId: 			'#plumb-transition-edit',
		editSelectedClass:  		'.edit-selected',
		reorderId: 							'#plumb-reorder'
	},

	init: function() 
	{
		/**********************************************************

		The init function is the catch-all for event-handlers and variables that need to be setup 
		before anything else can run. Consequently, most of these parts are unrelated, and will 
		be documented separately.

		Admittedly, some of these are pretty straight forward, but it never hurts to be thorough

		**********************************************************/

		props = this.props;
		t = this;

		//Array of connections that are in the graph.
		//Takes the form of:
		//		connections[start][end][transitionId] => jsPlumb.Connection
		//
		//Each object in the array points to an actualy object within jsPlumb.
		connections = {};

		instance = jsPlumb.getInstance()


		/**********************************************************

		This button switches between "view" and "design" modes.

		View mode:
				States cannot be moved. Clicking on them will bring up the edit options.

		Design mode:
				States can be dragged around. Click on them will not do anything. 
				Intended only for the purpose of re-arranging the states in the graph.

		*********************************************************/
		$(props.modeButtonId).live('click', function() {

			var states = $(props.canvasId + ' ' + props.stateClass);

			if($(this).hasClass('view')){

				$(props.modeBoxId).attr('checked', true);
				t.setDesignMode(states);

			}else if($(this).hasClass('design')){

				$(props.modeBoxId).attr('checked', false);
				t.setViewMode(states);
			}
		});


		/**********************************************************

		This handles the event where the user clicks on a state 
		box inside the graph.

		**********************************************************/
		$(props.stateClass).live('click', function(e) {

			//Detects if the event was triggered by the state select list
			if( typeof(e['originalEvent']) == 'undefined' )
			{
				return true;
			}

			t.expandState($(this));
		});


		/**********************************************************

		This applys a highlight effect when the user mouses over a state

		**********************************************************/
		$(props.stateIdClass).hover(function() {

			$(this).addClass('highlight');
		},
		function() {
			$(this).removeClass('highlight');
		});


		/**********************************************************

		This handles the event where the users clicks the button to 
		save the graph layout.

		**********************************************************/
		$(props.graphSaveButtonId).live('click', function() {

			var options = {
				beforeSerialize: t.setLayout(),
				success: function() {
					alert("Layout saved successfully.");
					t.setViewMode(t.getStateDivs());
				},
				error: function(xhr) {
					alert("There was a problem saving the layout.");
				}
			};

			$(props.layoutFormId).ajaxSubmit(options);
		});


		/**********************************************************

		This brings up the edit overlay for the object in question.

		This handles both states and transitions since they're so 
		similar in this regard.

		**********************************************************/
		$(props.editSelectedClass).live('click', function() {
		    var select = $(this).siblings('select');
		    var type = "";

		    var isTransition = $(select).hasClass(props.transitionSelectClass.replace('.', ''));


		    if( $(select).val() == "" )
		    {
		    	t.toolboxError(this);
		      return true;
		    }

		    if( isTransition )
		    {
		      type = "#plumb-transition-";
		    }
		    else
		    {
		      type = "#plumb-state-";
		    }
		    
		    //Find the actual state/transition element, then find the edit button
		    var item = $(this).siblings('select').val();
		    var edit = $(type + item).find('a.edit');

		    //We've already set everything to work with these links, why re-invent the wheel?
		    edit.click();
		});


		/**********************************************************

		This highlights the selected state when the user clicks the
		"find" button.

		**********************************************************/
		$(props.highlightStateId).live('click', function() {

			var state = $(props.stateSelectClass).val();

			if( state == "" )
			{
				t.toolboxError(this);
				return;
			}

			state = '#plumb-state-' + state;

			t.locate(state);
		});


		/**********************************************************

		This highlights every instance of the selected transition
		when the user clicks the "find" button.

		**********************************************************/
		$(props.highlightTransitionId).live('click', function() {
			var select = $(this).siblings('select').val();

			if( select == "" )
			{
				t.toolboxError(this);
				return;
			}

			t.highlightTransitions(select);
		});


		/**********************************************************

		Removes the highlight effect from all states.

		**********************************************************/
		$(props.stateHighlightClear).live('click', function() {

			t.locate("");
		});
			
		/**********************************************************

		Removes the highlight effect from all transitions

		**********************************************************/
		$(props.transitionHighlightClear).live('click', function() {
			
			t.highlightTransitions("");
		});


		/**********************************************************

		This brings up the edit overlay for the selected transition
		when the user clicks the edit button in the *toolbox*

		**********************************************************/
		$(props.transEditLink).live('click', function(e) {
			e.preventDefault();
			var el = e.currentTarget;

			var id = $(el).attr('data-transition-id');
			var transition = $('#plumb-transition-' + id);
			var link = $(transition).find('a.edit');
			$(link).click();
		});


		/**********************************************************

		Brings up the edit overlay for the selected state when 
		the user clicks the edit button in the *toolbox*

		**********************************************************/
		$(props.stateEditLink).live('click', function(e) {
			e.preventDefault();
			var el = e.currentTarget;

			var id = $(el).attr('data-state-id');
			var state = $('#plumb-state-' + id);
			var link = $(state).find('a.edit');
			$(link).click();
		});


		/**********************************************************

		This fires the Springy.js function to auto-magically reorder
		the states in the graph into a more user-readable format than
		the default random-placement method.

		**********************************************************/
		$(props.reorderId).live('click', function(e) {
			t.springy();
		});
	},

	buildConnections: function(paths)
	{
		/**********************************************************

		This function takes in an array of paths and attaches them graphically using jsPlumb.
		The paths are in a recursive data structure that represents the path from start to finish
		(see comments below)

		**********************************************************/


		//Position variable that is incremented with each 
		//added connection. Doing this helps spread out the overlays a bit.
		//It's still not perfect, but it's better than having an arbitrary value.
		var position = 2;


		/*

		Explanation for this next bit:
		Transitions take the form of [start state] -> [end state]
		More than one transition can take a given path.
		Therefore, we add a transitionId value for each possible transition
		
		The transitions are stored as:
			startId: {
				endId: { 
					transitionId,
					transitionId,
					...
				},
				endId:{
				.
				.
				.	
			}

			*/

		//Loop through each start state...
		$.each(paths, function(key, value) {

			var start_id = key;

			//...then through each end state...
			$.each(value, function(key, value) {

				var end_id = key;

				//...and finally, through each transition that
				//can take this path.
				$.each(value, function(key, value) {


					if( position == 8 )
					{
						position = 2
					}

					var e0 = 'plumb-state-' + start_id;
					var e1 = 'plumb-state-' + end_id;

					var path_label = key;

					var connection = instance.connect({ 
						source:e0,
						target:e1,
						connector:"StateMachine",
						hoverPaintStyle:{ strokeStyle:"gold" },
						overlays:[
						["Arrow", {location:1, width:5}],
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
						paintStyle:{ strokeStyle:"black", lineWidth:1 }
					});

					connection.scope = path_label;

					position += 1;
					t.populateObject(connections, start_id, end_id, key);
					connections[start_id][end_id][key] = connection;
				});
			});
		});
	},

	buildGraph: function()
	{
		/**********************************************************

		This method calls several other methods required to build the 
		workflow graph.

		**********************************************************/

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
		//This saves us from a number of weird edge-cases


		instance.setContainer('plumb-canvas');

		var states = t.getStateDivs();

		if( $(states).length > 25 ) {
			$(props.canvasId).addClass('large');
			$(props.zoomBoxId).addClass('large');
		}

		var paths = JSON.parse( $(props.containerId + ' > ' + props.pathClass).html() );

		t.distribute(states);

		$(props.toolboxId).show();

		t.buildConnections(paths);

		t.wrapOverlays();

		t.makeDraggable(states);

		t.setViewMode(states);

		t.catchConnectorHover();

		//This moves the focus to the first element in the the WF
		var first = $(props.stateClass);
		t.locate(first[0]);
		t.locate("");
	},

	catchConnectorHover: function() 
	{
		/**********************************************************

		This is a super hacky way to make the transition titles
		only appear when the connection line is hovered over.
		
		On larger workflows, having all the labels displayed at the same time
		is horrifyingly confusing

		**********************************************************/

		$('._jsPlumb_connector').hover(function() {
			var label = $(this).nextAll(props.labelClass);
			label = label[0];

			$(label).addClass('show-label');

			setTimeout(function() {
				$(label).removeClass('show-label');
			}, 5000);
		});
	},

	cleanConnections: function(connectionsToRemove) 
	{
		/**********************************************************

		This function is takes in a list of connections that need to be removed.
		It removes them from the global "connections" array, and detaches them
		from "instance"

		**********************************************************/

		if( !$.isEmptyObject(connectionsToRemove) )
		{

			$.each(connectionsToRemove, function(key, value) {
				var start = key;

				$.each(value, function(key, value) {
					var end = key;

					$.each(value, function(key, value) {
						var name = key;

						instance.detach(connections[start][end][name]);

						//This only deletes the .name property...
						//The rest of the object structure is preserved.
						delete connections[start][end][name];
					});
				});
			});
		}
	},

	collapseAllItems: function() 
	{
		/**********************************************************

		This method finds any states or transitions that are expanded
		and closes them.

		**********************************************************/

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
		/**********************************************************
		
		This takes in an array of state elements, and disables 
		drag-n-drop for them.

		Note: "states" can also be a singular state element, not in 
		an array

		**********************************************************/

		$(states).each(function() {
			instance.setDraggable($(this), false);
		});
	},

	distribute: function(divs)
	{
		/**********************************************************

		This function places the divs randomly onto the canvas,
		unless the layout has been saved, in which case it recreates 
		the saved layout

		**********************************************************/

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

		var height = $(props.zoomBoxId).height();
		var width = $(props.zoomBoxId).width();

		var num = $(divs).length;

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
				var box = $(props.canvasId);

				var css_left = Math.ceil(Math.random() * ($(box).width() - $(this).outerWidth(true)));
				var css_top = Math.ceil(Math.random() * ($(box).height() - $(this).outerHeight(true)));

				$(this).css('top', css_top);
				$(this).css('left', css_left);
			}
		});
	},

	enableDragging: function(states)
	{
		/**********************************************************

		Loops through an array of state elements and sets them to be
		draggable within the graph

		Note: "states" can also be a singular state element. 

		**********************************************************/

		$(states).each(function() {
			instance.setDraggable(this, true);	
		});
	},

	expandState: function(element)
	{
		/**********************************************************

		This toggles a state between the "expanded" and base state.
		When the state is expanded, the user sees the state description,
		as well as "Edit" and "Delete" buttons for the state in question.

		**********************************************************/

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
			$(element).find(props.stateTitleClass).show();
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
		/**********************************************************

		This toggles a transition between the "expanded" and base transition.
		When the transition is expanded, the user sees the transition description,
		as well as "Edit" and "Delete" buttons for the transition in question.

		**********************************************************/

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
		/**********************************************************

		Just returns every state div

		**********************************************************/

		return $(props.canvasId + ' ' + props.stateClass);
	},

	highlightTransitions: function(selected) 
	{
		/**********************************************************
		
		This highlights every instance of a selected transition within the graph
		
		**********************************************************/

		var cons = instance.getAllConnections();

		$(cons).each(function() {
			if( this.scope === selected )
			{
				this.setHover(true);
			}
			else
			{
				this.setHover(false)
			}
		});
	},

	isReal: function(item) 
	{
		/**********************************************************

		Because I'm just sick of typing it...

		See the populateObject method

		**********************************************************/

		return ( typeof item !== "undefined" );
	},

	locate: function(element) 
	{
		/**********************************************************

		This method moves the moves the graph window to focus on the 
		given element.

		This is used to highlight a state when the user clicks the
		"find" button in the toolbox

		**********************************************************/

		if( element === "" )
		{
			$(props.stateClass).removeClass('highlight');
			return;
		}

		//get 1/2 the canvas height/width to find the "center"
		var cHeight = $(props.canvasId).height() / 2;
		var cWidth = $(props.canvasId).width() / 2;

		var top = $(element).position().top;
		var left = $(element).position().left;

		if( top < cHeight )
		{
			var diffWidth = cWidth - left;
			var diffHeight = cHeight - top;

			var scrollLeft = $(props.canvasId).scrollLeft();
			var scrollTop = $(props.canvasId).scrollTop();

			var finalTop = scrollTop - diffHeight;
			var finalLeft = scrollLeft - diffWidth;
		}
		else
		{
			var finalTop = top - cHeight;
			var finalLeft = left - cWidth;
		}

		$(props.canvasId).animate({scrollTop: finalTop});
		$(props.canvasId).animate({scrollLeft: finalLeft});

		$(props.stateClass).removeClass('highlight');
		$(element).addClass('highlight');
	},

	lockScrolling: function()
	{
		/**********************************************************

		This isn't as pointless as it seems.
		By setting the width explicitly, it prevents 
		the body width from changing when the overflow is changed.

		**********************************************************/

		$('html, body').css('width', $('html, body').css('width'));
		$('html, body').css('overflow', 'hidden');
	},

	makeDraggable: function(states)
	{
		/**********************************************************

		This function marks each state as potentially draggable.

		This is different from the enableDragging method, because
		that method tells jsPlumb to allow dragging...this method
		tells jsPlumb that the states can *potentially* be dragged.

		**********************************************************/
		$(states).each(function() {
			instance.draggable(this);
		});
	},

	populateObject: function(obj, start, end, name)
	{

		/**********************************************************

		This function checks an object and makes sure the passed values
		are all valid sub-objects.

		This is needed because we occassionally need to test:

			Does connections[start][end][name] exist?

		If connections[start][end] does not exist, we will encounter an
		exception when we look for the "name" property
		
		**********************************************************/

		if( t.isReal(obj) )
		{

			if( t.isReal(start) )
			{
				if( !t.isReal( obj[start] ) )
				{
					obj[start] = {};
				}
			}

			if( t.isReal(end) )
			{
				if( !t.isReal( obj[start][end] ) )
				{
					obj[start][end] = {};
				}
			}

			if( t.isReal(name) )
			{
				if( !t.isReal( obj[start][end][name] ) )
				{
					obj[start][end][name] = true;
				}
			}
		}
	},

	rebuildGraph: function(coords)
	{
		/**********************************************************

		After running Springy to organize the graph, we need to take the 
		coordinates we gathered, and re-build the actual jsPlumb graph.

		**********************************************************/

		$(props.stateClass).show();
		$(props.layoutContainerId).text(JSON.stringify(coords));
		$('#springy-canvas').remove();
		t.buildGraph();
	},

	resetGraph: function() 
	{
		/**********************************************************
		
		This returns the jsPlumb graph to an empty, like-new state

		**********************************************************/

		instance.detachEveryConnection();
		instance.cleanup();
		instance.reset();
	},

	scrollToElement: function(element)
	{
		/**********************************************************
		
		Scrolls the page to a given element

		**********************************************************/

		$('html, body').animate({
		        scrollTop: $(element).offset().top
		}, 200);
	},

	setDesignMode: function(states)
	{
		/**********************************************************
		
		Switches the graph to "design" mode. In design mode, the user
		can click/drag the state boxes around on the graph to make 
		the graph easier to read and understand. 

		In design mode, the user
		is unable to edit the states or transitions via the graph interface.

		**********************************************************/

		var element = $(props.modeButtonId);
		//the class on the button is what mode we're in now
		//the value is the class we would switch to by pressing the button
		element.removeClass('view').addClass('design');
		$(props.zoomBoxId).addClass('design');

		t.slayDragon()

		//lock page scrolling and move down to the
		//graph canvas
		t.scrollToElement('#menu-container');
		t.lockScrolling();
	  t.enableDragging(states);
	},

	setLayout: function()
	{
		/**********************************************************

		This method loops through each state in the graph and logs it's
		coordinates so that the layout can be saved later.		

		**********************************************************/

		$(props.workflowId).attr('value', $('#selected-workflow').attr('value'));
		var states = $(props.stateIdClass);
		message = {};

		var height = $(props.zoomBoxId).height();
		var width = $(props.zoomBoxId).width();

		var box_offset = $(props.zoomBoxId).position()

		var getRelativeOffset = function(position)
		{
			// The - box_offset[] part accounts for when the user has dragged the
			// zoom-box down/right. When this happens, the box's relative position
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
		/**********************************************************

		This triggers drag-on.js to activate

		**********************************************************/

		$(props.canvasId).addClass('dragon');
		$(props.canvasId).dragOn();
	},

	setViewMode: function(states)
	{
		/**********************************************************

		This changes the graph to "view" mode. In view mode, the user
		is unable to move the states or transitions. 

		In view mode, the user is able to click on a state or transition
		in the graph, and edit it immediately.

		**********************************************************/

		var element = $(props.modeButtonId);
		element.removeClass('design').addClass('view');
		$(props.zoomBoxId).removeClass('design');

		t.setupDragon()

		t.unlockScrolling();
		t.disableDragging(states);
	},

	slayDragon: function()
	{
		/**********************************************************

		This deactivates drag-on.js

		**********************************************************/

		$(props.canvasId).trigger('DragOn.remove');
	},

  status_message: function(element, title, msg)
  {
		/**********************************************************

		This displays a message popover on a specific element

		**********************************************************/

		element = $(element);
    element.attr('data-content', msg);
    element.attr('data-original-title', title);
    element.popover({trigger: 'manual'});
    element.popover('show');
    setTimeout(function(){
      $(element).popover('hide');
    }, 1500);
  },

	springy: function() 
	{
		/**********************************************************

		This translates the jsPlumb graph into a format that Springy.js
		can work with, then runs springy to re-organize the graph.

		When Springy completes, the graph is rebuilt, using the 
		new coordinates.

		For more info, see Springy.js @ http://getspringy.com

		**********************************************************/
		
		graph = new Springy.Graph();
		var nodes = {};
		var count = 0;

		$(props.stateClass).hide();

		$(props.stateClass).each(function() {
			count++;
			nodes[$(this).find(props.stateIdClass).text()] = graph.newNode({label: $(this).find('.plumb-state-id').text()});
		});

		var paths = $(props.containerId + ' > ' + props.pathClass);

		paths = JSON.parse( $(paths).html() );

		$.each(paths, function(key, value) {

			var start = key;
			$.each(value, function(key, value) {

				var start_id = start;
				var end_id = key;

				graph.newEdge(nodes[start_id], nodes[end_id]);
			});
			
		});

		var height = $(props.zoomBoxId).height();
		var width = $(props.zoomBoxId).width();

		$(props.zoomBoxId).append('<canvas id="springy-canvas" height="' + height + '" width="' + width + '" />');

		t.resetGraph();

		$('#springy-canvas').springy({graph: graph});
	},

	toolboxError: function(element)
	{
		/**********************************************************

		This displays a status message for the toolbox selectors.
		They're all the same, so why bother repeating.

		**********************************************************/

		t.status_message($(element).siblings('select'), "Empty", "Please select a value");
	},

	transitionExists: function(obj, start, end, name) 
	{
		/**********************************************************

		This verifies that a given transition exists between 2 states.
		obj is a 3 dimensional array in the form of:
			obj[start][end][transition]

		Since an exception is throw if, for instance, obj[start] does not
		exists when we're looking for obj[start][end][transition],
		we must incrementally look through the object to verify 
		the transitions existence.

		**********************************************************/
		if( t.isReal(obj) ) {

			if( t.isReal(obj[start]) ) {

				if( t.isReal(obj[start][end] ) ) {

					if( t.isReal(obj[start][end][name]) ) {
						return true;
					}
				}
			}
		}

		return false;
	},

	unlockScrolling: function()
	{
		/**********************************************************

		These 2 CSS properties enable page scrolling again, after 
		it has been disabled (see the lockScrolling method)

		**********************************************************/

		$('html, body').css('width', 'inherit');	
		$('html, body').css('overflow', 'auto');
	},

	updateFormItems: function(data)
	{
		/**********************************************************

		After we update an object via AJAX, we need to go back and 
		change the object's HTML representation in the background
		so that the graph will accurately reflect that changes.

		**********************************************************/

		var changedForms = $('#changed-forms').children();

		$(changedForms).each(function() {

			var name = $(this).attr('data-element-id');

			name = "#plumb-" + name;

			var updatedItem = $(data).find(name);

			//We only want to update the divs. Messing with the anchor 
			//tags will mess up the form overlays
			var values = $(data).find(name).find('div');

			$(values).each(function() {
				//add the . to make it a jquery class selector
				var className = "." + $(this).attr('class');

				//Hacky way to be sure that we grab only 1 class
				className = className.split(' ')[0];
				$(props.canvasId).find(name).find(className).html($(this).html());
			});

			//If the title of a state has been changed, the graph may no longer
			//be correnctly aligned, so we repaint that element
			instance.recalculateOffsets($(name));
			instance.repaint($(name));
		});
	},

	updateGraph: function(data, update) 
	{
		/**********************************************************

		This method takes in a response from an AJAX form submission
		and parses it to determine what changes need to be made to the
		graph. 

		Any new/deleted states and transitions will be handled accordingly, 
		and any edited values on existing states will be updated as well.

		**********************************************************/

		var newTransitions = $(data).find(props.pathClass).html();
		newTransitions = JSON.parse(newTransitions);

		changes = {
			add: {},
			remove: {}
		};

		$.each(connections, function(key, value) {

			var start = key;
			$.each(this, function(key, value) {

				var end = key;
				
				$.each(this, function(key, value) {

					var transition_name = key;

					//We went to check if the transition was removed.
					var exists = t.transitionExists( newTransitions, start, end, transition_name);

					if( exists === false ) {
						t.populateObject(changes.remove, start, end, transition_name);
					}
				});
			});
		});

		$.each(newTransitions, function(key, value) {

			var start = key;
			$.each(this, function(key, value) {

				var end = key;
				$.each(this, function(key, value) {

					var transition_name = key;

					//We want to check if the transition was just added.
					var exists = t.transitionExists( connections, start, end, transition_name);

					if( exists === false ) 
					{
						t.populateObject(changes.add, start, end, transition_name);	
					}
				});
			});
		});

		t.updateFormItems(data);

		t.updateStates(changes, data, update);

		t.updateToolbox();

		t.buildConnections(changes.add);
		
		t.cleanConnections(changes.remove);

		t.catchConnectorHover();

		t.wrapOverlays();
	},

	updateToolbox: function()
	{
		/**********************************************************
		
		This method updates the toolbox drop-down menus to reflect any changes
		after the user saves a form.

		**********************************************************/

		var changes = $('#changed-forms').children();

		$(changes).each(function() {
			var name = $(this).attr('data-element-id');

			var parts = name.split('-');
			var type = parts[0];
			var itemId = parts[1];

			var select = "." + type + "-select";

			var values = JSON.parse($(this).html());

			var title = values[type + "-" + itemId + "-title"];

			$(select).find('option[value="' + itemId + '"]').html(title);
		});
	},

	updateStates: function(changes, data, update)
	{
		/**********************************************************
		
		This takes in any changes to the list of states currently in the graph
		and adds/deletes them in order to rectify them with any recent
		changes that the user has made to the graph.

		**********************************************************/

		$.each(changes.add, function( key, value ) {

			var name = '#plumb-state-' + key;
			if( $(name).length == 0 )
			{
				var state = $(data).find(name);
				$(props.zoomBoxId).append(state);
				t.distribute(state);
				t.makeDraggable(state);

				//Update is the "setup_overlays" function 
				//from the workflowmanager.js script
				update(state)
				$(state).show();
			}
		});

		$.each(changes.remove, function( key, value ) {
			var name = 'plumb-state-' + key;
			var id = '#' + name;
			if( $(data).find(id).length == 0 )
			{
				instance.remove(name);
				$(props.canvasId).find(id).remove();
			}
		});
	},

	wrapOverlays: function()
	{
		/**********************************************************

		After the graph is built, we need to wrap all the transition
		title boxes with a span tag to allow them to be  more easily
		accessed later.

		**********************************************************/

		var overlays = $(props.labelClass);

		overlays.each(function() {

			var text = $(this).text();
			$(this).empty();

			$(this).append('<span>' + text + '</span>');
		});
	}
};
