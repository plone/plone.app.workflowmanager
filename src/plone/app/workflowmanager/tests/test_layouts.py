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

from plone.app.workflowmanager.browser.layout import GraphLayout


class TestActions(BaseTest):

    layer = INTEGRATION_MANAGER_TESTING

    def test_prop_sheet_exists(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        props = getToolByName(portal, 'portal_properties')

        sheetName = gl.getPropSheetName()
        props.addPropertySheet(sheetName)
        exists = gl.propSheetExists(sheetName)

        self.assertTrue(exists)

    def test_create_prop_sheet(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        sheetName = gl.getPropSheetName()

        props = getToolByName(portal, 'portal_properties')

        exists = gl.propSheetExists(sheetName)
        self.assertFalse(exists)

        gl.createPropSheet()

        exists = gl.propSheetExists(sheetName)
        self.assertTrue(exists)

    def test_layout_exists(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        sheetName = gl.getPropSheetName()

        props = getToolByName(portal, 'portal_properties')

        props.addPropertySheet(sheetName)
        gl.setWorkflow('simple_publication_workflow')

        props[sheetName].manage_addProperty('simple_publication_workflow', '','text')
        exists = gl.layoutExists()

        self.assertEqual( exists, 1 )

    def test_create_layout(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        sheetName = gl.getPropSheetName()
        gl.setWorkflow('simple_publication_workflow')

        props = getToolByName(portal, 'portal_properties')

        props.addPropertySheet(sheetName)
        
        gl.createLayout()

        exists = props[sheetName].hasProperty('simple_publication_workflow')
        self.assertEqual( exists, 1 )

    def test_get_layout(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)

        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        sheetName = gl.getPropSheetName()

        props = getToolByName(portal, 'portal_properties')

        props.addPropertySheet(sheetName)

        sheetName = gl.getPropSheetName()
        props[sheetName].manage_addProperty('simple_publication_workflow', 'test', 'text')

        output = gl.getLayout()
        self.assertEqual( output, 'test' )

    def test_get_layout(self):
        portal = self.layer['portal']
        login(portal, TEST_USER_NAME)
        req = self.getRequest({
            'selected-workflow': ['simple_publication_workflow'],
            'selected-state': ['published']})

        gl = GraphLayout(portal, req)
        sheetName = gl.getPropSheetName()
        gl.setWorkflow('simple_publication_workflow')

        props = getToolByName(portal, 'portal_properties')

        props.addPropertySheet(sheetName)

        sheetName = gl.getPropSheetName()
        props[sheetName].manage_addProperty('simple_publication_workflow', 'test', 'text')

        output = gl.getLayout()
        gl.editLayout("words words words")
        output2 = gl.getLayout()
        
        self.assertNotEqual( output, output2 )

def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
