from Products.Five.browser import BrowserView

import json
from plone import api


class GraphLayout(BrowserView):
    """Class to handle the Workflow Manager graph layouts.

        propSheet:
                the property sheet containing all of the layouts

        layout:
                the actual value of the individual property on the propSheet
                representing the layout of the graph
    """

    def __init__(self, context, request, workflow=None):
        self.context = context
        self.request = request

        self.REGISTRY_KEY = "plone.app.workflowmanager.layouts"

        if workflow is None:
            self.workflow = self.request.form['workflow'] or None
        else:
            self.workflow = workflow
        self.layout = {}
        layouts = self.getLayouts()

        if layouts is None:
            layouts = {}

        if self.workflow not in layouts:
            layouts[unicode(self.workflow)] = u'{}'
        else:
            self.layout = json.loads(layouts[self.workflow])

    def __call__(self):
        self.layout = json.loads(self.request.form['layout'])
        self.saveLayout()

    def getLayouts(self):
        return api.portal.get_registry_record(self.REGISTRY_KEY)

    def saveLayout(self):
        layouts = self.getLayouts() or {}
        layouts[unicode(self.workflow)] = unicode(json.dumps(self.layout))
        api.portal.set_registry_record(self.REGISTRY_KEY, layouts)

    def getLayout(self):
        if(self.workflow == ''):
            return False

        return json.dumps(self.layout)
