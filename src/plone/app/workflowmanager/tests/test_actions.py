import unittest2 as unittest

from zope.component import getUtility, getMultiAdapter

from Products.CMFCore.utils import getToolByName

from plone.app.testing import TEST_USER_NAME
from plone.app.testing import login

from plone.contentrules.rule.interfaces import IRuleAction

from plone.app.workflowmanager.testing import INTEGRATION_MANAGER_TESTING
from plone.app.workflowmanager.testing import BaseTest
from plone.app.workflowmanager.browser.actions import AddActionView
from plone.app.workflowmanager.browser.actions import DeleteActionView
from plone.app.workflowmanager.actionmanager import ActionManager
from plone.app.workflowmanager.actionmanager import RuleAdapter


class TestActions(BaseTest):

    layer = INTEGRATION_MANAGER_TESTING

    def test_adding_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = self.getRequest({
            'form.actions.add': 'Add',
            'selected-transition': 'retract',
            'selected-workflow': 'workflow-1'}, True)
        view = AddActionView(portal, req)
        view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(rule is not None)

    def test_adding_action_fails(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = self.getRequest({
            'selected-transition': 'retract',
            'selected-workflow': 'workflow-1'}, True)
        view = AddActionView(portal, req)
        try:
            view()
        except AttributeError, ex:
            self.assertTrue("'TestRequest' object has no attribute 'RESPONSE'"
                            in str(ex))
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(rule is None)

    def test_accessing_adding_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1'}, True)
        view = DeleteActionView(portal, req)
        try:
            view()
        except AttributeError, ex:
            self.assertTrue("'TestRequest' object has no attribute 'RESPONSE'"
                            in str(ex))
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertTrue(len(rule.actions) == 1)

    def test_removing_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'form.actions.delete': 'Delete',
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1',
            'action_index': '0'}, True)
        view = DeleteActionView(portal, req)
        view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertEquals(len(rule.actions), 0)

    def test_cancel_removing_action(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'form.actions.cancel': 'Cancel',
            'selected-transition': 'publish',
            'selected-workflow': 'workflow-1'}, True)
        view = DeleteActionView(portal, req)
        view()
        am = ActionManager()
        rule = am.get_rule(view.selected_transition)
        self.assertEquals(len(rule.actions), 1)

    def test_action_manager_to_create_action(self):
        portal = self.layer['portal']
        am = ActionManager()
        pw = getToolByName(portal, 'portal_workflow')
        workflow = pw['simple_publication_workflow']
        transition = workflow.transitions['publish']
        am.delete_rule_for(transition)
        rule = am.create(transition)

        element = getUtility(IRuleAction, name='plone.actions.Copy')
        adding = getMultiAdapter((rule.rule, self.layer['request']),
                                 name='+action')
        addview = getMultiAdapter((adding, self.layer['request']),
                                  name=element.addview)

        addview.createAndAdd(data={'target_folder': '/target'})

        self.assertEquals(len(rule.actions), 1)

    def test_action_manager_get_action(self):
        portal = self.layer['portal']
        am = ActionManager()
        pw = getToolByName(portal, 'portal_workflow')
        workflow = pw['simple_publication_workflow']
        transition = workflow.transitions['publish']
        am.delete_rule_for(transition)
        rule = am.create(transition)

        element = getUtility(IRuleAction, name='plone.actions.Copy')
        adding = getMultiAdapter((rule.rule, self.layer['request']),
                                 name='+action')
        addview = getMultiAdapter((adding, self.layer['request']),
                                  name=element.addview)

        addview.createAndAdd(data={'target_folder': '/target'})

        ra = RuleAdapter(rule, transition)
        action = ra.get_action(0)
        self.assertEquals(action.element, 'plone.actions.Copy')

    def test_action_manager_action_index(self):
        portal = self.layer['portal']
        am = ActionManager()
        pw = getToolByName(portal, 'portal_workflow')
        workflow = pw['simple_publication_workflow']
        transition = workflow.transitions['publish']
        rule = am.create(transition)

        element = getUtility(IRuleAction, name='plone.actions.Copy')
        adding = getMultiAdapter((rule.rule, self.layer['request']),
                                 name='+action')
        addview = getMultiAdapter((adding, self.layer['request']),
                                  name=element.addview)

        addview.createAndAdd(data={'target_folder': '/target'})

        ra = RuleAdapter(rule, transition)
        action = ra.get_action(0)
        self.assertEquals(ra.action_index(action), 0)

    def test_action_manager_action_url(self):
        portal = self.layer['portal']
        am = ActionManager()
        pw = getToolByName(portal, 'portal_workflow')
        workflow = pw['simple_publication_workflow']
        transition = workflow.transitions['publish']
        rule = am.create(transition)

        element = getUtility(IRuleAction, name='plone.actions.Copy')
        adding = getMultiAdapter((rule.rule, self.layer['request']),
                                 name='+action')
        addview = getMultiAdapter((adding, self.layer['request']),
                                  name=element.addview)

        addview.createAndAdd(data={'target_folder': '/target'})

        ra = RuleAdapter(rule, transition)
        action = ra.get_action(0)
        self.assertTrue(rule.rule.id in ra.action_url(action) and \
                        '++0' in ra.action_url(action))

    def test_action_manager_available_actions(self):
        am = ActionManager()
        action_names = [a.title for a in am.available_actions]
        self.assertTrue(action_names == [u'Logger', u'Notify user',
            u'Copy to folder', u'Move to folder', u'Delete object',
            u'Transition workflow state', u'Send email'])

    def test_action_manager_delete_rule(self):
        portal = self.layer['portal']
        am = ActionManager()
        pw = getToolByName(portal, 'portal_workflow')
        workflow = pw['simple_publication_workflow']
        transition = workflow.transitions['publish']
        am.create(transition)

        am.delete_rule_for(transition)
        self.assertEquals(am.get_rule(transition), None)


def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
