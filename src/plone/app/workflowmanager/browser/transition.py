from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from Products.DCWorkflow.Transitions import TRIGGER_AUTOMATIC
from Products.DCWorkflow.Transitions import TRIGGER_USER_ACTION

from plone.app.workflowmanager.browser.controlpanel import Base
from plone.app.workflowmanager.utils import clone_transition
from plone.app.workflowmanager.browser import validators
from plone.app.workflowmanager.permissions import allowed_guard_permissions

from plone.app.workflowmanager import WMMessageFactory as _
import json


class AddTransition(Base):
    template = ViewPageTemplateFile('templates/add-new-transition.pt')
    new_transition_template = ViewPageTemplateFile('templates/transition.pt')

    def __call__(self):
        self.errors = {}

        if not self.request.get('form.actions.add', False):
            return self.handle_response(tmpl=self.template)
        else:
            self.authorize()
            transition = validators.not_empty(self, 'transition-name')
            transition_id = validators.id(self, 'transition-name',
                self.selected_workflow.transitions)

            if not self.errors:
                # must have transition to go on
                workflow = self.selected_workflow

                workflow.transitions.addTransition(transition_id)
                new_transition = workflow.transitions[transition_id]
                clone_of_id = self.request.get('clone-from-transition')
                new_transition.title = transition

                if clone_of_id:
                    # manage_copy|paste|clone doesn't work?
                    clone_transition(new_transition,
                        workflow.transitions[clone_of_id])
                else:
                    new_transition.actbox_name = transition
                    new_transition.actbox_url = \
    "%(content_url)s/content_status_modify?workflow_action=" + transition_id
                    new_transition.actbox_category = 'workflow'
                    new_transition.script_name = ''
                    new_transition.after_script_name = ''

                # if added from state screen
                referenced_state = self.request.get('referenced-state', None)
                if referenced_state:
                    state = self.selected_workflow.states[referenced_state]
                    state.transitions += (new_transition.id, )

                arbitraryTransitionList = []
                arbitraryTransitionList.append(new_transition)

                new_element = self.new_transition_template(transitions=arbitraryTransitionList)

                updates = dict()
                updates['objectId'] = new_transition.id
                updates['element'] = new_element
                updates['action'] = u'add'
                updates['type'] = u'transition'

                return self.handle_response(
                    message=_('msg_transition_created',
                        default=u'"${transition_id}" transition successfully created.',
                        mapping={'transition_id': new_transition.id}),
                    graph_updates=updates,
                    transition=new_transition)
            else:
                return self.handle_response(tmpl=self.template,
                                            justdoerrors=True)


class SaveTransition(Base):

    transition_template = ViewPageTemplateFile('templates/transition.pt')
    def update_guards(self):
        wf = self.selected_workflow
        transition = self.selected_transition
        guard = transition.getGuard()

        perms = []
        for key, perm in allowed_guard_permissions(wf.getId()).items():
            key = 'transition-%s-guard-permission-%s' % (transition.id, key)
            if key in self.request and perm not in guard.permissions:
                perms.append(perm)
        guard.permissions = tuple(perms)

        roles = validators.parse_set_value(self, 'transition-%s-guard-roles' %
            transition.id)
        okay_roles = set(wf.getAvailableRoles())
        guard.roles = tuple(roles & okay_roles)

        groups = validators.parse_set_value(self,
            'transition-%s-guard-groups' %
                transition.id)
        okay_groups = set([g['id'] for g in self.getGroups()])
        guard.groups = tuple(groups & okay_groups)

        transition.guard = guard

    def update_transition_properties(self):
        transition = self.selected_transition

        if ('transition-%s-autotrigger' % transition.id) in self.request:
            transition.trigger_type = TRIGGER_AUTOMATIC
        else:
            transition.trigger_type = TRIGGER_USER_ACTION

        if ('transition-%s-display-name' % transition.id) in self.request:
            transition.actbox_name = \
                self.request.get('transition-%s-display-name' % transition.id)

        if ('transition-%s-new-state' % transition.id) in self.request:
            transition.new_state_id = \
                self.request.get('transition-%s-new-state' % transition.id)

        if ('transition-%s-title' % transition.id) in self.request:
            transition.title = \
                self.request.get('transition-%s-title' % transition.id)

        if ('transition-%s-description' % transition.id) in self.request:
            transition.description = \
                self.request.get('transition-%s-description' % transition.id)

        for state in self.available_states:
            key = 'transition-%s-state-%s-selected' % (transition.id, state.id)
            if key in self.request:
                if transition.id not in state.transitions:
                    state.transitions += (transition.id, )
            else:
                if transition.id in state.transitions:
                    transitions = list(state.transitions)
                    transitions.remove(transition.id)
                    state.transitions = transitions

    def __call__(self):
        if self.request.get('form-box') is not None:
            form_data = self.request.get('form-box')
            form_data = json.loads(form_data)

            for name in form_data: 
                self.request[name] = form_data[name]

        self.authorize()
        self.errors = {}

        self.update_guards()
        self.update_transition_properties()

        wf = self.selected_workflow
        transition = self.selected_transition

        arbitraryTransitionList = []
        arbitraryTransitionList.append(transition)

        element = self.transition_template(transitions=arbitraryTransitionList)

        updates = dict()
        updates['objectId'] = transition.id
        updates['element'] = element
        updates['type'] = u'transition'
        updates['action'] = u'update'

        return self.handle_response(
                    graph_updates=updates)


class DeleteTransition(Base):
    template = ViewPageTemplateFile('templates/delete-transition.pt')

    def __call__(self):
        self.errors = {}
        transition = self.selected_transition
        transition_id = transition.id

        if self.request.get('form.actions.delete', False):
            self.authorize()
            #delete any associated rules also.
            self.actions.delete_rule_for(self.selected_transition)

            self.selected_workflow.transitions.deleteTransitions([transition_id])
            # now check if we have any dangling references
            for state in self.available_states:
                if transition_id in state.transitions:
                    transitions = list(state.transitions)
                    transitions.remove(transition_id)
                    state.transitions = tuple(transitions)

            updates = dict()
            updates['objectId'] = transition_id
            updates['action'] = u'delete'
            updates['type'] = u'transition'

            msg = _('msg_transition_deleted',
                    default=u'"${id}" transition has been successfully deleted.',
                    mapping={'id': transition_id})
            return self.handle_response(message=msg,
                                        graph_updates=updates)
        elif self.request.get('form.actions.cancel', False) == 'Cancel':
            msg = _('msg_deleting_canceled',
                    default=u'Deleting the "${id}" transition has been canceled.',
                    mapping={'id': transition_id})
            return self.handle_response(message=msg)
        else:
            return self.handle_response(tmpl=self.template)

class EditTransition(Base):
    template = ViewPageTemplateFile('templates/workflow-transition.pt')

    def __call__(self):
        wf = self.selected_workflow

        if (wf == None):
            return self.handle_response()

        transition = self.selected_transition

        if( transition == None ):
            return self.handle_response()

        states = self.available_states

        return self.render_transition_template(transition, states)

    def render_transition_template(self, transition, states):
        return self.template(transition=transition,
            available_states=states)

