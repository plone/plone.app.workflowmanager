from Persistence import PersistentMapping
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from plone.app.workflowmanager.utils import clone_state
from plone.app.workflow.remap import remap_workflow

from plone.app.workflowmanager.browser import validators
from plone.app.workflowmanager.permissions import managed_permissions
from plone.app.workflowmanager.browser.controlpanel import Base
from plone.app.workflowmanager import WMMessageFactory as _
import json
from sets import Set


class AddState(Base):
    template = ViewPageTemplateFile('templates/add-new-state.pt')
    new_state_template = ViewPageTemplateFile('templates/state.pt')

    def __call__(self):
        self.errors = {}

        if not self.request.get('form.actions.add', False):
            return self.handle_response(tmpl=self.template)
        else:
            self.authorize()
            state = validators.not_empty(self, 'state-name')
            state_id = validators.id(self, 'state-name',
                                     self.selected_workflow.states)

            if not self.errors:
                # must have state to go on
                workflow = self.selected_workflow

                workflow.states.addState(state_id)
                new_state = workflow.states[state_id]
                clone_of_id = self.request.get('clone-from-state')
                if clone_of_id:
                    # manage_copy|paste|clone doesn't work?
                    clone_state(new_state, workflow.states[clone_of_id])

                new_state.title = state

                # if added from transition screen
                referenced_transition = self.request.get(
                    'referenced-transition', None)
                if referenced_transition:
                    new_state.transitions = \
                        new_state.transitions + (referenced_transition, )

                msg = _('msg_state_created',
                        default=u'"${state_id}" state successfully created.',
                        mapping={'state_id': new_state.id})

                arbitraryStateList = []
                arbitraryStateList.append(new_state)

                new_elements = self.new_state_template(states=arbitraryStateList)

                updates = dict()

                updates['element'] = new_elements
                updates['type'] = u'state'
                updates['action'] = u'add'
                updates['objectId'] = new_state.id
                updates['transitions'] = new_state.transitions

                return self.handle_response(
                    message=msg,
                    graph_updates=updates,
                    state=new_state)
            else:
                return self.handle_response(tmpl=self.template,
                    justdoerrors=True)


class DeleteState(Base):
    template = ViewPageTemplateFile('templates/delete-state.pt')

    def __call__(self):
        self.errors = {}
        state = self.selected_state
        transitions = self.available_transitions
        state_id = state.id

        self.is_using_state = False
        for transition in transitions:
            if transition.new_state_id == state_id:
                self.is_using_state = True
                break

        if self.request.get('form.actions.delete', False):
            self.authorize()
            if self.is_using_state:
                replacement = self.request.get('replacement-state',
                    self.available_states[0].id)
                for transition in self.available_transitions:
                    if state_id == transition.new_state_id:
                        transition.new_state_id = replacement

                chains = self.portal_workflow.listChainOverrides()
                types_ids = [c[0] for c in chains
                                if self.selected_workflow.id in c[1]]
                remap_workflow(self.context, types_ids,
                    (self.selected_workflow.id, ), {state_id: replacement})

            self.selected_workflow.states.deleteStates([state_id])

            updates = dict()
            updates['objectId'] = state_id
            updates['action'] = u'delete'
            updates['type'] = u'state'

            try:
                updates['replacement'] = replacement
            except UnboundLocalError:
                pass

            return self.handle_response(
                message=_('msg_state_deleted',
                    default=u'"${id}" state has been successfully deleted.',
                    mapping={'id': state_id}),
                graph_updates=updates)
        elif self.request.get('form.actions.cancel', False) == 'Cancel':
            return self.handle_response(
                message=_('msg_state_deletion_canceled',
                    default=u'Deleting the "${id}" state has been canceled.',
                    mapping={'id': state_id}))
        else:
            return self.handle_response(tmpl=self.template)


