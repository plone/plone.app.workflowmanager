from Persistence import PersistentMapping
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from plone.app.workflowmanager.utils import clone_state
from plone.app.workflow.remap import remap_workflow

from plone.app.workflowmanager.browser import validators
from plone.app.workflowmanager.permissions import managed_permissions
from plone.app.workflowmanager.browser.controlpanel import Base
from plone.app.workflowmanager import WMMessageFactory as _


class drawGraph(Base):
    template = ViewPageTemplateFile('templates/graph-workflow.pt')

    def __call__(self):
        self.errors = {}

        if not self.request.get('form.actions.add', False):
            return self.handle_response(tmpl=self.template)
        else:
            self.authorize()
            state = validators.not_empty(self, 'state-name')
            state_id = validators.id(self, 'state-name',
                                     self.selected_workflow)

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
                return self.handle_response(
                    message=msg,
                    slideto=True,
                    state=new_state)
            else:
                return self.handle_response(tmpl=self.template,
                    justdoerrors=True)