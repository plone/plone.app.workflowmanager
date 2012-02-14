import unittest2 as unittest

from AccessControl import Unauthorized

from plone.app.workflowmanager.testing import INTEGRATION_MANAGER_TESTING
from plone.app.workflowmanager.testing import BaseTest
from plone.app.workflowmanager.browser.controlpanel import Base


class TestControlPanel(BaseTest):

    layer = INTEGRATION_MANAGER_TESTING

    def test_base_defaults_to_first_workflow_if_list(self):
        view = Base(self.layer['portal'],
            self.getRequest(
                {'selected-workflow': ['simple_publication_workflow']}))
        self.assertTrue(view.selected_workflow is not None)

    def test_base_defaults_to_first_state_if_list(self):
        view = Base(self.layer['portal'], self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']}))
        self.assertTrue(view.selected_state is not None)

    def test_base_defaults_to_first_transition_if_list(self):
        view = Base(self.layer['portal'], self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-transition': ['publish']}))
        self.assertTrue(view.selected_transition is not None)

    def test_base_available_transitions_always_returns_a_list(self):
        view = Base(self.layer['portal'], self.getRequest({
            'selected-workflow': ['one_state_workflow']}))
        self.assertEquals(type(view.available_transitions), list)

    def test_base_available_states_always_returns_a_list(self):
        view = Base(self.layer['portal'], self.getRequest({}))
        self.assertEquals(type(view.available_states), list)

    def test_authorize_raises_unauthorized(self):
        view = Base(self.layer['portal'], self.getRequest({}))
        self.assertRaises(Unauthorized, view.authorize)

    def test_get_transition(self):
        view = Base(self.layer['portal'], self.getRequest({
            'selected-workflow': ['simple_publication_workflow']}))
        self.assertTrue(view.get_transition('publish') is not None)

    def test_get_transition_is_none_if_not_found(self):
        view = Base(self.layer['portal'], self.getRequest({
            'selected-workflow' : ['simple_publication_workflow']}))
        self.assertTrue(view.get_transition('foobar') is None)


def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
