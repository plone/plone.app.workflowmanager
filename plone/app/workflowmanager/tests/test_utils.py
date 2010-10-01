import unittest2 as unittest

from plone.app.testing import PLONE_INTEGRATION_TESTING, TEST_USER_NAME, \
    login, ploneSite, quickInstallProduct

from layer import INTEGRATION_MANAGER_TESTING

class TestUtils(unittest.TestCase):

    layer = INTEGRATION_MANAGER_TESTING