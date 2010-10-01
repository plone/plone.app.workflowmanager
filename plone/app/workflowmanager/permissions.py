
managed_permissions = [
    {
        'perm' : 'Add portal content',
        'name' : 'Add',
        'description' : 'Add content in this container.'
    },{
        'perm' : 'Modify portal content',
        'name' : 'Edit',
        'description' : 'Allows changing the content of an item.'
    },{
        'perm' : 'View',
        'name' : 'View',
        'description' : 'Not only means view HTML, but also FTP, WebDAV and other forms of access.'
    },{
        'perm' : 'Review portal content',
        'name' : 'Review',
        'description' : 'Allowed to review the content.'
    },{
        'perm' : 'List folder contents',
        'name' : 'List',
        'description' : "List the contents of a folder. This doesn't check if you have access to view the actual object listed."
    },{
        'perm' : 'Access contents information',
        'name' : 'Access',
        'description' : 'Allow access to content without necessarily viewing the object. For example, in a list of results.'
    }
]

allowed_guard_permissions = {

    'rr' : 'Request review',
    'rpc' : 'Review portal content',
    'mpc' : 'Modify portal content'

}