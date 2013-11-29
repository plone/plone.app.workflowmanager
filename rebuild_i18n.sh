#! /bin/sh
# see http://maurits.vanrees.org/weblog/archive/2010/10/i18n-plone-4 for more information

I18NDOMAIN="plone.app.workflowmanager"
SOURCE="src/plone/app/workflowmanager"
LOGI18NDUDE=$SOURCE/locales/rebuild_i18n.log

# rebuild pot file for package's domain and merge it with any manual translations needed
i18ndude rebuild-pot --pot $SOURCE/locales/$I18NDOMAIN.pot \
                     --merge $SOURCE/locales/$I18NDOMAIN-manual.pot \
                     --create $I18NDOMAIN $SOURCE/validators.py $SOURCE

# synchronise translations for package's domain
for po in $SOURCE/locales/*/LC_MESSAGES/$I18NDOMAIN.po; do
    i18ndude sync --pot $SOURCE/locales/$I18NDOMAIN.pot $po
done

# rebuild pot file for Plone's domain
i18ndude rebuild-pot --pot $SOURCE/locales/plone.pot \
                     --merge $SOURCE/locales/plone-manual.pot \
                     --create plone $SOURCE/configure.zcml $SOURCE/actionmanager.py $SOURCE/profiles/default $SOURCE/browser

# synchronise translations for Plone's domain
for po in $SOURCE/locales/*/LC_MESSAGES/plone.po; do
    i18ndude sync --pot $SOURCE/locales/plone.pot $po
done

WARNINGS=`find . -name "*pt" | xargs i18ndude find-untranslated | grep -e '^-WARN' | wc -l`
ERRORS=`find . -name "*pt" | xargs i18ndude find-untranslated | grep -e '^-ERROR' | wc -l`
FATAL=`find . -name "*pt"  | xargs i18ndude find-untranslated | grep -e '^-FATAL' | wc -l`

echo
echo "There are $WARNINGS warnings \(possibly missing i18n markup\)"
echo "There are $ERRORS errors \(almost definitely missing i18n markup\)"
echo "There are $FATAL fatal errors \(template could not be parsed, eg. if it\'s not html\)"
echo "For more details, run \'find . -name \"\*pt\" \| xargs i18ndude find-untranslated\' or"
echo "Look the rebuild i18n log generate for this script called \'rebuild_i18n.log\' on locales dir"

rm $LOGI18NDUDE
touch $LOGI18NDUDE

find $SOURCE/ -name "*pt" | xargs i18ndude find-untranslated > $LOGI18NDUDE
