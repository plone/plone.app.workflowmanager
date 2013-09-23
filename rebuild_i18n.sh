#! /bin/sh
# see http://maurits.vanrees.org/weblog/archive/2010/10/i18n-plone-4 for more information

I18NDOMAIN="plone.app.workflowmanager"
SOURCE="src/plone/app/workflowmanager"

# rebuild pot file for package's domain and merge it with any manual translations needed
i18ndude rebuild-pot --pot $SOURCE/locales/$I18NDOMAIN.pot --create $I18NDOMAIN $SOURCE

# synchronise translations for package's domain
for po in $SOURCE/locales/*/LC_MESSAGES/$I18NDOMAIN.po; do
    i18ndude sync --pot $SOURCE/locales/$I18NDOMAIN.pot $po
done

# rebuild pot file for Plone's domain
i18ndude rebuild-pot --pot $SOURCE/locales/plone.pot --create plone $SOURCE/configure.zcml $SOURCE/profiles/default

# synchronise translations for Plone's domain
for po in $SOURCE/locales/*/LC_MESSAGES/plone.po; do
    i18ndude sync --pot $SOURCE/locales/plone.pot $po
done
