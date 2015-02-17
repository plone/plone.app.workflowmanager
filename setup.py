from setuptools import find_packages
from setuptools import setup

version = '1.2a1'

setup(name='plone.app.workflowmanager-overhaul',
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
      author_email='plone-developers@lists.sourceforge.net',
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
          'plone.app.jquery>=1.7'
      ],
      extras_require={
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
