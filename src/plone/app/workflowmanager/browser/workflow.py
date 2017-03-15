from random import randint
from urllib import urlencode

from DateTime import DateTime
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from plone.app.workflowmanager.browser.controlpanel import Base
from plone.app.workflowmanager.graphviz import getGraph
from plone.app.workflowmanager.browser import validators
from plone.app.workflowmanager import WMMessageFactory as _


class DeleteWorkflow(Base):
    template = ViewPageTemplateFile('templates/delete-workflow.pt')

    def __call__(self):
        self.errors = {}

        self.can_delete = len(self.assigned_types) == 0

        if not self.can_delete:
            return self.handle_response(
                tmpl=self.template,
                message=_(u'You can not delete this workflow until no content '
                          u'types are specified to use this workflow.'))
        elif self.request.get('form.actions.delete', False) == 'Delete':
            self.authorize()
            #delete all rules also.
            for transition in self.available_transitions:
                self.actions.delete_rule_for(transition)

            self.portal_workflow.manage_delObjects([self.selected_workflow.id])
            return self.handle_response(redirect=True)
        elif self.request.get('form.actions.cancel', False) == 'Cancel':
            return self.handle_response()
        else:
            return self.handle_response(tmpl=self.template)


class AddWorkflow(Base):
    template = ViewPageTemplateFile('templates/add-new-workflow.pt')

    def __call__(self):
        self.errors = {}
        workflow = validators.not_empty(self, 'workflow-name')
        workflow_id = validators.id(self, 'workflow-name',
                                    self.portal_workflow)

        if not self.request.get('form.actions.add', False):
            return self.handle_response(tmpl=self.template)
        elif self.errors:
            return self.handle_response(tmpl=self.template, justdoerrors=True)
        else:
            self.authorize()
            # must have state to go on
            cloned_from_workflow = \
                self.portal_workflow[self.request.get('clone-from-workflow')]

            self.context.portal_workflow.manage_clone(cloned_from_workflow,
                workflow_id)
            new_workflow = self.context.portal_workflow[workflow_id]
            new_workflow.title = workflow
            self.next_id = new_workflow.id

            return self.handle_response(redirect=True)


class UpdateSecuritySettings(Base):
    template = ViewPageTemplateFile('templates/update-security-settings.pt')

    def __call__(self):
        if self.request.get('form.actions.confirm', False):
            self.authorize()
            count = self.portal_workflow._recursiveUpdateRoleMappings(
                self.portal,
                {self.selected_workflow.id: self.selected_workflow})
            return self.handle_response(
                        message=_('msg_updated_objects',
                                  default="Updated ${count} objects.",
                                  mapping={'count': count}))
        else:
            return self.handle_response(tmpl=self.template)


class Assign(Base):
    template = ViewPageTemplateFile('templates/assign.pt')

    def __call__(self):
        self.errors = {}

        if self.request.get('form.actions.next', False):
            self.authorize()
            params = urlencode({'type_id': self.request.get('type_id'),
                'new_workflow': self.selected_workflow.id})
            return self.handle_response(load=self.context_state.portal_url() +
                '/@@content-controlpanel?' + params)
        else:
            return self.handle_response(tmpl=self.template)


class SanityCheck(Base):
    template = ViewPageTemplateFile('templates/sanity-check.pt')

    def __call__(self):
        self.errors = {}
        states = self.available_states
        transitions = self.available_transitions
        self.errors['state-errors'] = []
        self.errors['transition-errors'] = []

        for state in states:
            found = False
            for transition in transitions:
                if transition.new_state_id == state.id:
                    found = True
                    break

            if self.selected_workflow.initial_state == state.id and \
             len(state.transitions) > 0:
                found = True

            if not found:
                self.errors['state-errors'].append(state)

        for transition in transitions:
            found = False
            if not transition.new_state_id:
                found = True

            for state in states:
                if transition.id in state.transitions:
                    found = True
                    break

            if not found:
                self.errors['transition-errors'].append(transition)

        state_ids = [s.id for s in states]
        if not self.selected_workflow.initial_state or \
          self.selected_workflow.initial_state not in state_ids:
            self.errors['initial-state-error'] = True

        self.has_errors = len(self.errors['state-errors']) > 0 or \
          len(self.errors['transition-errors']) > 0 or \
          'initial-state-error' in self.errors

        return self.handle_response(tmpl=self.template)


class Graph(Base):
    template = ViewPageTemplateFile('templates/diagram.pt')

    def __call__(self):
        # generate a random number ot prevent browser from caching this...
        self.random_number = str(randint(0, 999999999))
        return self.handle_response(tmpl=self.template)

    def image(self):
        resp = self.request.response
        resp.setHeader('Content-Type', 'image/gif')
        resp.setHeader('Last-Modified', DateTime().rfc822())
        graph = getGraph(self.selected_workflow)
        resp.setHeader("Content-Length", len(graph))
        return graph
