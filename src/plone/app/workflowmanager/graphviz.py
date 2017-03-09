#
# This code is directly adapted from
# DCWorkflowGraph and isn't change much at all.
#
import os
from tempfile import mktemp
from os.path import join

from Products.CMFCore.utils import getToolByName

DOT_EXE = 'dot'
bin_search_path = ''

if os.name == 'nt':
    DOT_EXE = 'dot.exe'

    # patch from Joachim Bauch bauch@struktur.de
    # on Windows, the path to the ATT Graphviz installation
    # is read from the registry.
    try:
        import win32api
        import win32con
        # make sure that "key" is defined in our except block
        key = None
        try:
            key = win32api.RegOpenKeyEx(
                win32con.HKEY_LOCAL_MACHINE, r'SOFTWARE\ATT\Graphviz')
            value, type = win32api.RegQueryValueEx(key, 'InstallPath')
            bin_search_path = [join(str(value), 'bin')]
        except:
            if key:
                win32api.RegCloseKey(key)
            # key doesn't exist
            pass
    except ImportError:
        # win32 may be not installed...
        pass
else:
    # for posix systems
    DOT_EXE = 'dot'
    path = os.getenv("PATH")
    bin_search_path = path.split(":")


# following 2 method is copied form PortalTranforms
# Owners of PortalTransforms own the copyright of these 2 functions
class MissingBinary(Exception):
    pass


def bin_search(binary):
    """search the bin_search_path  for a given binary
    returning its fullname or None"""
    result = None
    mode = os.R_OK | os.X_OK
    for p in bin_search_path:
        path = join(p, binary)
        if os.access(path, mode) == 1:
            result = path
            break
    else:
        raise MissingBinary('Unable to find binary "%s"' % binary)
    return result

try:
    bin = bin_search(DOT_EXE)
    HAS_GRAPHVIZ = True
except MissingBinary:
    HAS_GRAPHVIZ = False
    bin = None


def getObjectTitle(object):
    """Get a state/transition title to be displayed in the graph
    """

    id = object.getId()
    title = object.title

    if not title:
        title = id
    else:
        title = '%s\\n(id: %s)' % (title, id)
    return title


def getGuardTitle(guard):
    out = ''
    if guard is not None:
        if guard.expr:
            out += 'Expression: %s; ' % guard.expr.text
        if guard.permissions:
            out += 'Permissions: %s; ' % ','.join(guard.permissions)
        if guard.roles:
            out += 'Roles: %s; ' % ','.join(guard.roles)
        if guard.groups:
            out += 'Groups: %s; ' % ','.join(guard.groups)

    return out


def getPOT(wf):
    """ get the pot, copy from:
         "dcworkfow2dot.py":
         http://awkly.org/Members/sidnei/weblog_storage/blog_27014
        and Sidnei da Silva owns the copyright of the this function
    """
    out = []
    transitions = {}

    out.append('digraph "%s" {' % wf.title)
    transitions_with_init_state = []
    for s in wf.states.objectValues():
        s_id = s.getId()
        s_title = getObjectTitle(s)
        out.append(
            '"%s" [shape=box,label="%s",style="filled",fillcolor="#ffcc99"];' % (
                s_id, s_title))
        for t_id in s.transitions:
            transitions_with_init_state.append(t_id)
            try:
                t = wf.transitions[t_id]
            except KeyError:
                out.append(('# transition "%s" from state "%s" '
                            'is missing' % (t_id, s_id)))
                continue

            new_state_id = t.new_state_id
            # take care of 'remain in state' transitions
            if not new_state_id:
                new_state_id = s_id
            key = (s_id, new_state_id)
            value = transitions.get(key, [])
            t_title = getObjectTitle(t)
            value.append(t_title)
            t_guard = getGuardTitle(t.guard)
            value.append(t_guard)
            transitions[key] = value

    # iterate also on transitions, and add transitions with no initial state
    for t in wf.transitions.objectValues():
        t_id = t.getId()
        if t_id not in transitions_with_init_state:
            new_state_id = t.new_state_id
            if not new_state_id:
                new_state_id = None
            key = (None, new_state_id)
            value = transitions.get(key, [])
            t_title = getObjectTitle(t)
            value.append(t_title)
            t_guard = getGuardTitle(t.guard)
            value.append(t_guard)
            transitions[key] = value

    for k, v in transitions.items():
        out.append('"%s" -> "%s" [label="%s"];' % (k[0], k[1],
                                               ',\\n'.join(v)))

    out.append('}')
    return '\n'.join(out)


def getGraph(workflow, format="gif"):
    """show a workflow as a graph, copy from:
        "OpenFlowEditor":
        http://www.openflow.it/wwwopenflow/Download/OpenFlowEditor_0_4.tgz
    """
    pot = getPOT(workflow)
    portal_properties = getToolByName(workflow, 'portal_properties')
    encoding = portal_properties.site_properties.getProperty(
        'default_charset', 'utf-8')
    if isinstance(pot, unicode):
        pot = pot.encode(encoding)
    infile = mktemp('.dot')
    f = open(infile, 'w')
    f.write(pot)
    f.close()

    outfile = mktemp('.gif')
    os.system('%s -Tgif -o %s %s' % (bin, outfile, infile))
    out = open(outfile, 'rb')
    result = out.read()
    out.close()
    os.remove(outfile)
    os.remove(infile)

    return result
