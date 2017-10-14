from plone.app.testing import TEST_USER_NAME, PLONE_FIXTURE, login, \
    IntegrationTesting, PloneSandboxLayer, applyProfile, setRoles, \
    TEST_USER_ID, TEST_USER_PASSWORD, FunctionalTesting

#from Products.CMFCore.utils import getToolByName
from zope.interface.declarations import alsoProvides
from zope.component import getUtility
from zope.configuration import xmlconfig
from zope.publisher.browser import TestRequest
from zope.annotation.interfaces import IAttributeAnnotatable

from plone.app.workflowmanager.browser.workflow import AddWorkflow
from plone.app.workflowmanager.browser.actions import AddActionView
from plone.app.workflowmanager.actionmanager import ActionManager
from plone.app.contentrules.actions.notify import NotifyAction
from plone.keyring.interfaces import IKeyManager

from plone.protect.authenticator import createToken

import unittest2 as unittest

try:
    from hashlib import sha1 as sha
except ImportError:
    import sha
import hmac


class ManagerFixture(PloneSandboxLayer):
    defaultBases = (PLONE_FIXTURE, )

    def setUpZope(self, app, configurationContext):
        # Load ZCML
        import plone.app.workflowmanager
        xmlconfig.file('configure.zcml',
            plone.app.workflowmanager, context=configurationContext)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'plone.app.workflowmanager:default')
        setRoles(portal, TEST_USER_ID, ['Manager', 'Owner'])
        import transaction
        transaction.commit()
        login(portal, TEST_USER_NAME)


MANAGER_FIXTURE = ManagerFixture()
INTEGRATION_MANAGER_TESTING = IntegrationTesting(
    bases=(MANAGER_FIXTURE, ), name='INTEGRATION_MANAGER_TESTING')
FUNCTIONAL_MANAGER_TESTING = FunctionalTesting(
    bases=(MANAGER_FIXTURE,), name="FUNCTIONAL_MANAGER_TESTING")


def browserLogin(portal, browser, username=None, password=None):
    handleErrors = browser.handleErrors
    try:
        browser.handleErrors = False
        browser.open(portal.absolute_url() + '/login_form')
        if username is None:
            username = TEST_USER_NAME
        if password is None:
            password = TEST_USER_PASSWORD
        browser.addHeader('Authorization',
            'Basic %s:%s' % (TEST_USER_NAME, TEST_USER_PASSWORD,))
    finally:
        browser.handleErrors = handleErrors


class BaseTest(unittest.TestCase):

    def setUp(self):
        portal = self.layer['portal']

        req = self.getRequest({'workflow-name': 'workflow-1',
            'form.actions.add': 'create',
            'clone-from-workflow': 'simple_publication_workflow'}, True)
        alsoProvides(req, IAttributeAnnotatable)
        AddWorkflow(portal, req)()

        # add some rules/actions
        req = self.getRequest({
            'form.actions.add': 'Add',
            'selected-transition': 'publish',
            'selected-state': 'published',
            'selected-workflow': 'workflow-1'}, True)
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

    def getRequest(self, form={}, authentic=False):
        if authentic:
            form['_authenticator'] = createToken()

        req = TestRequest(form=form, environ={
            'SERVER_URL': 'http://nohost',
            'HTTP_HOST': 'nohost'
        })
        alsoProvides(req, IAttributeAnnotatable)
        return req
