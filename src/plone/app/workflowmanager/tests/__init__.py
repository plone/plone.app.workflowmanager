

class TestResponse(object):

    def __init__(self):
        self.headers = {}
        self.redirect = False

    def tell(self, val=None):
        pass

    def setHeader(self, key, val):
        self.headers[key] = val
