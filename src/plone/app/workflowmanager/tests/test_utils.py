import unittest2 as unittest

from plone.app.testing import PLONE_INTEGRATION_TESTING, TEST_USER_NAME, \
    login, ploneSite, quickInstallProduct

from layer import INTEGRATION_MANAGER_TESTING

from plone.app.workflowmanager.utils import json, generate_id


class TestUtils(unittest.TestCase):

    layer = INTEGRATION_MANAGER_TESTING

    def test_json(self):
        testing = {
            'boolean': True,
            'string': 'foobar',
            'dict': { 'x': 'y'},
            'list': ['1', 2, '3'],
            'integer': 5
        }

        resp = json(testing)
        self.assertEquals(resp, '{"list": ["1",2,"3"], "boolean": true, "dict": {"x" : "y"}, "string": "foobar", "integer": 5}')

    def test_generate_id(self):
        title = "1"
        ids = []
        id = generate_id(title, ids)
        self.assertEquals(title, id)

    def test_generate_id_with_ids(self):
        title = '1'
        ids = ['1', '2', '3']
        id = generate_id(title, ids)
        self.assertEquals(title + '-1', id)

        ids.append(id)
        id = generate_id(title, ids)
        self.assertEquals(title + '-2', id)


def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
