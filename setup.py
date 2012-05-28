from setuptools import setup, find_packages
import os

version = '1.0a3'

setup(name='plone.app.workflowmanager',
      version=version,
      description="a workflow manager for plone",
      long_description=open("README.txt").read() + "\n" +
                       open(os.path.join("docs", "HISTORY.txt")).read(),
      # Get more strings from http://www.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
        "Framework :: Plone",
        "Programming Language :: Python",
        "Topic :: Software Development :: Libraries :: Python Modules",
        ],
      keywords='plone workflow manager',
      author='Nathan Van Gheem',
      author_email='plone-developers@lists.sourceforge.net',
      url='http://svn.plone.org/svn/plone/plone.app.example',
      license='GPL',
      packages=find_packages('src'),
      package_dir={'': 'src'},
      namespace_packages=['plone', 'plone.app'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'Plone',
          'setuptools',
          'plone.app.jquery>=1.7'
      ],
      extras_require = {
          'test': [
              'plone.app.testing',
              'interlude',
          ]
      },
      entry_points="""
      [z3c.autoinclude.plugin]
      target = plone
      """,
      )
