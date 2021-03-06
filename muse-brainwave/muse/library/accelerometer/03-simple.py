import sys
import time
import json

import liblo

from muse_accelerometer_raw import MuseAccelerometerRaw

class MuseServer(liblo.ServerThread):
	#listen for messages on port 5001
	def __init__(self, sampleCount):
		liblo.ServerThread.__init__(self, 5001)
		self.maxSampleCount = sampleCount
		self.sampleCount = 0
		self.isRunning = True

	#receive accelrometer data
	@liblo.make_method('/muse/acc', 'fff')
	def acc_callback(self, path, args):
		print MuseAccelerometerRaw( *args )
		self.sampleCount += 1
		if self.maxSampleCount < self.sampleCount:
			self.isRunning = False

	#handle unexpected messages
	@liblo.make_method(None, None)
	def fallback(self, path, args, types, src):
		pass


if __name__ == "__main__":
	maxSamples = 16
	if len(sys.argv) > 1:
		maxSamples = float(sys.argv[1])

	try:
		server = MuseServer(maxSamples)
	except ServerError, err:
		print str(err)
		sys.exit()

	server.start()

	while server.isRunning:
		time.sleep(1)

