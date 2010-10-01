from plone.testing import Layer
from plone.testing import z2

from plone.app.testing import PLONE_INTEGRATION_TESTING, TEST_USER_NAME, \
    PLONE_FIXTURE, login, ploneSite, quickInstallProduct, IntegrationTesting, \
    PloneSandboxLayer, applyProfile

from Products.CMFCore.utils import getToolByName
from zope.configuration import xmlconfig

class ManagerFixture(PloneSandboxLayer):
    defaultBases = (PLONE_INTEGRATION_TESTING,)

    def setUpZope(self, app, configurationContext):
        # Load ZCML
        import plone.app.workflowmanager
        xmlconfig.file('configure.zcml', plone.app.workflowmanager, context=configurationContext)

    def setUpPloneSite(self, portal):
        pass

    def tearDownZope(self, app):
        pass


MANAGER_FIXTURE = ManagerFixture()
INTEGRATION_MANAGER_TESTING = IntegrationTesting(bases=(MANAGER_FIXTURE,), name='INTEGRATION_MANAGER_TESTING')