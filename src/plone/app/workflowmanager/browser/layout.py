from Products.CMFCore.utils import getToolByName
from Products.Five.browser import BrowserView
from zope.component import getMultiAdapter

class GraphLayout(BrowserView):
    """Class to handle the Workflow Manager graph layouts

        propSheet: 
                the property sheet containing all of the layouts

        layout:
                the actual value of the individual property on the propSheet
                representing the layout of the graph
    """

    def __init__(self, context, request):
    	self.props = getToolByName(self, 'portal_properties')
    	self.context = context
    	self.request = request

    def __call__(self):
    	self.setWorkflow(self.request.form['workflow'])
    	if( self.layoutExists() ):
    		self.editLayout(self.request.form['layout'])
    	else:
    		self.createLayout()
    		self.editLayout(self.request.form['layout'])

    workflow = ''
    propSheetName = 'Workflow_manager_graph_layouts'

    def createLayout(self, layout=""):
        sheet = self.getPropSheet()

        #the manage_changeProperties method is broken
        #so just delete the current one. 
        #At the end of the day, it does the same thing.
        if( self.layoutExists() ):
        	sheet.manage_delProperties({self.workflow})

        sheet.manage_addProperty(self.workflow, layout, 'text')

    def createPropSheet(self):
        self.props.addPropertySheet(self.propSheetName)

        return self.propSheetExists(self.propSheetName)

    def editLayout(self, layout):
        sheet = self.getPropSheet()

        #he manage_changeProperties 
        #method appears to be broken, so we'll just delete
        #the old layout and create a new one.
        sheet.manage_delProperties({self.workflow})

        sheet.manage_addProperty(self.workflow, layout, 'text')

    def getLayout(self):

        if( self.workflow == '' ):
            return False

        if( not self.propSheetExists(self.propSheetName) ):
            if( not self.createPropSheet() ):
                return False

        if( not self.layoutExists() > 0 ):
            self.createLayout()

        sheet = self.getPropSheet()
        layout = sheet.getProperty(self.workflow)

        return layout

    def getPropSheet(self):
    	props = getToolByName(self, 'portal_properties')
        return props[self.propSheetName]

    def getPropSheetName(self):
        return self.propSheetName

    def layoutExists(self):
        sheet = self.props[self.propSheetName]

        return sheet.hasProperty(self.workflow)

    def propSheetExists(self, sheetName):
    	props = getToolByName(self, 'portal_properties')
        return props.hasObject(sheetName)

    def setWorkflow(self, workflow):
    	self.workflow = workflow


