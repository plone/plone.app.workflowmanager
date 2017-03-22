
WorkflowGraph = function WorkflowGraph() {
  this.constructor;
  this.init();
  props = this.props;
  t = this;
};

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
    stateDescClass: 				'.plumb-state-description',
    statePaths: 						'.plumb-state-paths',
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

    transSelectId: 					'#plumb-toolbox-select-transition',
    transClass: 						'.plumb-transition',
    transDescClass:  				'.transition-description',
    transTitleClass:  			'.transition-title',
    transIdClass: 					'.transition-id',
    transLinkClass:  				'.transition-link',
    transEndClass: 					'.transition-destination',

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
    reorderId: 							'#plumb-reorder',
    stateSelectId: 					'#plumb-toolbox-select-state'
  },

  states: {},

  transitions: {},

  connections: {},

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

    instance = jsPlumb.getInstance();


    /**********************************************************

    This button switches between "view" and "design" modes.

    View mode:
        States cannot be moved. Clicking on them will bring up the edit options.

    Design mode:
        States can be dragged around. Click on them will not do anything.
        Intended only for the purpose of re-arranging the states in the graph.

    *********************************************************/
    $(props.modeButtonId).on('click', function() {

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
    $(props.stateClass).on('click', function(e) {

      //Detects if the event was triggered by the state select list
      if( typeof(e.originalEvent) == 'undefined' )
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
    $(props.graphSaveButtonId).on('click', function() {

      var options = {
        beforeSerialize: t.setLayout(),
        success: function() {
          t.status_message($(props.graphSaveButtonId), "Layout Saved", "The layout has been saved successfully.");
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
    $(props.editSelectedClass).on('click', function() {
        var select = $(this).siblings('select');
        var type = "";

        var isTransition = $(select).hasClass(props.transitionSelectClass.replace('.', ''));


        if( $(select).val() === "" )
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
    $(props.highlightStateId).on('click', function() {

      var state = $(props.stateSelectClass).val();

      if( state === "" )
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
    $(props.highlightTransitionId).on('click', function() {
      var select = $(this).siblings('select').val();

      if( select === "" )
      {
        t.toolboxError(this);
        return;
      }

      t.highlightTransitions(select);
    });


    /**********************************************************

    Removes the highlight effect from all states.

    **********************************************************/
    $(props.stateHighlightClear).on('click', function() {

      t.locate("");
    });

    /**********************************************************

    Removes the highlight effect from all transitions

    **********************************************************/
    $(props.transitionHighlightClear).on('click', function() {

      t.highlightTransitions("");
    });


    /**********************************************************

    This brings up the edit overlay for the selected transition
    when the user clicks the edit button in the *toolbox*

    **********************************************************/
    $(props.transEditLink).on('click', function(e) {
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
    $(props.stateEditLink).on('click', function(e) {
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
    $(props.reorderId).on('click', function(e) {
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
    jsPlumb.doWhileSuspended(function() {

      $.each(paths, function(key, value) {

        var start_id = key;

        //...then through each end state...
        $.each(value, function(key, value) {

          var end_id = "";

          if( typeof key != 'undefined' )
          {
            end_id = key;
          }

          //...and finally, through each transition that
          //can take this path.
          $.each(value, function(key, value) {

            t.connectStates(start_id, end_id, key);
          });
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

    instance.setContainer('plumb-canvas');

    var stateElements = t.getStateDivs();

    if( $(stateElements).length > 25 ) {
      $(props.canvasId).addClass('large');
      $(props.zoomBoxId).addClass('large');
    }

    $(stateElements).each(function() {
      var newState = new State( $(this) );
      newState.create();
    });

    var transitionElements = $(props.transClass);

    $(transitionElements).each(function() {
      var newTrans = new Transition( $(this) );
      newTrans.create();
    });

    var paths = JSON.parse( $(props.containerId + ' > ' + props.pathClass).html() );

    $(props.toolboxId).show();

    t.buildConnections(paths);

    t.wrapOverlays();

    //This moves the focus to the first element in the the WF
    var first = $(props.stateClass);
    t.locate(first[0]);
    t.locate("");
  },

  catchConnectorHover: function(connection)
  {
    /**********************************************************

    This makes a connections label visible for 5 seconds after it's
    been hovered over.

    **********************************************************/

      var label = connection.getOverlays()[1].canvas;
      $(label).addClass('show-label');

      setTimeout(function() {
        $(label).removeClass('show-label');
      }, 1000);
  },

  cleanProp: function(prop)
  {
    /**********************************************************

    This function just strips the unwanted selector character off
    of a property item

    **********************************************************/

    return prop.substring(1, prop.length);
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
    });
  },

  connectStates: function(start_id, end_id, transition_title)
  {
    if( end_id === "" )
    {
      //If we've gotten here, that means that this state has a transition enabled
      //that doesn't have a destination state set. We create a stub connection to
      //hold onto that info for later.
      t.connections[start_id + '_' + transition_title] = new Connection(start_id, '', transition_title, '');
      return true;
    }

    //This will place the label at a random position
    //within the middle 80% of the connection
    var position = Math.random();
    position *= 6;
    position += 2;
    position = Math.floor(position);

    var e0 = 'plumb-state-' + start_id;
    var e1 = 'plumb-state-' + end_id;

    if( $('#' + e0).length <= 0 || $('#' + e1).length <= 0 )
    {
      return true;
    }

    var graph_connection = instance.connect({
    source:e0,
    target:e1,

    connector:"StateMachine",
    hoverPaintStyle:{ strokeStyle:"gold" },
    overlays:[
    ["Arrow", {location:1, width:5}],
    ["Label", {
      label:transition_title,
      location: (position / 10),
      cssClass:"plumb-label",
      events:{
        //Defining the event here is the only effective way,
        //since jsPlumb makes it difficult/impossible to add a listener
        //outside the graph_connection definition
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

    graph_connection.scope = transition_title;
    graph_connection.bind("mouseenter", function() {
      t.catchConnectorHover(graph_connection);
    });

    t.connections[graph_connection.id] = new Connection(start_id, end_id, transition_title, graph_connection);
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

    var layout = $(props.layoutContainerId).val();

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

    $(element).children(':not(' + props.statePaths + ')').show();
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
        this.setHover(false);
      }
    });
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

    var finalTop = 0;
		var finalLeft = 0;

    if( top < cHeight )
    {
      var diffWidth = cWidth - left;
      var diffHeight = cHeight - top;

      var scrollLeft = $(props.canvasId).scrollLeft();
      var scrollTop = $(props.canvasId).scrollTop();

      finalTop = scrollTop - diffHeight;
      finalLeft = scrollLeft - diffWidth;
    }
    else
    {
      finalTop = top - cHeight;
      finalLeft = left - cWidth;
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
    $(props.modeBoxId).attr('checked', true);
    //the class on the button is what mode we're in now
    //the value is the class we would switch to by pressing the button
    element.removeClass('view').addClass('design');
    $(props.zoomBoxId).addClass('design');

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

    $(props.workflowId).attr('value', $('#selected-workflow').val());
    var states = $(props.stateIdClass);
    message = {};

    var height = $(props.zoomBoxId).height();
    var width = $(props.zoomBoxId).width();

    var box_offset = $(props.zoomBoxId).position();

    var getRelativeOffset = function(position)
    {
      // The - box_offset[] part accounts for when the user has dragged the
      // zoom-box down/right. When this happens, the box's relative position
      // (returned by .position()) becomes negative, compared to the drawing canvas.
      // This would cause states to be rendered outside of the box, and out of the reach of
      // the user
      var left = position.left - box_offset.left;
      var top = position.top - box_offset.top;

      var offset = {
        'left': (left/width),
        'top': (top/height)
      };

      return offset;

    };

    states.each(function() {
      message[$(this).text()] = getRelativeOffset($(this).parent().position());
    });

    var output = JSON.stringify(message);
    $(props.layoutContainerId).text(output);
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
    $(props.modeBoxId).attr('checked', false);
    element.removeClass('design').addClass('view');
    $(props.zoomBoxId).removeClass('design');

    t.unlockScrolling();
    t.disableDragging(states);
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

    var changes = data.graph_updates;

    if( typeof changes != 'undefined' )
    {
      var constructor = null;
      var collection = null;

      if( changes.type == 'transition' )
      {
        collection = t.transitions;
        constructor = Transition;
      }
      else if ( changes.type == 'state' )
      {
        collection = t.states;
        constructor = State;
      }
      else
      {
        return;
      }

      var objectId = changes.objectId;
      var element = changes.element;
      var action = changes.action;

      if( action == 'add' )
      {
        collection[objectId] = new constructor(element);
        collection[objectId].create();

        var paths = {};
        paths[objectId] = {};

        $(changes.transitions).each(function() {

          var end = t.transitions[this].destination;
          var title = t.transitions[this].title;

          if( typeof paths[objectId][end] == 'undefined' )
          {
            paths[objectId][end] = {};
          }

          paths[objectId][end][this] = title;

        });

        t.buildConnections(paths);
      }
      else if( action == 'update' )
      {
        collection[objectId].update(changes);
      }
      else if( action == 'delete' )
      {
        collection[objectId].destroy(changes);
      }
    }
  },

  updateGraph: function(changes)
  {
    /**********************************************************

    This method takes in a response from an AJAX form submission
    and parses it to determine what changes need to be made to the
    graph.

    Any new/deleted states and transitions will be handled accordingly,
    and any edited values on existing states will be updated as well.

    **********************************************************/

    t.updateFormItems(changes);

    t.wrapOverlays();

    $('#changed-forms').empty();

    $('#save-all-button').removeClass('btn-danger');
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

//////////////////////////////////////////////////////////////

var GraphObject = function GraphObject() {
  this.id = null;

  this.title = null;
  this.el = null;
  this.type = null;

  this.collection = null;

  this.selectId = null;
  this.wfg = WorkflowGraph.prototype;
};

GraphObject.prototype = {

  elPrefix: 'plumb',
  container: WorkflowGraph.prototype.props.zoomBoxId,

  init: function()
  {
    this.id = $(this.el).find(this.idClass).text();
    this.title = $(this.el).find(this.titleClass).text();
  },

  create: function()
  {
      var element = $(GraphObject.prototype.container).find(this.getIdPlug());

      //In some cases, the element for an object may not exist
      //in the graph, so we append it here
      if( element.length === 0 )
      {
        $(GraphObject.prototype.container).append(this.el);
        this.el = $(this.getIdPlug());
      }

      if( $(this.selectId).find('option[value="' + this.id + '"]').length === 0 )
      {
        $(this.selectId).append('<option value="' + this.id + '">' + this.title + '</option>');
      }

      this.collection[this.id] = this;
  },

  destroy: function()
  {
    instance.remove(this.getElementId());
    $(this.el).remove();
    $(this.selectId).find('option[value="' + this.id + '"]').remove();
    delete this.collection[this.id];
  },

  update: function(changes)
  {
    var element = changes.element;
    var title = $(element).find(this.titleClass).text();
    var desc = $(element).find(this.descClass).text();

    this.title = title;

    $(this.el).find(this.titleClass).text(title);
    $(this.el).find(this.descClass).text(desc);

    $(this.selectId).find('option[value="' + this.id + '"]').text(title);
  },

  highlight: function()
  {
  },

  getId: function()
  {
    return this.id;
  },

  getElementId: function()
  {
    return GraphObject.prototype.elPrefix + '-' + this.type + '-' + this.id;
  },

  getIdPlug: function()
  {
    return '#' + this.getElementId();
  },
};

//////////////////////////////////////////////////////////////

var State = function State(element) {
  if( typeof element == 'undefined' )
  {
    return null;
  }

  //This calls the GraphObject constructor,
  //which creates all the properties for the object
  GraphObject.call(this);

  this.el = $(element);
  this.type = 'state';
  this.titleClass = props.stateTitleClass;
  this.idClass = props.stateIdClass;
  this.descClass = props.stateDescClass;
  this.selectId = props.stateSelectId;

  this.collection = t.states;

  this.incoming = {};
  this.outgoing = {};

  this._super = GraphObject.prototype;

  this.init(element);
};

State.prototype = new GraphObject();
State.prototype.constructor = State;

State.prototype.addConnections = function(paths)
{
  var new_paths = {};
  new_paths[this.id] = {};

  var self = this;

  for( var i = 0; i < paths.length; i++ )
  {
    var end = self.wfg.transitions[paths[i]].destination;

    if( end !== "" )
    {
      if( typeof new_paths[self.id][end] == 'undefined' )
      {
        new_paths[self.id][end] = {};
      }

      //see the buildConnections method of the graph
      //for explanation on the data structure used here.
      new_paths[self.id][end][paths[i]] = true;
    }
    else
    {
      self.wfg.connectStates(self.id, "", paths[i]);
    }
  }

  self.wfg.buildConnections(new_paths);
};

State.prototype.addOutgoing = function(connection)
{

  this.outgoing[connection.transition] = connection;
};

State.prototype.addIncoming = function(connection)
{
  //Note that we aren't storing each connection, just each transition that leads here.
  //We only use these when deleting the state, so that we move the incoming states elsewhere.
  //This needs to be done at the transition level, not the connection level.
  this.incoming[connection.transition] = this.wfg.transitions[connection.transition];
};

State.prototype.create = function()
{

  this._super.create.call(this);

  var paths = $(this.el).find(props.statePaths).text();
  paths = JSON.parse(paths);

  this.wfg.makeDraggable( this.el );
  this.wfg.distribute( this.el );
  this.wfg.setViewMode( this.el );
  //this.wfg.buildConnections( paths );
  $(this.el).show();
};

State.prototype.destroy = function(changes)
{

  var self = this;

  if( typeof changes.replacement != 'undefined' && changes.replacement !== '' )
  {
    $.each(this.incoming, function(key, value) {
      //value is a transition object, in this context
      value.changeDestination(changes.replacement);
    });
  }

  $.each(this.outgoing, function(key, value) {
    //We need to make sure the transition object
    //updates the target state, to make sure it no longer
    //expects a transition from this state.
    this.wfg.transitions[key].removeConnection(self.id);
  });

  this._super.destroy.call(this);
};

State.prototype.removeConnections = function(connectionsToRemove)
{
  if( connectionsToRemove.length > 0 )
  {
    for( var i = 0; i < connectionsToRemove.length; i++ )
    {
      this.outgoing[connectionsToRemove[i]].destroy();
    }
  }
};

State.prototype.removeIncoming = function(transition)
{

  delete this.incoming[transition];
};

State.prototype.removeOutgoing = function(connection)
{

  delete this.outgoing[connection.transition];
};

State.prototype.update = function(changes)
{

  this._super.update.call(this, changes);

  //If the title of a state has been changed, the graph may no longer
  //be correnctly aligned, so we repaint that element
  instance.recalculateOffsets($(this.el));
  instance.repaint($(this.el));

  if( changes.add.length > 0 )
  {
    this.addConnections(changes.add);
  }

  if ( changes.remove.length > 0 )
  {
    this.removeConnections(changes.remove);
  }
};

//////////////////////////////////////////////////////////////

var Transition = function Transition(element) {
  if( typeof element == 'undefined' )
  {
    return null;
  }

  //This calls the GraphObject constructor,
  //which creates all the properties for the object
  GraphObject.call(this);

  this.el = element;
  this.type = 'transition';
  this.titleClass = props.transTitleClass;
  this.idClass = props.transIdClass;
  this.descClass = props.transDescClass;
  this.selectId = props.transSelectId;

  this.collection = t.transitions;

  this._super = GraphObject.prototype;

  this.destination = null;
  this.connections = {};

  this.init(element);
};

Transition.prototype = new GraphObject();
Transition.prototype.constructor = Transition;

Transition.prototype.init = function()
{
  this._super.init.call(this);

  this.destination = $(this.el).find(props.transEndClass).text();
};

Transition.prototype.addConnection = function(connection)
{

  this.connections[connection.start] = connection;
};

Transition.prototype.changeDestination = function(new_dest)
{
  var self = this;
  $.each(this.connections, function(key, value) {
    var start = value.start;
    var end = new_dest;
    var transitionId = self.id;

    if( self.destination !== "" )
    {
      self.connections[start].destroy();
    }
    else
    {
      //If we're here, the destination was previously empty,
      //but now it has a real value.
      self.wfg.connections[start + '_' + transitionId].destroy();
    }

    this.wfg.connectStates(start, end, transitionId);
  });

  this.destination = new_dest;
};

Transition.prototype.destroy = function()
{
  var instances = this.connections;

  $.each(instances, function(key, value) {
    this.destroy();
  });

  this._super.destroy.call(this);
};

Transition.prototype.removeConnection = function(start_id)
{
  if( this.destination !== "" )
  {
    this.wfg.states[this.destination].removeIncoming(this.id);
  }

  delete this.connections[start_id];
};

Transition.prototype.hasConnection = function(start, end)
{

  if( typeof this.connections[start] == 'undefined' )
  {
    return false;
  }

  var endState = t.states[end];

  if( this.connections[start].targetId == endState.getElementId() )
  {
    return true;
  }

  return false;
};

Transition.prototype.update = function(changes)
{
  this._super.update.call(this, changes);

  var new_dest = $(changes.element).find(props.transEndClass).text();

  if( new_dest != this.destination )
  {
    this.changeDestination(new_dest);
  }
};

////////////////////////////////////////////////////////////

var Connection = function Connection(start_id, end_id, transition_id, graph_connection) {
  this.id = graph_connection.id;

  if( end_id === "" )
  {
    this.id = start_id + '_' + transition_id;
  }

  this.graph_connection = graph_connection;
  this.constructor;

  this.start = start_id;
  this.end = end_id;
  this.transition = transition_id;

  this.wfg = WorkflowGraph.prototype;

  this.init();
};

Connection.prototype = {

  init: function()
  {
    this.wfg.states[this.start].addOutgoing(this);

    if( this.end !== "" )
    {
      this.wfg.states[this.end].addIncoming(this);
    }

    this.wfg.transitions[this.transition].addConnection(this);

    var all_connections = instance.getAllConnections();

  },

  destroy: function()
  {
    this.wfg.states[this.start].removeOutgoing(this);

    this.wfg.transitions[this.transition].removeConnection(this.start);

    instance.detach(this.graph_connection);

    delete this.wfg.connections[this.id];
  },
};
