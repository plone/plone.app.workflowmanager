var CURRENT_OVERLAY = null;
var OVERLAYS = [];

Array.prototype.contains = function(item){
  for(var i = 0; i < this.length; i++){
    if(this[i] == item){
      return true;
    }
  }
  return false;
};

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * http://plugins.jquery.com/files/jquery.cookie.js.txt
 */
jQuery.cookie = function(name, value, options) {
  if (typeof value != 'undefined') { // name and value given, set cookie
    options = options || {};
    if (value === null) {
      value = '';
      options.expires = -1;
    }
    var expires = '';
    if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
      var date;
      if (typeof options.expires == 'number') {
        date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      } else {
        date = options.expires;
      }
      expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
    }

    // CAUTION: Needed to parenthesize options.path and options.domain
    // in the following expressions, otherwise they evaluate to undefined
    // in the packed version for some reason...
    var path = options.path ? '; path=' + (options.path) : '';
    var domain = options.domain ? '; domain=' + (options.domain) : '';
    var secure = options.secure ? '; secure' : '';
    document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
  } else { // only name given, get cookie
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
};


(function($){
$(document).ready(function(){
  var spinner = $("#kss-spinner");
  var nortstar_container = $("#workflowmanager-container");

  var is_advanced_mode = function(){
    return $.cookie("workflowmanager-advanced") == "true";
  };

  var tool_tip_settings = {
    relative : true,
    delay : 200,
    predelay: 300
  };

  var set_advanced_mode = function(advanced){
    if(advanced){
      $(".advanced").show();
      $.cookie("workflowmanager-advanced", true, { expires : 365 });
    }else{
      $(".advanced").hide();
      $.cookie("workflowmanager-advanced", null);
    }
  };

  //display our status message in a pretty way.
  var status_message = function(msg){
    var status = $('#save-all-button');
    status.attr('data-content', msg);
    status.popover('show');
    setTimeout(function(){
      $('#save-all-button').popover('hide');
    }, 1500);
  };

  //returns the url for a given workflow
  var get_url = function(){
    var url = $('base').attr('href') + "@@workflowmanager";
    var ele = jQuery("input[name='selected-workflow']");
    if(ele.size() > 0){
      url = url + "?selected-workflow=" + ele.val();
    }
    return url;
  };

  //get the variables encoded in a url
  var get_url_vars = function(url){
    var vars = {}, hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++){
      hash = hashes[i].split('=');
      vars[hash[0]] = hash[1];
    }
    return vars;
  };

  var has_dirty_items = function(){
    var dirty_items = $("div.workflow-item.dirty");
    return dirty_items.size() > 0;
  };

  var strip_vars = function(url){
    var index = url.lastIndexOf('?');
    if(index == -1){
      return url;
    }else{
      return url.substring(0, index);
    }
  };

  var load_overlay = function(content, selector){

    handle_advanced(content);

    setup_overlays(content);

    $('#pb_99999 .pb-ajax').html(""); //clear it out
    var inside = content.find(selector);

    if(inside.size() === 0){
      inside = content; //if can't find inner element, just show all.
    }

    $('.save-form, .cancel', inside).on('click', function(e) {
      overlay_close(e.toElement);
    });
    $('#pb_99999 .pb-ajax').wrapInner(inside);
    $('#pb_99999 .pb-ajax').find(selector).addClass(CURRENT_OVERLAY.getTrigger().attr('class'));

    setup_tabs(content);
  };

  var repopulate_form_data = function(form, content) {

    var form_data = $.parseJSON(content);
    var inputs = $(form).find(':input');
    $(inputs).each(function() {

      var value = form_data[this.name];
      var type = $(this).attr('type');

      if( value !== undefined ) {

        //The on/off values should only be set if this
        //is a checkbox.
        if( value == "on" ) {
          $(this).attr('checked', true);
        }else if( value == "off" ) {
          $(this).attr('checked', false);
        }else{
          $(this).val(value);
        }
      }
    });

    return form;
  };

  // Our overlay settings that automatically load remote content
  // and clear it out when it closes
  overlay_settings = {
    onBeforeLoad: function() {
      spinner.show();
      CURRENT_OVERLAY = this;
      var wrap = $('#pb_99999 .pb-ajax');
      var trigger = this.getTrigger();
      var url = trigger.attr("href");
      var content_selector = trigger.attr('target');
      if(content_selector === undefined || ['', '_blank', '_parent', '_self', '_top'].contains(content_selector.toLowerCase())){
        content_selector = 'div.dialog-box';
      }

      var data = get_url_vars(url);
      url = strip_vars(url);
      data.ajax = true;

      var open = true;
      if(trigger.hasClass('save-first') && has_dirty_items()){
        // #TODO Add support for i18n
        if(confirm("You have unsaved changes. Would you like to save them and continue?")){
          save(function(){
            // #TODO Add support for i18n
            status_message("The workflow has been successfully updated.");
          });
        }else{
          return false;
        }
      }

      $.ajax({ url : url, data : data, type : 'POST',
        complete : function(request, textStatus){
          load_overlay($(request.responseText), content_selector);
          var formData = JSON.stringify( retrieve_form_data( request.responseText ) );
          $('#form-holder').html(formData);

          var state = data['selected-state'];
          var transition = data['selected-transition'];
          var item = {};
          var type = '';

          if( typeof(state) !== undefined )
          {
            item = state;
            type = "state";
          }
          else if( typeof(transition) !== undefined )
          {
            item = transition;
            type = "transition";
          }

          var edit = url.indexOf('/@@workflowmanager-edit-' + type);

          //This looks to see if we've previously edited this form, and clicked "Ok"
          var previously_saved_form = $('#changed-forms').find('div[data-element-id="' + type + '-' + item + '"]').text();

          //If we've saved the form, pull up that saved data, instead of starting from the old version.
          //This lets us to preserve changes between edits, without having to actually save them
          if(
              item !== undefined &&
              edit > 0 &&
              previously_saved_form !== ""
            )
          {
            var name = $('#plumb-' + type + '-' + item);
            var fieldset = $('#pb_99999 form');
            repopulate_form_data(fieldset, previously_saved_form);
          }
          spinner.hide();
        }
      });

    },
    expose: {
        color: 'transparent',
    },
    top : 0,
    fixed : false,
    closeOnClick: false,
    oneInstance: false,
    onBeforeClose : function(closer){
      var overlay = $('#pb_99999 .pb-ajax');

      //The form data is stored as a JSON string,
      //Allowing us to check if there's been any changes.
      var form_data = $('#form-holder').html();

      if( form_data !== '' )
      {
        var old_form_data = JSON.parse( form_data );
        var overlay_form = $(overlay).find('.overlay-form > form');

        if( $(CURRENT_OVERLAY.closer).hasClass('save-form') )
        {
          update_form(overlay_form, old_form_data);
        }
      }

      CURRENT_OVERLAY.closer = "";
      WORKFLOW_GRAPH.collapseAllItems();
      $(overlay).html(""); //clear it out
    }
  };

  var setup_tabs = function(content){
    var tabs = $(content).find('.formTabs');

    var divs = $(content).find('div.formPane .item-properties');
    var advanced = is_advanced_mode();

    $(divs).each(function() {
      if( advanced === false )
      {
        if( $(this).hasClass('advanced') )
        {
          //continue
          return true;
        }
      }
      $(tabs).append('<li><a href="#" class="btn">' + $(this).find('legend').text() + '</a></li>');
    });

    //The jQuery tools tab tool is a little picky, so we have to wrap
    //the form panes with a div to designate them as a "pane"
    $(content).find('.item-properties').wrapInner('<div>');
    $(content).find('.formTabs').tabs('.formPane > div');
  };

  var setup_overlays = function(content){

    var dialogs = {};

    if( typeof(content) != 'undefined' )
    {
      dialogs = $(content).find('a.dialog-box');
    }
    else
    {
      dialogs = $('a.dialog-box');
    }

    OVERLAYS = [];
    $(dialogs).each(function(){
      OVERLAYS[OVERLAYS.length] = $(this).overlay(overlay_settings);
    });
  };

  var retrieve_selected_workflow = function(){

    return $("#selected-workflow").val();
  };

  var retrieve_form_data = function(form){
    form = $(form);

    var input_tags = form.find(':input');
    var data = {};

    for(var i=0; i < input_tags.length; i++){
      var el = input_tags[i];
      var input = $(el);

      if(el.tagName == "INPUT"){
        var type = el.type;
        if(type !== undefined){
          type = type.toLowerCase();
          if(['checkbox', 'radio'].contains(type) && input[0].checked){

            data[el.name] = input.val();
          }else if(type == "text" || type == "hidden"){
            data[input.attr('name')] = input.val();
          }
        }
      }else if(el.tagName == "SELECT"){
        var options = input.find('option:selected');
        var res = '';

        for(var j=0; j < options.size(); j++){
          var option = options.eq(j);
          res += option.attr('value') + ',';
        }

        if(res.length > 0){
          res = res.substring(0, res.length-1); //remove comma
          data[input.attr('name')] = res;
        }
      }else{
        data[input.attr('name')] = input.val();
      }
    }

    if(data['selected-workflow'] === undefined){
      data['selected-workflow'] = retrieve_selected_workflow();
    }

    data.ajax = 'true';
    return data;
  };

  var parse_data = function(data){
    if(typeof data == "string"){
      try{//try to parse if it's not already done...
        data = $.parseJSON(data);
      }catch(e){
        try{
          data = eval("(" + data + ")");
        }catch(e){
          //do nothing
        }
      }
    }
    return data;
  };

  var reload = function(data){
    $.ajax({
      url : '@@workflowmanager-content',
      data : {'selected-workflow' : retrieve_selected_workflow()},
      type : 'POST',
      complete : function(request, textStatus){

        if(!is_advanced_mode()){
          $('.advanced').hide();
        }

        if( $('#changed-forms').children().length <= 0 )
        {
          $('#save-all-button').removeClass('btn-danger');
        }

        $('[rel=popover]').popover({placement: 'bottom'});

        WORKFLOW_GRAPH.updateGraph(request.responseText, data.graphChanges);
      }
    });

    setup_overlays();
  };

  var save = function(finish){
    var dirty_items = $("#changed-forms").children();

    var request_count = 0;

    //We look in changed forms to grab all the form data that we've changed
    //Then, we temporarily load it into the temp form, and submit it view ajax
    $(dirty_items).each(function() {

      var form = $(this).html();
      //The data-element-id field should be in the format of:
      //type-id (ex: state-published)
      //So, we grab the first token before the - to determine the
      //type
      var type = $(this).attr('data-element-id').split('-')[0];

      var form_name = "#json-" + type + "-form";

      var json_form = $(form_name);

      if( json_form.length < 1 ) {
        //In the case that we somehow grab an invalid form item,
        //we just skip over it.
        return true;
      }

      $(json_form).find('input').val(form);

      var data = retrieve_form_data(json_form);

      $.ajax({
        url : json_form.attr('action'),
        data : data,
        type: 'POST',
        success : function(data){
          request_count += 1;
          WORKFLOW_GRAPH.updateGraph( parse_data(data) );

          if(request_count == dirty_items.length){

            finish(data);
          }
        }
      });

    });

    if(dirty_items.length === 0){
      //clear it out even if nothing is saved...
      spinner.hide();
      $('#save-all-button').removeClass('btn-danger');
    }
  };

  $('#save-all-button,input.save-all').on('click', function(e){
      spinner.show();
      save(function(){
        // #TODO Add support for i18n
        status_message("The workflow has been successfully updated.");
        spinner.hide();
      });
      return e.preventDefault();
  });

  var has_action_submit = function(content){
    /* Check if there is an action submit button the page.
    If there is, we know we can actually have a reason to close
    the overlay form at one point */
    return content.find('input[type="submit"][name="form.button.Save"]').size() > 0 ||
        content.find('input[type="submit"][name="form.button.Cancel"]').size() > 0 ||
        content.find('input[type="submit"][name^="form.actions."]').size() > 0;
  };

  var ajax_form = function(form, e, callback){
    var data = retrieve_form_data(form);

    $.ajax({
      url : form.attr('action'),
      context : form,
      data : data,
      complete : function(request, textStatus){
        var form = this;
        var data = request.responseText;
        data = parse_data(data);

        if(data.status === undefined){
          /*
          No ajax reponse. Handle it like an actual page response.
          Cases:
          1. Action submit button used to submit is again in response and
              there are errors in the response = load overlay
          2. Resulting form does not have an action button = close overlay
          3. Result did not use a form action to submit and there is
              an action button in the response = load overlay
          */
          var submitvalue = form.find(':input.submitvalue');
          var content = $(data);
          if(has_action_submit(content) && content.find('#content div.field.error,#region-content div.field.error').size() > 0){
            load_overlay(content, '#content,#region-content');
          }else if(!submitvalue.attr('name').match(/^(form\.actions|form\.button)/) && has_action_submit(content)){
            load_overlay(content, '#content,#region-content');
          }else{
            callback(data);
          }
        }else if(data.status == 'error'){
          /* Check for form errors and apply them. */
          form.find('div.fieldErrorBox').remove();
          form.find('div.field.error').removeClass('error');

          for(var i = 0; i < data.errors.length; i++){
            var error_obj = data.errors[i];
            var input_name = error_obj[0];
            var error_msg = error_obj[1];
            var input = form.find("input[name='" + input_name + "'],textarea[name='" + input_name + "']");

            if(!input.parent().hasClass('error')){
              input.before('<div class="fieldErrorBox">' + error_msg + '</div>');
              input.parent().addClass('error');
            }
          }
          // #TODO Add support for i18n
          status_message("You have errors that you need to correct.");
          spinner.hide();
        }else if(data.status == 'redirect'){
          window.location = data.location;
        }else if(data.status == 'load'){
          /* load a remote url into the overlay */
          $.ajax({
            url : data.url,
            complete : function(request, textStatus){
              var content = $(request.responseText);
              if(has_action_submit(content)){
                load_overlay(content, '#content,#region-content');
                spinner.hide();
              }else{
                callback(data);
              }
            }
          });
        }else{
          if(data.message !== undefined){
            status_message(data.message);
          }
          callback(data);
        }
      }
    });
  };

  //Here, we compare the form data to what it was originally, to detect any changes.
  //The old form data is stored in #form-holder, as a JSON string.
  var update_form = function(form, original){

    var items = $(form).find(':input');
    var changed = false;

    var parent = original['parent-element'];

    var changes = {};

    $(items).each(function() {
      var self = this;

      var name = $(self).attr('name');
      var selector = ':input[name="' + name + '"]';
      var old = original[name];

      var type = $(self).prop('type');

      if( type === "button" ) {
        //The .each() interprets this as a "continue";
        return true;
      }

      //If the value isn't filled in, there won't be a cooresponding entry in
      //the "original" object. However, this is still a valid value.
      if( old === undefined ) {
        if( $(self).val() === "" ) {
          old = "";
        }
      }

      var checkbox = ( $(self).attr('type') == 'checkbox' );

      if( $(self).val() != old || checkbox ) {

        //If it's a checkbox, we need to handle things a bit differently, since
        //the .val() method doesn't give us what we're looking for.
        if( checkbox ) {

          var checked = $(self).prop('checked');

          if( old != 'on' ) {
            if( checked === true || checked == 'checked' ) {
              changes[name] = 'on';
              changed = true;
            }
          }else if(old == 'on' ){
            if( checked === undefined || checked === false ) {
              changes[name] = 'off';
              changed = true;
            }
          }else{
            //Nothing has changed, continue.
            return true;
          }
        }else{
          //This is a "normal" form value, so we can just use .val()
          changes[name] = $(self).val();
          changed = true;
        }

        if( changed ) {
          $(original).find('#' + parent).addClass('dirty');
          $('#save-all-button').addClass('btn-danger');
        }
      }
    });

    //If there as a change made to the graph, put it in the
    //#changed-forms div, so we can potentially save the changes later.
    if( changed && $.isEmptyObject(changes) === false ) {

      //If we've already stored changes to the form, save the form data there
      var previously_saved_form = $('#changed-forms').find('div[data-element-id="' + parent + '"]');

      var out = retrieve_form_data(form);
      out = JSON.stringify(out);

      if( $(previously_saved_form).length === 0 ) {
        $('#changed-forms').append('<div data-element-id="' + parent + '">' + out + '</div>');
      }else{
        $(previously_saved_form).html(out);
      }

    }
  };

  var handle_advanced = function(content) {

    var advanced = {};

    if( content )
    {
      advanced = $(content).find('.advanced');
    }
    else
    {
      advanced = $('.advanced');
    }

    var toppanel = $("#tabs-menu ul.tabs");

    if(is_advanced_mode()){
      $("div#advanced-mode input").prop('checked', true);
    }else{
      $(advanced).hide();
    }
  };

  $("div.dialog-box form input[type='submit'],#content form fieldset div input[type='submit']").on('click', function(e){
    var submit = $(this);
    var form = submit.parents('form');
    var hidden_value = form.find(':input.submitvalue');
    if(hidden_value.size() === 0){
      hidden_value = $('<input type="hidden" class="submitvalue" />');
      form.prepend(hidden_value);
    }

    hidden_value.attr('name', submit.attr('name'));
    hidden_value.attr('value', submit.attr('value'));

    spinner.show();

    ajax_form(form, e, function(data){
      if(CURRENT_OVERLAY === null){
        window.location = get_url();
        return;
      }
      CURRENT_OVERLAY.close();

      WORKFLOW_GRAPH.updateGraph(data);
      setup_overlays();
      spinner.hide();
    });

    //I'm not yet sure why, but in certain instances, the "cancel"
    //button will leave the overlays in a broken state unless we also
    //click the close button as well.
    if( $(this).attr('name') == "form.actions.cancel" )
    {
      $('#pb_99999').find('.close').click();
    }

    return e.preventDefault();
  });

  var overlay_close = function(element) {
    if( $(element).hasClass('save-form') ) {
      CURRENT_OVERLAY.closer = element;
    }
    CURRENT_OVERLAY.close();
  };

  $('div.overlay-form input.save-form, div.overlay-form input.cancel').bind('click', function(e) {
    overlay_close(this);
  });

  //all the initial page load stuff goes here.
  var init = function(){
    setup_overlays();
    setup_tabs();

    //enable advanced mode on page load
    //so it isn't available for non-js users--oh well.
    var toppanel = $("#tabs-menu ul.tabs");

    $("div#advanced-mode").change(function(){
      var checkbox = $(this).find('input');
      set_advanced_mode(checkbox.prop('checked'));
    });

    $('div.container').css('width', '100%');

    handle_advanced();

    //Set some things up only if js is enabled here
    $("#tabs-menu ul.tabs").addClass('enabled');

    $('#portal-column-content').addClass('cell width-full position-0');

    $(window).scroll(function(e){
      var menu_container = $('div#menu-container');
      var container_offset = menu_container.offset();
      if(container_offset === null){
        //it's possible that scroll is happening with overlay
        //and there is no menu container here...
        return;
      }

      var tabs_menu = $("#tabs-menu");
      var offset = tabs_menu.offset();

      if(window.pageYOffset > container_offset.top){
        tabs_menu.addClass('subnav-fixed');
      }else{
        tabs_menu.removeClass('subnav-fixed');
      }
    });
    $('#save-all-button').popover({trigger: 'manual', placement: 'bottom'});
    $('[rel=popover]').popover({placement: 'bottom'});
    $('#content').on('click', '.item-header li.related-items a', function(){ return false; });
    jsPlumb.ready(function() {
          WORKFLOW_GRAPH = new WorkflowGraph();
          WORKFLOW_GRAPH.buildGraph();
          jsPlumb.show();
    });
  };
  init();

});
})(jQuery);
