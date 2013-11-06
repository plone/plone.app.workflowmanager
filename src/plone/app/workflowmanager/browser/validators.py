from OFS.ObjectManager import checkValidId
from Products.CMFCore.utils import getToolByName
from plone.app.workflowmanager.utils import generate_id
from plone.app.workflowmanager import WMMessageFactory as _


def not_empty(form, name):
    v = form.request.get(name, '').strip()
    if v is None or (type(v) in (str, unicode) and \
     len(v) == 0) or (type(v) in (tuple, set, list) and len(v) == 0):
        form.errors[name] = _(u'This field is required.')

    return v


def id(form, name, container):
    elt_id = form.request.get(name, '').strip()
    putils = getToolByName(form.context, 'plone_utils')
    elt_id = generate_id(putils.normalizeString(unicode(elt_id, encoding='utf-8')),
                         container.objectIds())
    try:
        checkValidId(container, elt_id)
    except:
        form.errors[name] = _(u'Invalid workflow name. Please try another.')

    return elt_id


def parse_set_value(form, key):
    val = form.request.get(key)
    if val:
        if type(val) in (str, unicode):
            return set(val.split(','))
        elif type(val) in (tuple, list):
            return set(val)
    else:
        return set(())

    return val
