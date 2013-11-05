from urllib import urlencode
try:
    import json
except:
    import simplejson as json

from Acquisition import aq_get
from AccessControl import Unauthorized
from Products.Five.browser import BrowserView
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from zope.component import getUtility
from zope.component import getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
import zope.i18n

from Products.CMFCore.utils import getToolByName
from plone.memoize.view import memoize

from plone.app.workflowmanager.permissions import managed_permissions
from plone.app.workflowmanager.permissions import allowed_guard_permissions
from plone.app.workflowmanager.graphviz import HAS_GRAPHVIZ
from plone.app.workflowmanager.actionmanager import ActionManager
from plone.app.workflowmanager import WMMessageFactory as _


plone_shipped_workflows = [
    'folder_workflow',
    'intranet_folder_workflow',
    'intranet_workflow',
    'one_state_workflow',
    'plone_workflow',
    'simple_publication_workflow',
    'comment_review_workflow']


class Base(BrowserView):
    """
    We have so many different page templates so that they can
    be rendered independently of each of for ajax calls.
    It's also nice to break of the huge template files too.

    Form Action Guidelines...

    You can provide an ajax parameters set to true to specify
    that the form is being handled by ajax.

    If this is not specified, the form will be redirected to
    the base workflow form.

    Form validation will also be done. If the request is an
    ajax one, the validation will be sent back, if everything
    went well and validated, it'll send a {'status' : 'ok'} back.
    """

    errors = {}
    next_id = None  # the id of the next workflow to be viewed
    label = _(u'Workflow Manager')
    description = _(u'Manage your custom workflows TTW.')
    wrapped_dialog_template = ViewPageTemplateFile(
        'templates/wrapped-dialog.pt')
    managed_permissions = managed_permissions

    @property
    @memoize
    def actions(self):
        return ActionManager()

    @property
    @memoize
    def allowed_guard_permissions(self):
        return allowed_guard_permissions

    @property
    @memoize
    def portal(self):
        utool = getToolByName(self.context, 'portal_url')
        return utool.getPortalObject()

    @property
    @memoize
    def portal_workflow(self):
        return getToolByName(self.context, 'portal_workflow')

    @property
    @memoize
    def available_workflows(self):
        return [w for w in self.workflows
            if w.id not in plone_shipped_workflows]

    @property
    @memoize
    def workflows(self):
        pw = self.portal_workflow
        ids = pw.portal_workflow.listWorkflows()
        return [pw[id] for id in sorted(ids)]

    @property
    @memoize
    def selected_workflow(self):
        selected = self.request.get('selected-workflow')
        if type(selected) == list and len(selected) > 0:
            selected = selected[0]

        if selected and selected in self.portal_workflow.objectIds():
            return self.portal_workflow[selected]

    @property
    @memoize
    def selected_state(self):
        state = self.request.get('selected-state')
        if type(state) == list and len(state) > 0:
            state = state[0]

        if state in self.selected_workflow.states.objectIds():
            return self.selected_workflow.states[state]

    @property
    @memoize
    def selected_transition(self):
        transition = self.request.get('selected-transition')
        if type(transition) == list and len(transition) > 0:
            transition = transition[0]

        if transition in self.selected_workflow.transitions.objectIds():
            return self.selected_workflow.transitions[transition]

    @property
    @memoize
    def available_states(self):
        wf = self.selected_workflow
        if wf is not None:
            states = [wf.states[state] for state in wf.states.objectIds()]
            states.sort(lambda x, y: cmp(x.title.lower(), y.title.lower()))
            return states
        else:
            return []

    @property
    @memoize
    def available_transitions(self):
        wf = self.selected_workflow
        if wf is not None:
            transitions = wf.transitions.objectIds()
            transitions = [wf.transitions[t] for t in transitions]
            transitions.sort(
                lambda x, y: cmp(x.title.lower(), y.title.lower()))
            return transitions
        else:
            return []

    def authorize(self):
        authenticator = getMultiAdapter((self.context, self.request),
                                        name=u"authenticator")
        if not authenticator.verify():
            raise Unauthorized

    def render_transitions_template(self):
        return self.workflow_transitions_template(
            available_states=self.available_states,
            available_transitions=self.available_transitions)

    def get_transition(self, id):
        if id in self.selected_workflow.transitions.objectIds():
            return self.selected_workflow.transitions[id]

    @property
    @memoize
    def assignable_types(self):
        vocab_factory = getUtility(IVocabularyFactory,
            name="plone.app.vocabularies.ReallyUserFriendlyTypes")
        types = []
        for v in vocab_factory(self.context):
            types.append(dict(id=v.value, title=v.title))

        def _key(v):
            return v['title']

        types.sort(key=_key)
        return types

    @property
    def assigned_types(self):
        types = []
        try:
            chain = self.portal_workflow.listChainOverrides()
            nondefault = [info[0] for info in chain]
            for type_ in self.assignable_types:
                if type_['id'] in nondefault:
                    chain = self.portal_workflow.getChainForPortalType(
                        type_['id'])
                    if len(chain) > 0 and chain[0] == \
                     self.selected_workflow.id:
                        types.append(type_)
        except:
            pass

        return types

    def get_transition_list(self, state):
        transitions = state.getTransitions()
        return [t for t in self.available_transitions if t.id in transitions]

    def get_state(self, id):
        if id in self.selected_workflow.states.objectIds():
            return self.selected_workflow.states[id]
        else:
            return None

    @property
    @memoize
    def next_url(self):
        return self.get_url()

    def get_url(self, relative=None, workflow=None, transition=None,
                state=None, **kwargs):
        url = self.context.absolute_url()
        if relative:
            url = url + '/' + relative.lstrip('/')
        else:
            url = url + '/@@workflowmanager'

        params = {}
        if not workflow:
            if self.next_id:
                params['selected-workflow'] = self.next_id
            elif self.selected_workflow:
                params['selected-workflow'] = self.selected_workflow.id
        else:
            params['selected-workflow'] = workflow.id

        if transition:
            params['selected-transition'] = transition.id

        if state:
            params['selected-state'] = state.id

        params.update(kwargs)

        if len(params) > 0:
            url = url + "?" + urlencode(params)

        return url

    @memoize
    def getGroups(self):
        gf = aq_get(self.context, '__allow_groups__', None, 1)
        if gf is None:
            return ()
        try:
            groups = gf.searchGroups()
        except AttributeError:
            return ()
        else:
            return groups

    @property
    @memoize
    def context_state(self):
        return getMultiAdapter((self.context, self.request),
            name=u'plone_portal_state')

    def wrap_template(self, tmpl, **options):
        ajax = self.request.get('ajax', None)
        if ajax:
            return tmpl(options=options)
        else:
            return self.wrapped_dialog_template(content=tmpl, options=options)

    @property
    def has_graphviz(self):
        return HAS_GRAPHVIZ

    def handle_response(self, message=None, tmpl=None, redirect=None,
                        load=None, justdoerrors=False, slideto=False,
                        **kwargs):
        ajax = self.request.get('ajax', None)
        status = {'status': 'ok'}
        if len(self.errors) > 0:
            status['status'] = 'error'
            if ajax:
                status['errors'] = [[k, v] for k, v in self.errors.items()]
            else:
                status['errors'] = self.errors
        elif redirect:
            status['status'] = 'redirect'

            if type(redirect) in (str, unicode):
                status['location'] = redirect
            else:
                status['location'] = self.next_url

        elif slideto:
            status['status'] = 'slideto'
            # either state or transition here...
            status['url'] = self.get_url(**kwargs)
        elif load:
            status['status'] = 'load'
            status['url'] = load
        else:
            status['status'] = 'ok'

        if message:
            status['message'] = zope.i18n.translate(message, context=self.request)

        if ajax:
            self.request.response.setHeader('X-Theme-Disabled', 'True')
            if tmpl and not justdoerrors:
                return tmpl.__of__(self.context)(**kwargs)
            else:
                return json.dumps(status)
        else:
            if redirect:
                return self.request.response.redirect(status['location'])
            elif status['status'] == 'load':
                return self.request.response.redirect(status['url'])
            elif tmpl:
                return self.wrap_template(tmpl, **kwargs)
            else:
                return self.request.response.redirect(self.next_url)


class ControlPanel(Base):
    template = ViewPageTemplateFile('templates/controlpanel.pt')
    content_template = ViewPageTemplateFile('templates/content.pt')
    workflow_states_template = \
        ViewPageTemplateFile('templates/workflow-states.pt')
    workflow_state_template = \
        ViewPageTemplateFile('templates/workflow-state.pt')
    workflow_transitions_template = \
        ViewPageTemplateFile('templates/workflow-transitions.pt')
    workflow_transition_template = \
        ViewPageTemplateFile('templates/workflow-transition.pt')

    def __call__(self):
        return self.template()

    def render_content_template(self):
        return self.content_template()

    def render_states_template(self):
        return self.workflow_states_template(
            available_states=self.available_states,
            available_transitions=self.available_transitions)

    def retrieve_item(self):
        state = self.selected_state
        transition = self.selected_transition

        if state:
            return self.workflow_state_template(state=state,
                available_transitions=self.available_transitions)
        elif transition:
            return self.workflow_transition_template(transition=transition,
                available_states=self.available_states)
