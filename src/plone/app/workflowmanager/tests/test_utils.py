import unittest2 as unittest

from plone.app.workflowmanager.testing import INTEGRATION_MANAGER_TESTING, BaseTest

from plone.app.workflowmanager.utils import generate_id


class TestUtils(BaseTest):

    layer = INTEGRATION_MANAGER_TESTING

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
