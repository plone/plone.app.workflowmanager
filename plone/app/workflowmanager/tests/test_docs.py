from plone.testing import layered
import doctest
from layer import INTEGRATION_MANAGER_TESTING

def test_suite():
    suite = unittest.TestSuite()
    suite.addTests([
        layered(doctest.DocFileSuite('../browser.txt'), layer=INTEGRATION_MANAGER_TESTING),
    ])
    return suite
    