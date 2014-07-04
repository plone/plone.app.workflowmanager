from Selenium2Library import Selenium2Library
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class CustomSeleniumLibrary(Selenium2Library):

	def clear_element(self, element):
		self._current_browser().find_element_by_id(element).clear()
		return True

	def get_newest_tinyMCE_window(self):
		frame = self.get_new_window_id()
		self._current_browser().switch_to_frame(frame)
		return True

	def get_new_window_id(self):	
		frame = self._current_browser().execute_script('return tinyMCE.activeEditor.windowManager._frontWindow().iframeElement.id')
		return frame

	def handle_prompts(self):
		# Thanks to nemesys on StackOverflow :)
		try:
			WebDriverWait(self._current_browser(), 3).until(EC.alert_is_present(), 'Failure')

			alert = self._current_browser().switch_to_alert()
			alert.accept()
			print "alert accepted"
		except TimeoutException:
			raise AssertionError("No confirmation alert.")

	def wait_for_new_window(self):
		wait = WebDriverWait(self._current_browser(), 10)
		wait.until(lambda driver: self._current_browser().find_element_by_id(self.get_new_window_id()))
		return True