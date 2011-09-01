import doctest
from plone.testing import layered
import unittest2 as unittest
from plone.app.workflowmanager.testing import FUNCTIONAL_MANAGER_TESTING
import pprint
import interlude

optionflags = (doctest.ELLIPSIS | doctest.NORMALIZE_WHITESPACE)
normal_testfiles = [
    '../standardtiles.txt',
    '../head.txt',
]
testtype_testfiles = [
    '../field.txt',
]


def test_suite():
    suite = unittest.TestSuite()
    suite.addTests([
        layered(doctest.DocFileSuite('../browser.txt',
            optionflags=optionflags,
            globs={'interact': interlude.interact,
                   'pprint': pprint.pprint},
        ),
        layer=FUNCTIONAL_MANAGER_TESTING)])
    return suite
