#!/bin/sh
# Synchronise the .pot with the templates.
i18ndude rebuild-pot --pot locales/plone.app.workflowmanager.pot --create plone.app.workflowmanager --merge locales/plone.app.workflowmanager.pot .

# Synchronise the resulting .pot with the .po files
i18ndude sync --pot locales/plone.app.workflowmanager.pot locales/*/LC_MESSAGES/plone.app.workflowmanager.po

i18ndude sync --pot locales/plone.pot locales/*/LC_MESSAGES/plone.po

