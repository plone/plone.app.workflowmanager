QUnit.config.reorder = false;
QUnit.test("Create a state", function(assert) {
  var wfg = WORKFLOW_GRAPH;

  var add_data = {
    graph_updates: {
      element: '<div class="plumb-state" style="display: none;" id="plumb-state-test_state"><div class="plumb-state-id" style="display: none;">test_state</div><div class="plumb-state-title plumb-title">test_state</div><div class="plumb-state-description" style="display: none;">Whatever</div><div class="plumb-state-paths" style="display: none;">{}</div><a class="dialog-box btn edit" rel="#pb_99999" style="display: none;" href="http://localhost:7000/Plone/@@workflowmanager-edit-state?selected-workflow=testworkflow&amp;selected-state=test_state">Edit</a><a class="dialog-box btn" rel="#pb_99999" style="display: none;" href="http://localhost:7000/Plone/@@workflowmanager-delete-state?selected-workflow=testworkflow&amp;selected-state=test_state">Delete</a></div>',
      type: "state",
      action: "add",
      objectId: "test_state",
      transitions: [],
    },
  };
  assert.ok(wfg.states, "The states exist");
  assert.equal(wfg.states['test_state'], undefined, "The new state isn't already there.");

  wfg.updateGraph(add_data);

  assert.ok(wfg.states['test_state'], "The state was created");

  var s = wfg.states['test_state'];

  assert.equal(s.id, 'test_state', "ID set");
  assert.equal(s.title, "test_state", "Title set");

  assert.equal($(wfg.props.zoomBoxId).find('#plumb-state-test_state').length, 1, "Graph element drawn properly");

  assert.equal($(s.selectId).find('option[value="' + s.id + '"]').length, 1, "Select option added");
});

QUnit.test("Create a transition", function(assert) {

  var wfg = WORKFLOW_GRAPH;

  var add_data = {
    graph_updates: {
      element: '<div class="plumb-transition" style="display: none;" id="plumb-transition-test_transition"><div class="transition-id">test_transition</div><div class="transition-title plumb-title">test_transition</div><div class="transition-description"></div><div class="transition-destination"></div><a class="dialog-box transition-link btn edit" rel="#pb_99999" href="http://localhost:7000/Plone/@@workflowmanager-edit-transition?selected-workflow=testworkflow&amp;selected-transition=test_transition">Edit</a><a class="dialog-box transition-link btn" rel="#pb_99999" href="http://localhost:7000/Plone/@@workflowmanager-delete-transition?selected-workflow=testworkflow&amp;selected-transition=test_transition">Delete</a></div>',
      objectId: 'test_transition',
      type: 'transition',
      action: 'add',
    },
  };

  assert.equal(wfg.transitions['test_transition'], undefined, "Transition doesn't exist prematurely...");

  wfg.updateGraph(add_data);

  assert.ok(wfg.transitions['test_transition'], "Transition created");

  var t = wfg.transitions['test_transition'];

  assert.deepEqual(t.collection, wfg.transitions, "Collection set properly");

  assert.equal(t.type, 'transition', "Type set properly");

  assert.equal(t.id, 'test_transition', "ID set properly");

  assert.equal(t.title, 'test_transition', "Title set properly");

  assert.deepEqual(t.wfg, wfg, "WFG reference set properly");

  assert.ok($(t.selectId).find('option[value="' + t.id + '"]'), "Dropdown element added properly");

  assert.equal($.isEmptyObject( t.connections ), true, "No connections made yet");
});

