from OFS.ObjectManager import checkValidId
from zope.i18n import translate
from Products.CMFCore.utils import getToolByName
from plone.app.workflowmanager.utils import generate_id
from plone.app.workflowmanager import WMMessageFactory as _


def not_empty(form, name):
    v = form.request.get(name, '').strip()
    if v is None or (type(v) in (str, unicode) and \
     len(v) == 0) or (type(v) in (tuple, set, list) and len(v) == 0):
        form.errors[name] = translate(_(u'This field is required.'),
                                      context=form.request)

    return v


def id(form, name, container):
    elt_id = form.request.get(name, '').strip()
    putils = getToolByName(form.context, 'plone_utils')
    elt_id = generate_id(putils.normalizeString(unicode(elt_id, encoding='utf-8')),
                         container.objectIds())
    try:
        checkValidId(container, elt_id)
    except:
        form.errors[name] = translate(_(u'Invalid name. Please try another.'),
                                      context=form.request)

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
