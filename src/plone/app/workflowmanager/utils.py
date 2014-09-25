from Products.DCWorkflow.Guard import Guard


def generate_id(org_id, ids):
    count = 1
    new_id = org_id
    while new_id in ids:
        new_id = org_id + '-' + str(count)
        count += 1

    return new_id


def clone_transition(transition, clone):
    transition.description = clone.description
    transition.new_state_id = clone.new_state_id
    transition.trigger_type = clone.trigger_type

    if clone.guard:
        guard = Guard()
        guard.permissions = clone.guard.permissions[:]
        guard.roles = clone.guard.roles[:]
        guard.groups = clone.guard.groups[:]
        transition.guard = guard

    transition.actbox_name = transition.title
    transition.actbox_url = clone.actbox_url.replace(clone.id, transition.id)
    transition.actbox_category = clone.actbox_category
    transition.var_exprs = clone.var_exprs
    transition.script_name = clone.script_name
    transition.after_script_name = clone.after_script_name


def clone_state(state, clone):
    state.transitions = clone.transitions[:]
    state.permission_roles = clone.permission_roles and \
        clone.permission_roles.copy() or None
    state.group_roles = clone.group_roles and clone.group_roles.copy() or None
    state.var_values = clone.var_values and clone.var_values.copy() or None
    state.description = clone.description


def generateRuleName(transition):
    return '--workflowmanager--%s--%s' % (
        transition.getWorkflow().id,
        transition.id)

def generateRuleNameOld(transition):
    return '--workflowmanager--%s' % (
        transition.id)
