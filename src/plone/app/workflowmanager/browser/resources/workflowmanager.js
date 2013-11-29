var CURRENT_OVERLAY = null;
var OVERLAYS = [];

Array.prototype.contains = function(item){
  for(var i = 0; i < this.length; i++){
    if(this[i] == item){
      return true;
    }
  }
  return false;
}

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
    if (document.cookie && document.cookie != '') {
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
  }

  var tool_tip_settings = {
    relative : true,
    delay : 200,
    predelay: 300
  }

  var set_advanced_mode = function(advanced){
    if(advanced){
      $(".advanced").show();
      $.cookie("workflowmanager-advanced", true, { expires : 365 });
    }else{
      $(".advanced").hide();
      $.cookie("workflowmanager-advanced", null);
    }
  }

  //display our status message in a pretty way.
  var status_message = function(msg){
    var status = $('#save-all-button');
    status.attr('data-content', msg);
    status.popover('show');
    setTimeout(function(){
      $('#save-all-button').popover('hide');
    }, 1500);
  }

  //returns the url for a given workflow
  var get_url = function(){
    var url = $('base').attr('href') + "@@workflowmanager";
    var ele = jQuery("input[name='selected-workflow']");
    if(ele.size() > 0){
      url = url + "?selected-workflow=" + ele.val();
    }
    return url;
  }

  //get the variables encoded in a url
  var get_url_vars = function(url){
    var vars = {}, hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++){
      hash = hashes[i].split('=');
      vars[hash[0]] = hash[1];
    }
    return vars;
  }

  // goes directly to a state or transition
  // the state or transition are encoded in
  // the url with ?selected-state=foobar
  var goto_item = function(url){
    var vars = get_url_vars(url);

    var transitions_button = $("a#fieldsetlegend-transitions");
    var states_button = $("a#fieldsetlegend-states");
    var transitions = $("#fieldset-transitions");
    var states = $('#fieldset-states');

    if(CURRENT_OVERLAY != null && CURRENT_OVERLAY.isOpened()){
      CURRENT_OVERLAY.close();
    }

    var prefix = "#";

    if(vars['selected-state'] != undefined){
      prefix += "state-" + vars['selected-state'];
      if(!states_button.hasClass('selected')){
          states.show();
          transitions.hide();
          states_button.addClass('selected');
          transitions_button.removeClass('selected');
      }
    }else if(vars['selected-transition'] != undefined){
      prefix += "transition-" + vars['selected-transition'];
      if(!transitions_button.hasClass('selected')){
        transitions.show();
        states.hide();
        transitions_button.addClass('selected');
        states_button.removeClass('selected');
      }
    }else{
      return;
    }

    var obj = $(prefix);

    if(obj.hasClass('collasped')){
      obj.find('.hidden-content').slideDown();
      show_item(obj);
    }

    var offset = obj.offset().top - 50;
    $('html,body').animate({scrollTop: offset}, 1000);
  }

  var has_dirty_items = function(){
    var dirty_items = $("div.workflow-item.dirty");
    return dirty_items.size() > 0;
  }

  var strip_vars = function(url){
    var index = url.lastIndexOf('?');
    if(index == -1){
      return url;
    }else{
      return url.substring(0, index);
    }
  }

  var load_overlay = function(content, selector){
    $('#pb_99999 .pb-ajax').html(""); //clear it out
    var inside = content.find(selector);
    if(inside.size() == 0){
      inside = content; //if can't find inner element, just show all.
    }
    $('#pb_99999 .pb-ajax').wrapInner(inside);
    $('#pb_99999 .pb-ajax').find(selector).addClass(CURRENT_OVERLAY.getTrigger().attr('class'));
  }

  // Our overlay settings that automatically load remote content
  // and clear it out when it closes
  var overlay_settings = {
    onBeforeLoad: function() {
      spinner.show();
      CURRENT_OVERLAY = this;
      var wrap = $('#pb_99999 .pb-ajax');
      var trigger = this.getTrigger();
      var url = trigger.attr("href");
      var content_selector = trigger.attr('target');
      if(content_selector == undefined || ['', '_blank', '_parent', '_self', '_top'].contains(content_selector.toLowerCase())){
        content_selector = 'div.dialog-box';
      }
      var data = get_url_vars(url);
      data['ajax'] = true;

      url = strip_vars(url);

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
    onClose : function(){
        $('#pb_99999 .pb-ajax').html(""); //clear it out
    }
  };

  var setup_overlays = function(){
    OVERLAYS = [];
    $('a.dialog-box').each(function(){
      OVERLAYS[OVERLAYS.length] = $(this).overlay(overlay_settings);
    });
  }

  var retrieve_selected_workflow = function(){
    return $("#selected-workflow").val();
  }

  var retrieve_form_data = function(form){
    form = $(form);

    var input_tags = form.find(':input');
    var data = {};

    for(var i=0; i < input_tags.length; i++){
      var el = input_tags[i];
      var input = $(el);

      if(el.tagName == "INPUT"){
        var type = el.type;
        if(type != undefined){
          type = type.toLowerCase();
          if(['checkbox', 'radio'].contains(type) && input[0].checked){
            data[input.attr('name')] = input.val();
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

    if(data['selected-workflow'] == undefined){
      data['selected-workflow'] = retrieve_selected_workflow();
    }

    data['ajax'] = 'true';
    return data;
  }

  var show_item = function(obj){
    obj = $(obj);
    obj.removeClass('collasped');
    obj.addClass('expanded');
  }

  var hide_item = function(obj){
    obj = $(obj);
    obj.removeClass('expanded');
    obj.addClass('collasped');
  }

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
    return data
  }

  var handle_actions = function(data){
    data = parse_data(data)
    if(data.status != undefined){
      if(data.status == 'slideto'){
        goto_item(data.url);
      }
    }
  }

  var reload = function(data){
    $.ajax({
      url : '@@workflowmanager-content',
      data : {'selected-workflow' : retrieve_selected_workflow()},
      type : 'POST',
      complete : function(request, textStatus){
        var items = $('.workflow-item');
        var expanded_ids = [];
        var collasped_ids = [];

        for(var i = 0; i < items.length; i++){
          var item = items.eq(i);
          var id = item.attr('id');

          if(id.length > 0){
            if(item.hasClass('expanded')){
              expanded_ids[expanded_ids.length] = id;
            }else{
              collasped_ids[collasped_ids.length] = id;
            }
          }
        }

        $('#workflow-content').replaceWith(request.responseText);
        setup_overlays();

        if(!is_advanced_mode()){
          $('.advanced').hide();
        }

        for(var i = 0; i < expanded_ids.length; i++){
          var obj = $("#" + expanded_ids[i]);
          obj.find('.hidden-content').css('display', 'block');
          show_item(obj);
        }
        for(var i = 0; i < collasped_ids.length; i++){
          var obj = $("#" + collasped_ids[i]);
          obj.find('.hidden-content').css('display', 'none');
          hide_item(obj);
        }

        //for .workflow-item that are neither shown or collasped
        //but shown by default because that's how they come from
        //the server, just show
        jQuery('div.collasped.workflow-item div.hidden-content:visible').each(function(){
          var obj = $(this).parent('div.workflow-item');
          show_item(obj);
        });

        var transitions = $("#fieldset-transitions");
        var transitions_button = $("a#fieldsetlegend-transitions");
        var states = $("#fieldset-states");
        var states_button = $("a#fieldsetlegend-states");

        if(transitions_button.hasClass('selected')){
          states.css('display', 'none');
        }else{
          transitions.css('display', 'none');
        }

        handle_actions(data);
        $('#save-all-button').removeClass('btn-danger');
        $('[rel=popover]').popover({placement: 'bottom'});
      }
    });
  }

  var save = function(finish){
    var dirty_items = $("div.workflow-item.dirty");

    var request_count = 0;
    for(var i=0; i < dirty_items.length; i++){
      var item = dirty_items.eq(i);
      var form = item.find('form');
      var data = retrieve_form_data(form);
      $.ajax({
        url : form.attr('action'),
        data : data,
        type: 'POST',
        success : function(data){
          request_count += 1;
          if(request_count == dirty_items.length){
            reload(data);
            finish(data);
          }
        }
      });
    }

    if(dirty_items.length == 0){
      //clear it out even if nothing is saved...
      spinner.hide();
      $('#save-all-button').removeClass('btn-danger');
    }
  }

  $('.workflow-item .dropdown').live('click', function(e){
    var obj = $(this).parents('.workflow-item');
    if(obj.hasClass('collasped')){
      obj.find('.hidden-content').slideDown();
      show_item(obj);
    }else{
      obj.find('.hidden-content').slideUp();
      hide_item(obj);
    }
    return e.preventDefault();
  });

  $("a#fieldsetlegend-states").live('click', function(e){
    var transitions = $("#fieldset-transitions");
    var transitions_button = $("a#fieldsetlegend-transitions");
    var states = $("#fieldset-states");
    var states_button = $(this);

    if(transitions_button.hasClass('selected')){
      transitions_button.removeClass('selected');
      nortstar_container.css('height', nortstar_container.height());
      transitions.fadeOut('fast', function(){
        states.fadeIn('fast', function(){
          nortstar_container.css('height', '');
        });
        states_button.addClass('selected');
      });
    }else if(!states_button.hasClass('selected')){
      states.fadeIn('fast');
      states_button.addClass('selected');
    }
    return e.preventDefault();;
  });

  $("a#fieldsetlegend-transitions").live('click', function(e){
    var transitions = $("#fieldset-transitions");
    var transitions_button = $(this);
    var states = $("#fieldset-states");
    var states_button = $("a#fieldsetlegend-states");

    if(states_button.hasClass('selected')){
      states_button.removeClass('selected');
      nortstar_container.css('height', nortstar_container.height());
      states.fadeOut('fast', function(){
        transitions.fadeIn('fast', function(){
          nortstar_container.css('height', '');
        });
        transitions_button.addClass('selected');
      });
    }else if(!transitions_button.hasClass('selected')){
      transitions.fadeIn('fast');
      transtiions_button.addClass('selected');
    }
    return e.preventDefault();;
  });

  $('#save-all-button,input.save-all').live('click', function(e){
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
  }

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

        if(data.status == undefined){
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
          if(data.message != undefined){
            status_message(data.message);
          }
          callback(data);
        }
      }
    });
  }

  $("div.dialog-box form input[type='submit'],#content form fieldset div input[type='submit']").live('click', function(e){
    var submit = $(this);
    var form = submit.parents('form');
    var hidden_value = form.find(':input.submitvalue');
    if(hidden_value.size() == 0){
      hidden_value = $('<input type="hidden" class="submitvalue" />');
      form.prepend(hidden_value);
    }

    hidden_value.attr('name', submit.attr('name'));
    hidden_value.attr('value', submit.attr('value'));

    spinner.show();
    ajax_form(form, e, function(data){
      if(CURRENT_OVERLAY == null){
        window.location = get_url();
        return;
      }
      CURRENT_OVERLAY.close();

      reload(data);
      spinner.hide();
    });
    return e.preventDefault();
  });

  $('a.goto-link').live('click', function(e){
    var link = $(this);
    goto_item(link.attr('href'));
    return e.preventDefault();
  });

  $('input.one-or-the-other').live('change', function(){
    if(this.checked){
      $(this).siblings('input.the-other').eq(0)[0].disabled = true;
    }else{
      $(this).siblings('input.the-other').eq(0)[0].disabled = false;
    }
  });

  //all the initial page load stuff goes here.
  var init = function(){
    setup_overlays();
    $('div.hidden-content').css('display', 'none'); // since we don't hide it by default for js disable browsers
    $("#fieldset-transitions").css('display', 'none');
    $("a#fieldsetlegend-states").addClass('selected');

    // check if the user wanted to go directly to a certain
    // state or transition
    goto_item(window.location.href);

    //enable advanced mode on page load
    //so it isn't available for non-js users--oh well.
    var toppanel = $("#tabs-menu ul.tabs");

    toppanel.find("div#advanced-mode input").change(function(){
      set_advanced_mode(this.checked);
    });

    if(is_advanced_mode() && toppanel.size() == 1){
      $("#tabs-menu ul.tabs div#advanced-mode input")[0].checked = true;
    }else{
      $(".advanced").hide();
    }

    var input_selector = "div.workflow-item input[type=text],div.workflow-item input[type=checkbox],div.workflow-item textarea,div.workflow-item select";
    var input_change_handler = function(){
      var obj = $(this);
      obj.parents('div.workflow-item').addClass('dirty');
      $('#save-all-button').addClass('btn-danger');
    }
    //need to use different event for IE of course...
    var theevent = ($.browser.msie) ? 'click' : 'change';
    //Content change listeners to mark things as dirty and needing to be saved...
    $(input_selector).live(theevent, input_change_handler);

    //Set some things up only if js is enabled here
    $("#tabs-menu ul.tabs").addClass('enabled');

    $('#portal-column-content')[0].className = 'cell width-full position-0';

    $(window).scroll(function(e){
      var menu_container = $('div#menu-container');
      var container_offset = menu_container.offset();
      if(container_offset == null){
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
  }
  init();

});
})(jQuery);
