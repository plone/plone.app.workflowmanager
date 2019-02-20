from setuptools import find_packages
from setuptools import setup

version = '2.1.2'

setup(name='plone.app.workflowmanager',
      version=version,
      description="A workflow manager for Plone",
      long_description=(
          open("README.rst").read() + "\n" +
          open("CHANGES.rst").read()
      ),
      # Get more strings from https://pypi.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
          "Framework :: Plone",
          "Framework :: Plone :: 4.3",
          "Framework :: Plone :: 5.0",
          "Framework :: Plone :: 5.1",
          "Intended Audience :: Customer Service",
          "Intended Audience :: Developers",
          "License :: OSI Approved :: GNU General Public License (GPL)",
          "Operating System :: OS Independent",
          "Programming Language :: Other Scripting Engines",
          "Programming Language :: Python",
          "Topic :: Internet :: WWW/HTTP :: Site Management",
          "Topic :: Software Development :: Libraries :: Python Modules",
      ],
      keywords='plone workflow manager gui',
      author='Nathan Van Gheem',
      author_email='nguyen@plone.org',
      url='https://github.com/plone/plone.app.workflowmanager',
      license='GPL',
      packages=find_packages('src'),
      package_dir={'': 'src'},
      namespace_packages=['plone', 'plone.app'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'Plone',
          'setuptools',
          'plone.api',
          'plone.app.jquery>=1.7',
          'plone.app.jquerytools',
      ],
      extras_require={
          'test': [
              'plone.app.testing',
              'plone.app.jquerytools',
              'plone.app.robotframework',
              'interlude',
              'unittest2',
          ]
      },
      entry_points="""
      [z3c.autoinclude.plugin]
      target = plone
      """,
      )
