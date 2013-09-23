Introduction
============


This package provides a GUI for managing custom workflows in Plone.

This is the successor of uwosh.northstar's workflow design tool (North* continues on as a file system product generator, given either a PloneFormGen or Dexterity prototype).

Features
--------

 * add/edit/delete new workflows
 * add content rule actions easily for a workflow transition
 * graph workflows
 * easily manipulate workflow permissions

Graphing
--------

The package also supports graphing workflows. 

The inspiration for this piece was pretty much taken from DCWorkflowGraph.

In order to enable this feature, you'll need to install the Graphviz library.
Information can be found at http://www.graphviz.org

Once you've built Graphviz and have installed it, make sure the "dot"
executable it creates is in your PATH, e.g.

export PATH=$PATH:/usr/local/bin

assuming "make install" placed the Graphviz executables into
/usr/local/bin. You can test that your PATH is set correctly if "which
dot" finds the "dot" executable.

Then restart your Zope or ZEO client. The next time you are looking at
a custom workflow in Workflow Manager, you should see a new "Diagram"
button. When you click on it, it generates a GIF depicting the
workflow's states and transitions.

You may get better results if your state and transition IDs do not include 
hyphens.  Graphviz' "dot" executable will issue warning messages that you 
can find in your instance log if it has trouble understanding the state
and transition names and labels.

Plone 3 Support
---------------

You must also have simplejson installed.
