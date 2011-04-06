from plone.memoize.instance import memoize
from zope.component import queryUtility
from plone.contentrules.engine.interfaces import IRuleStorage, \
    IRuleAssignmentManager
from Products.CMFCore.interfaces._events import IActionSucceededEvent
from plone.app.contentrules.conditions.wftransition import \
    IWorkflowTransitionCondition, WorkflowTransitionCondition
from plone.contentrules.engine import utils
from plone.app.contentrules.rule import Rule, get_assignments
from Products.CMFCore.utils import getToolByName
from plone.contentrules.engine.assignments import RuleAssignment


class RuleAdapter(object):

    def __init__(self, rule, transition):
        self.rule = rule
        self.transition = transition

    @property
    def valid(self):
        """
        check if rule is activated and has the right condition set.
        """
        transitions = set([])
        for condition in self.rule.conditions:
            if IWorkflowTransitionCondition.providedBy(condition):
                transitions |= condition.wf_transitions
        return transitions

    @property
    @memoize
    def portal(self):
        return getToolByName(self.transition, 'portal_url').getPortalObject()

    def activate(self):
        """
        1) make sure condition is enabled for transition
        2) enable at root and bubble to item below
        """
        c = WorkflowTransitionCondition()
        c.wf_transitions = self.transition.id
        self.rule.conditions = [c]
        self.rule.event = IActionSucceededEvent

        assignable = IRuleAssignmentManager(self.portal)
        path = '/'.join(self.portal.getPhysicalPath())
        assignable[self.rule.__name__] = RuleAssignment(self.rule.id,
            enabled=True, bubbles=True)
        assignments = get_assignments(self.rule)
        if not path in assignments:
            assignments.insert(path)

    @property
    def name(self):
        return self.rule.__name__

    @property
    def id(self):
        return self.rule.id

    def get_action(self, index):
        return self.rule.actions[index]

    def action_index(self, action):
        return self.rule.actions.index(action)

    def action_url(self, action):
        return '%s/%s/++action++%d/edit' % (
            self.portal.absolute_url(),
            self.rule.id,
            self.action_index(action), )

    def delete_action(self, index):
        self.rule.actions.remove(self.rule.actions[index])

    @property
    def actions(self):
        return self.rule.actions


class ActionManager(object):

    def get_rule(self, transition):
        rules = []
        if self.storage is not None:
            for rule in self.storage.values():
                if rule.__name__ == '--workflowmanager--' + transition.id:
                    return RuleAdapter(rule, transition)

        return None

    def create(self, transition):
        rule = self.get_rule(transition)
        if rule is None:
            id = '--workflowmanager--%s' % transition.id
            r = Rule()
            r.title = u"%s transition content rule" % transition.id
            r.description = u"""This content rule was automatically created
    the workflow manager to create actions on workflow events. If you want the
    behavior to work as expected, do not modify this out of the workflow manager."""
            self.storage[id] = r
            rule = RuleAdapter(r, transition)
            rule.activate()

        return rule

    @property
    @memoize
    def storage(self):
        return queryUtility(IRuleStorage)

    @property
    @memoize
    def available_actions(self):
        return utils.allAvailableActions(IActionSucceededEvent)

    def delete_rule_for(self, transition):
        rule = self.get_rule(transition)
        if rule is not None:
            del self.storage[rule.rule.__name__]
