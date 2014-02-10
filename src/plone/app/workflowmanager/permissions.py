from zope.app.component.hooks import getSite
from Products.CMFCore.utils import getToolByName
from plone.app.workflowmanager import WMMessageFactory as _


def managed_permissions(wfid=None):
    if wfid is None:
        return []

    site = getSite()
    wtool = getToolByName(site, 'portal_workflow')
    wf = wtool.get(wfid)
    items = []
    for permission in wf.permissions:
        data = {}
        data['perm'] = permission
        data['name'] = _(permission)
        data['description'] = u''
        items.append(data)

    return items

allowed_guard_permissions = {
    'rr': _(u'Request review'),
    'rpc': _(u'Review portal content'),
    'mpc': _(u'Modify portal content')
}
