from plone.app.workflowmanager import WMMessageFactory as _

managed_permissions = [
    {'perm': 'Add portal content',
     'name': _(u'Add'),
     'description': _(u'Add content in this container.')
    },

    {'perm': 'Modify portal content',
     'name': _(u'Edit'),
     'description': _(u'Allows changing the content of an item.')
    },

    {'perm': 'View',
     'name': _(u'View'),
     'description': _(u'Not only means view HTML, but also FTP, WebDAV '
                      u'and other forms of access.')
    },

    {'perm': 'Review portal content',
     'name': _(u'Review'),
     'description': _(u'Allowed to review the content.')
    },

    {'perm': 'Change portal events',
     'name': _(u'Change Events'),
     'description': _(u'Allow to update events')
    },

    {'perm': 'List folder contents',
     'name': _(u'List'),
     'description': _(u"List the contents of a folder. This doesn't check "
                      u"if you have access to view the actual object listed.")
    },

    {'perm': 'Access contents information',
     'name': _(u'Access'),
     'description': _(u'Allow access to content without necessarily viewing '
                      u'the object. For example, in a list of results.')
    }]

allowed_guard_permissions = {
    'rr': 'Request review',
    'rpc': 'Review portal content',
    'mpc': 'Modify portal content'
}
