from plone.testing import Layer
from plone.testing import z2

from plone.app.testing import PLONE_INTEGRATION_TESTING, TEST_USER_NAME, \
    PLONE_FIXTURE, login, ploneSite, quickInstallProduct, IntegrationTesting, \
    PloneSandboxLayer, applyProfile, setRoles

from Products.CMFCore.utils import getToolByName
from zope.configuration import xmlconfig
from plone.app.workflowmanager.browser.workflow import AddWorkflow
from plone.app.workflowmanager.actionmanager import ActionManager
from plone.app.workflowmanager.browser.actions import AddActionView
from plone.app.contentrules.actions.notify import NotifyAction
from zope.publisher.browser import TestRequest

class ManagerFixture(PloneSandboxLayer):
    defaultBases = (PLONE_INTEGRATION_TESTING,)

    def setUpZope(self, app, configurationContext):
        # Load ZCML
        import plone.app.workflowmanager
        xmlconfig.file('configure.zcml', plone.app.workflowmanager, context=configurationContext)

    def setUpPloneSite(self, portal):
        setRoles(portal, TEST_USER_NAME, ['Manager'])
        login(portal, TEST_USER_NAME)
        req = TestRequest(form={
            'workflow-name' : 'workflow-1',
            'form.actions.add' : 'create',
            'clone-from-workflow' : 'simple_publication_workflow'
        })
        AddWorkflow(portal, req)()
        
        # add some rules/actions
        req = TestRequest(form={
            'form.actions.add' : 'Add',
            'selected-transition' : 'publish',
            'selected-state' : 'published',
            'selected-workflow' : 'workflow-1'
        })
        view = AddActionView(portal, req)
        view()
        self.selected_workflow = view.selected_workflow
        self.selected_transition = view.selected_transition
        self.selected_state = view.selected_state
        
        am = ActionManager()
        rule = am.get_rule(self.selected_transition)
        action = NotifyAction()
        action.message = 'foobar'
        action.message_type = 'info'
        rule.actions.append(action)
        
        

    def tearDownZope(self, app):
        pass


MANAGER_FIXTURE = ManagerFixture()
INTEGRATION_MANAGER_TESTING = IntegrationTesting(bases=(MANAGER_FIXTURE,), name='INTEGRATION_MANAGER_TESTING')