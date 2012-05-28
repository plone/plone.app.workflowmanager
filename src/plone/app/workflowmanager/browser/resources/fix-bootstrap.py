#
# This script prefixes all rules.
# This allows us to have bootstrap css only apply to
# one area of the site
#

_input = open('bootstrap.css')
_output = open('bootstrap-fixed.css', 'w')
_prefix = '.wm'

_ignored_rules = (
    '.tooltip',
    '.popover',
    '.top',
    '.right',
    '.left',
    '.bottom',
    '.modal')

for line in _input.readlines():
    # starts with class rule
    stripped = line.strip()
    if line and not stripped.startswith('@') and \
            (stripped.endswith('{') or stripped.endswith(',')):
        valid = True
        for ignored in _ignored_rules:
            if ignored in line:
                valid = False
                break
        if valid:
            # find replacement position
            pos = 0
            try:
                while line[pos] in (' ', '\t'):
                    pos += 1
                line = line[:pos] + _prefix + ' ' + line[pos:]
            except IndexError:
                pass
    _output.write(line)
_output.close()
_input.close()
