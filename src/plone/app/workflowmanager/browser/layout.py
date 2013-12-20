from Products.CMFCore.utils import getToolByName

class GraphLayout(object):
	"""Class to handle the Workflow Manager graph layouts

		propSheet: 
				the property sheet containing all of the layouts

		layout:
				the actual value of the individual property on the propSheet
				representing the layout of the graph
	"""

	def __init__(self, wf):
		self.workflow = wf
		self.props = getToolByName(self, 'portal_properties')
		

	workflow = ''
	propSheetName = 'Workflow_manager_graph_layouts'
	props = ''

	def createLayout(self):
		sheet = self.getPropSheet()

		sheet.manage_addProperty(self.workflow, "", 'text')

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
			if( not self.createPropSheet(self.propSheetName) ):
				return False

		if( not self.layoutExists() > 0 ):
			self.createLayout()

		sheet = self.getPropSheet()
		return sheet.getProperty(self.workflow)

	def getPropSheet(self):
		return self.props[self.propSheetName]

	def getPropSheetName(self):
		return self.propSheetName

	def getWFTitle(self):
		return self.workflow


	def layoutExists(self):
		sheet = self.props[self.propSheetName]

		return sheet.hasProperty(self.workflow)

	def propSheetExists(self, sheetName):
		return self.props.hasObject(sheetName)