QUnit.test("Edit a state", function(assert) {
  var wfg = WORKFLOW_GRAPH;

  var add_data = {
    graph_updates: {
      //If you're curious, these update elements can be caputured/examined by setting a debugger 
      //in the updateGraph() function of the workflow-graph.js and viewing the "data" object
      element: '<div class="plumb-state" style="display: none;" id="plumb-state-test_state"><div class="plumb-state-id" style="display: none;">test_state</div><div class="plumb-state-title plumb-title">Something else</div><div class="plumb-state-description" style="display: none;">Whatever</div><div class="plumb-state-paths" style="display: none;">{}</div><a class="dialog-box btn edit" rel="#pb_99999" style="display: none;" href="http://localhost:7000/Plone/@@workflowmanager-edit-state?selected-workflow=testworkflow&amp;selected-state=test_state">Edit</a><a class="dialog-box btn" rel="#pb_99999" style="display: none;" href="http://localhost:7000/Plone/@@workflowmanager-delete-state?selected-workflow=testworkflow&amp;selected-state=test_state">Delete</a></div>',
      type: "state",
      action: "update",
      objectId: "test_state",
      add: ["publish", "test_transition"],
      remove: [],
    },
  };

  assert.equal(wfg.transitions['publish'].connections['test_state'], undefined, "Publish transition object doesn't contain a 'test_state' connection");

  wfg.updateGraph(add_data);

  var s = wfg.states['test_state'];

  assert.equal(s.title, "Something else", "Title updated correctly");
  assert.ok(s.outgoing['publish'], "Transition added");
  assert.ok(wfg.transitions['publish'].connections['test_state'], "Publish transition contains a 'test_state' connection");


});

QUnit.test("Edit a transition", function(assert) {
  var wfg = WORKFLOW_GRAPH;

  var update_data = {
    graph_updates: {
      element: '<div class="plumb-transition" style="display: none;" id="plumb-transition-test_transition"><div class="transition-id">test_transition</div><div class="transition-title plumb-title">New Title</div><div class="transition-description">New Description</div><div class="transition-destination">published</div><a class="dialog-box transition-link btn edit" rel="#pb_99999" href="http://localhost:7000/Plone/@@workflowmanager-edit-transition?selected-workflow=testworkflow&amp;selected-transition=test_transition">Edit</a><a class="dialog-box transition-link btn" rel="#pb_99999" href="http://localhost:7000/Plone/@@workflowmanager-delete-transition?selected-workflow=testworkflow&amp;selected-transition=test_transition">Delete</a></div>',
      objectId: 'test_transition',
      type: 'transition',
      action: 'update',
    },
  };

  wfg.updateGraph(update_data);
  var t = wfg.transitions['test_transition'];

  var desc = $(t.el).find(t.descClass).text();

  assert.equal(desc, "New Description", "Description changed properly");
  assert.equal(t.title, "New Title", "Title updated properly");

  var s = wfg.states['test_state'];

  assert.ok(t.connections[s.id], "Connection destination changed properly");

  var c = t.connections[s.id];

  assert.equal(c.end, 'published', "Destination set properly");
  assert.equal(c.start, s.id, "Connection start set properly");
  assert.equal(c.transition, t.id, "Connection transition ID set properly");

});

QUnit.test("Remove a state", function(assert) {
  var wfg = WORKFLOW_GRAPH;
  
  var remove_data = {
    graph_updates: {
      type: "state",
      action: "delete",
      objectId: "test_state",
    },
  };

  assert.ok(wfg.states['test_state'], "State actually exists...");

  wfg.updateGraph(remove_data);

  assert.equal(wfg.states['test_state'], undefined, "Deleted properly");
  assert.equal($(wfg.props.zoomBoxId).find('#plumb-state-test_state').length, 0, "Graph element remove properly");
  assert.equal($(wfg.props.stateSelectId).find('option[value="test_state"]').length, 0, "Select option removed");

  assert.equal(wfg.states['published'].incoming['test_transition'], undefined, "Published's incoming transition removed properly");
});

QUnit.test("Remove a transition", function(assert) {

  var wfg = WORKFLOW_GRAPH;

  var remove_data = {
    graph_updates: {
      type: "transition",
      action: "delete",
      objectId: "test_transition",
    },
  };

assert.ok(wfg.transitions['test_transition'], "It's here one second....");

wfg.updateGraph(remove_data);

assert.equal(wfg.transitions['test_transition'], undefined, "...and gone the next.");
assert.equal($(wfg.props.transitionSelectId).find('option[value="test_transition"]').length, 0, "Select option removed");




});