class SaveState(Base):

    updated_state_template = ViewPageTemplateFile('templates/state.pt')
    def update_selected_transitions(self):
        wf = self.selected_workflow
        state = wf.states[self.request.get('selected-state')]
        transitions = wf.transitions.objectIds()
        selected_transitions = []

        for transition in transitions:
            key = 'transition-%s-state-%s' % (transition, state.id)
            if key in self.request:
                selected_transitions.append(transition)
        state.transitions = tuple(selected_transitions)

    def update_state_permissions(self):
        wf = self.selected_workflow
        state = wf.states[self.request.get('selected-state')]
        perm_roles = PersistentMapping()
        available_roles = state.getAvailableRoles()

        for managed_perm in managed_permissions(wf.id):
            selected_roles = []
            for role in available_roles:
                key = 'permission-%s-role-%s-state-%s' % (
                    managed_perm['name'], role, state.id)
                if key in self.request:
                    selected_roles.append(role)

            acquire_key = 'permission-acquire-%s-state-%s' % (
                managed_perm['name'], state.id)
            if acquire_key in self.request:
                acquired = True
            else:
                acquired = False

            if len(selected_roles) > 0:
                if not acquired:
                    selected_roles = tuple(selected_roles)
                perm_roles[managed_perm['perm']] = selected_roles
                if managed_perm['perm'] not in wf.permissions:
                    wf.permissions = wf.permissions + (managed_perm['perm'], )
            elif managed_perm['perm'] in wf.permissions:
                # it's managed, no perms set, but still could save acquired
                if acquired:
                    perm_roles[managed_perm['perm']] = []
                else:
                    perm_roles[managed_perm['perm']] = ()
            elif not acquired:
                # not already managing perms, but no longer acquire permissions
                if managed_perm['perm'] not in wf.permissions:
                    wf.permissions = wf.permissions + (managed_perm['perm'], )
                perm_roles[managed_perm['perm']] = ()

        state.permission_roles = perm_roles

    def update_state_properties(self):

        wf = self.selected_workflow
        state = wf.states[self.request.get('selected-state')]

        if ('state-%s-initial-state' % state.id) in self.request:
            wf.initial_state = state.id

        title = self.request.get('state-%s-title' % state.id, False)
        if title:
            state.title = title

        description = self.request.get('state-%s-description' % state.id,
                                       False)
        if description:
            state.description = description

    def update_state_group_roles(self):
        wf = self.selected_workflow
        state = wf.states[self.request.get('selected-state')]

        group_roles = PersistentMapping()
        available_roles = state.getAvailableRoles()
        groups = self.getGroups()

        for group in groups:
            selected_roles = []

            for role in available_roles:
                key = "group-%s-role-%s-state-%s" % (
                    group['id'], role, state.id)
                if key in self.request:
                    selected_roles.append(role)
            if len(selected_roles) > 0:
                group_roles[group['id']] = tuple(selected_roles)

                if group['id'] not in wf.groups:
                    wf.groups = wf.groups + (group['id'], )
        state.group_roles = group_roles

    def __call__(self):
        if self.request.get('form-box') is not None:
            form_data = self.request.get('form-box')
            form_data = json.loads(form_data)

            for name in form_data: 
                self.request[name] = form_data[name]

        self.authorize()
        self.errors = {}

        wf = self.selected_workflow
        state = wf.states[self.request.get('selected-state')]

        oldTransitions = state.transitions

        self.update_selected_transitions()
        self.update_state_permissions()
        self.update_state_group_roles()
        self.update_state_properties()

        newTransitions = state.transitions

        arbitraryStateList = []
        arbitraryStateList.append(state)

        updated_state = self.updated_state_template(states=arbitraryStateList)

        #transitions that were added...
        add = list( Set(newTransitions) - Set(oldTransitions) )

        #transitions that were removed
        remove = list( Set(oldTransitions) - Set(newTransitions) )

        update = dict()
        update['objectId']=state.id
        update['action']=u'update'
        update['type']=u'state'
        update['element']=updated_state
        update['add'] = add
        update['remove'] = remove

        return self.handle_response(
            graph_updates=update)

class EditState(Base):
    template = ViewPageTemplateFile('templates/workflow-state.pt')

    def __call__(self):
        wf = self.selected_workflow

        if (wf == None):
            return self.handle_response()

        state = self.selected_state

        if( state == None ):
            return self.handle_response()

        transitions = self.available_transitions

        return self.render_state_template(state, transitions)

    def render_state_template(self, state, transitions):
        return self.template(state=state,
            available_transitions=transitions)
