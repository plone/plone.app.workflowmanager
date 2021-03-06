Changelog
=========

2.1.3 (unreleased)
------------------

- update to build on Plone 5.1 latest
  [tkimnguyen]


2.1.2 (2019-02-20)
------------------

- add uninstall profile
  [tkimnguyen]

- bump buildout Plone versions
  [tkimnguyen]

- add index and allow-hosts for Travis
  [tkimnguyen]


2.1.1 (2019-01-23)
------------------

- add PyPI classifiers for Plone 4.3 and 5.1, document Plone version compatibility, update README
  [tkimnguyen]

- Make sure plone.app.jquerytools is installed when p.a.workflowmanager is installed.
  [timo]

- Add undeclared plone.api dependency.
  [timo]

- Updated JS to work with modern jQuery
  [obct537]

- Replaced portal_properties requirement
  [obct537]

- Updated styling/templates to look correct in Plone 5
  [obct537]

1.2a2 (2/26/2015)
-----------------

- Added in basic QUnit testing setup. Created a few basic tests
  [obct537]

- Pruned now-defunct code from JS. Fixed various minor UI bugs.
  [obct537]

1.2a1 (2/12/2015)
-----------------

- Rewrote back-end JS to be more predictable and flexible
  [obct537]

- AJAX calls now return "intelligent" feedback to tell the graph
  how to update itself to reflect changes. [obct537]


1.1a4 ~ unreleased
------------------

- Updated graph saving system to be far more efficient
  [obct537]

- Graph now updates dynamically whenever changes are saved.
  [obct537]


1.1a3 ~ unreleased
------------------

- Included Springy.js library
  [obct537]

- Numerous small changes to improve stability
  [obct537]

- Created "reorder" functionality using Springy.js
  to help ordering large, complex workflows much easier.
  [obct537]

1.1a2 ~ unreleased
------------------

- Included jsPlumb library.
  [obct537]

- Replaced previous UI with jsPlumb graph layout.
  [obct537]

- Removed older, redundant UI elements.
  Rewrote workflowmanager.js to be more dynamic, to accomodate jsPlumb
  [obct537]


1.1.0 (2017-10-13)
------------------

- Plone 5.0/5.1 compatibility.
  [jaroel,timo]

- Add missing unittest2 dependency to the test dependencies.
  [timo]

- Install plone.app.jquerytools as a dependency
  [iham, bloodbare]


1.0.1 (2014-09-25)
------------------

- Finds actions (content rules) created by older versions of workflow
  manager when generated content rule IDs did not include the workflow
  ID [tkimnguyen]

- Fixed problem with non-ascii characters in graphviz diagram [lewicki]


1.0 (2014-06-16)
----------------

- Show managed permissions in transition permission guards
  [erral]

- Show all permissions managed by the workflow instead of
  hardcoding ones
  [erral]


1.0rc5 (2014-02-19)
-------------------

- Fix: avoid i18n messages to be stored in place of permission ids.
  [thomasdesvenain]

- Fixed MANIFEST.in
  [thomasdesvenain]

1.0rc1 - 2014-02-17
-------------------

- Instantiate transition scripts when we create a transition
  so definition.xml is well generated by Generic Setup.
  [thomasdesvenain]

- Added more strings classifiers and metadata items for this packages
  [macagua]

- Fix workflow, state and transition id generation
  when we have accents in titles.
  [thomasdesvenain]

- Full internationalization.
  French translation.
  [thomasdesvenain, macagua]

- Added Spanish translation.
  [hvelarde]

- double-quote state and transition names in graph view
  [erral]

- replace remaining 'jq' names by 'jQuery' in javascript
  for full Plone 4.3+ compatibility.
  [thomasdesvenain]

- Added Chinese Simplified translation.
  [Jian Aijun]


1.0a4 ~ 2012-05-28
------------------

- show acquired permission setting
  [vangheem]

- revamped styles based on bootstrap
  [vangheem]


1.0a3 - 2011-09-02
------------------

- cloned transition now sets display name to new
  title also.
  [vangheem]

- cancel on confirm save now prevents dialog from
  opening.
  [vangheem]

- fix error with changing source transitions if transitions
  are stored as a tuple or list.
  [vangheem]

1.0a2 - 2011-09-01
------------------

- Add MANIFEST.in.
  [WouterVH]

- use json library and just advertise that
  plone 3 users need to install simplejson
  [vangheem]

- Fix js to work correctly with all versions of
  jquery in selecting input tags correctly.
  [vangheem]


1.0a1 - 2010-12-12
------------------

- Initial release

