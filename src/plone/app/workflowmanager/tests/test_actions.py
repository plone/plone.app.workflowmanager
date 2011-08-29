import unittest2 as unittest

from plone.app.testing import PLONE_INTEGRATION_TESTING, TEST_USER_NAME, \
    login, ploneSite, quickInstallProduct

from layer import INTEGRATION_MANAGER_TESTING
from zope.publisher.browser import TestRequest
from plone.app.workflowmanager.browser.actions import AddActionView, DeleteActionView
from plone.app.workflowmanager.actionmanager import ActionManager
from plone.app.workflowmanager.tests import TestResponse


class TestActions(unittest.TestCase):

    layer = INTEGRATION_MANAGER_TESTING

    def test_adding_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = TestRequest(form={
            'form.actions.add' : 'Add',
            'selected-transition' : 'retract',
            'selected-workflow' : 'workflow-1'
        })
        view = AddActionView(portal, req)
        res = view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(rule is not None)

    def test_adding_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = TestRequest(form={
            'selected-transition': 'retract',
            'selected-workflow': 'workflow-1'
        })
        view = AddActionView(portal, req)
        try:
            res = view()
        except AttributeError, ex:
            self.assertTrue(ex.message == "'TestRequest' object has no attribute 'RESPONSE'")
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(rule is None)

    def test_accessing_adding_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = TestRequest(form={
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1'
        })
        view = DeleteActionView(portal, req)
        try:
            res = view()
        except AttributeError, ex:
            self.assertTrue(ex.message == "'TestRequest' object has no attribute 'RESPONSE'")
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(len(rule.actions) == 1)

    def test_removing_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = TestRequest(form={
            'form.actions.delete': 'Delete',
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1',
            'action_index': '0'
        })
        view = DeleteActionView(portal, req)
        res = view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(len(rule.actions) == 0)

    def test_cancel_removing_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = TestRequest(form={
            'form.actions.cancel': 'Cancel',
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1',
        })
        view = DeleteActionView(portal, req)
        res = view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(len(rule.actions) == 1)


def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
